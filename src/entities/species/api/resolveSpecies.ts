import type { SupabaseClient } from "@supabase/supabase-js";
import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { SPECIES_COLUMNS } from "../model/columns";
import type { Species } from "../model/types";
import { getSpeciesDetails, searchSpecies, type PerenualSpeciesDetails } from "./perenualApi";

// Same model as the identification call - see analyzePlantPhotoAction.ts
// for why (gemini-2.5-flash/-lite are unavailable to this project's key).
const MODEL = "gemini-3.5-flash";

const localizedResponseSchema = {
  type: Type.OBJECT,
  properties: { ro: { type: Type.STRING }, en: { type: Type.STRING }, ru: { type: Type.STRING } },
  required: ["ro", "en", "ru"],
};

const PROSE_SCHEMA = {
  type: Type.OBJECT,
  properties: { description: localizedResponseSchema, care: localizedResponseSchema },
  required: ["description", "care"],
};

const localizedSchema = z.object({ ro: z.string(), en: z.string(), ru: z.string() });
const proseSchema = z.object({ description: localizedSchema, care: localizedSchema });
type LocalizedProse = z.infer<typeof proseSchema>;

interface GardenContext {
  hardinessZone: string | null;
  lastFrostDate: string | null;
  firstFrostDate: string | null;
}

function contextLine(gardenContext: GardenContext): string {
  if (!gardenContext.hardinessZone) return "";
  return (
    `Garden context: hardiness zone ${gardenContext.hardinessZone}` +
    (gardenContext.lastFrostDate ? `, last spring frost ~${gardenContext.lastFrostDate}` : "") +
    (gardenContext.firstFrostDate ? `, first autumn frost ~${gardenContext.firstFrostDate}` : "") +
    "."
  );
}

// Retries once with a stricter instruction before giving up - structured
// output is "near-deterministic, not a hard guarantee" per Google's own
// docs, so this still fails closed (returns null) rather than trusting
// the first response blindly.
async function callGeminiJSON<T>(
  ai: GoogleGenAI,
  prompt: string,
  schema: object,
  zodSchema: z.ZodType<T>
): Promise<T | null> {
  const attempts = [
    prompt,
    `${prompt}\n\nYour previous response was not valid JSON matching the schema. Respond with ONLY the JSON object, nothing else.`,
  ];
  for (const attempt of attempts) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: [{ parts: [{ text: attempt }] }],
        config: { responseMimeType: "application/json", responseSchema: schema },
      });
      if (!response.text) continue;
      const parsed = zodSchema.safeParse(JSON.parse(response.text));
      if (parsed.success) return parsed.data;
    } catch {
      // network/parse error on this attempt - fall through to retry
    }
  }
  return null;
}

// Phrases already-verified facts into localized prose - used for BOTH
// data sources, so the UI has one consistent, fully-localized
// description+care text regardless of where the facts came from. For the
// Perenual path this is a translation/phrasing pass over given facts
// (explicitly told not to add anything); for the no-match path it's
// Gemini's own knowledge, same as before.
async function generateLocalizedProse(
  geminiApiKey: string | null,
  prompt: string
): Promise<LocalizedProse | null> {
  if (!geminiApiKey) return null;
  return callGeminiJSON(new GoogleGenAI({ apiKey: geminiApiKey }), prompt, PROSE_SCHEMA, proseSchema);
}

// Cache-first: one Perenual (or Gemini-fallback) lookup per species,
// shared by every plant instance of it. Always returns a real row (never
// null) once a scientificNameGuess is given - even when Perenual has no
// match and the prose call also fails, a bare row with just the name is
// inserted so the identification itself is never lost, only the prose
// beneath it (which the UI shows a fallback message for instead).
export async function resolveSpecies(
  supabase: SupabaseClient,
  scientificNameGuess: string,
  geminiApiKey: string | null,
  gardenContext: GardenContext
): Promise<Species | null> {
  const guess = scientificNameGuess.trim();
  if (!guess) return null;

  const { data: cached } = await supabase
    .from("species")
    .select(SPECIES_COLUMNS)
    .ilike("scientific_name", guess)
    .maybeSingle();
  if (cached) return repairMissingProse(supabase, cached as unknown as Species, geminiApiKey, gardenContext);

  const perenualRow = await tryResolveFromPerenual(supabase, guess, geminiApiKey, gardenContext);
  if (perenualRow) return perenualRow;

  return resolveWithGeminiFallback(supabase, guess, geminiApiKey, gardenContext);
}

// The verified facts the grounding prompt is allowed to phrase. Kept
// source-agnostic so the prompt can be rebuilt either from a fresh
// Perenual response (first analysis) or from the columns already stored on
// a cached species row (the repair path below) - the repair therefore
// costs no extra Perenual call.
interface ProseFacts {
  commonName: string | null;
  watering: string | null;
  sunlight: string[] | null;
  careLevel: string | null;
  growthRate: string | null;
  droughtTolerant: boolean | null;
  description: string | null;
}

function factsFromPerenual(details: PerenualSpeciesDetails): ProseFacts {
  return {
    commonName: details.common_name ?? null,
    watering: details.watering ?? null,
    sunlight: details.sunlight ?? null,
    careLevel: details.care_level ?? null,
    growthRate: details.growth_rate ?? null,
    droughtTolerant: details.drought_tolerant ?? null,
    description: details.description ?? null,
  };
}

// Used when Perenual has no match, so there are no verified facts to
// ground on and this leans on the model's own knowledge instead.
function geminiFallbackPrompt(scientificName: string, gardenContext: GardenContext): string {
  return (
    `Write a short plant-care summary for "${scientificName}". ${contextLine(gardenContext)}\n\n` +
    `Respond with JSON: description (1-2 sentences) and care (short care ` +
    `advice covering watering, light, and common issues) - each written ` +
    `separately in Romanian (ro), English (en), and Russian (ru).`
  );
}

// The prose call is fail-open: a species whose translation failed is still
// cached (losing the identification over a failed description would be
// worse), which used to make that failure permanent - the row is found by
// scientific_name on every later analysis and returned as-is, so the
// translation was never retried and the UI fell back to the raw English
// Perenual description forever.
//
// So the gap is repaired on read instead. Rebuilt from the row's own
// stored facts, so no second Perenual call. Still fail-open: if the
// retry also fails, the caller gets the untouched cached row and the next
// analysis simply tries again.
async function repairMissingProse(
  supabase: SupabaseClient,
  species: Species,
  geminiApiKey: string | null,
  gardenContext: GardenContext
): Promise<Species> {
  if (species.fallbackDescription && species.fallbackCare) return species;

  const prompt =
    species.dataSource === "perenual"
      ? perenualGroundingPrompt(species.scientificName, factsFromSpecies(species), gardenContext)
      : geminiFallbackPrompt(species.scientificName, gardenContext);

  const prose = await generateLocalizedProse(geminiApiKey, prompt);
  if (!prose) return species;

  const { data: updated } = await supabase
    .from("species")
    .update({ fallback_description: prose.description, fallback_care: prose.care })
    .eq("id", species.id)
    .select(SPECIES_COLUMNS)
    .maybeSingle();

  // A null here means the update matched no row - most likely the RLS
  // repair policy isn't in place yet. Falling back to the in-memory values
  // keeps this analysis localized even when the write didn't stick.
  return (
    (updated as unknown as Species) ?? {
      ...species,
      fallbackDescription: prose.description,
      fallbackCare: prose.care,
    }
  );
}

function factsFromSpecies(species: Species): ProseFacts {
  return {
    commonName: species.commonName,
    watering: species.watering,
    sunlight: species.sunlight,
    careLevel: species.careLevel,
    growthRate: species.growthRate,
    droughtTolerant: species.droughtTolerant,
    description: species.description,
  };
}

function perenualGroundingPrompt(scientificName: string, details: ProseFacts, gardenContext: GardenContext): string {
  const facts = [
    details.commonName && `Common name: ${details.commonName}`,
    details.watering && `Watering: ${details.watering}`,
    details.sunlight?.length && `Sunlight: ${details.sunlight.join(", ")}`,
    details.careLevel && `Care level: ${details.careLevel}`,
    details.growthRate && `Growth rate: ${details.growthRate}`,
    details.droughtTolerant != null && `Drought tolerant: ${details.droughtTolerant ? "yes" : "no"}`,
    details.description && `Description: ${details.description}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    `Translate and phrase the following VERIFIED facts about "${scientificName}" ` +
    `into natural text. Do not add any fact that isn't given below.\n\n${facts}\n\n` +
    `${contextLine(gardenContext)}\n\n` +
    `Respond with JSON: description (1-2 sentences, based on the description ` +
    `above) and care (short care advice covering watering, light, and common ` +
    `issues, based strictly on the facts above) - each written separately in ` +
    `Romanian (ro), English (en), and Russian (ru).`
  );
}

async function tryResolveFromPerenual(
  supabase: SupabaseClient,
  guess: string,
  geminiApiKey: string | null,
  gardenContext: GardenContext
): Promise<Species | null> {
  const results = await searchSpecies(guess);
  const first = results?.[0];
  if (!first) return null;

  const details = await getSpeciesDetails(first.id);
  if (!details) return null;

  const canonicalName = first.scientific_name?.[0]?.trim() || guess;
  const prose = await generateLocalizedProse(
    geminiApiKey,
    perenualGroundingPrompt(canonicalName, factsFromPerenual(details), gardenContext)
  );

  const { data: inserted } = await supabase
    .from("species")
    .insert({
      scientific_name: canonicalName,
      data_source: "perenual",
      perenual_id: details.id,
      common_name: details.common_name,
      watering: details.watering,
      watering_benchmark_value: details.watering_general_benchmark?.value ?? null,
      watering_benchmark_unit: details.watering_general_benchmark?.unit ?? null,
      sunlight: details.sunlight,
      pruning_month: details.pruning_month,
      hardiness_min: details.hardiness?.min ? parseInt(details.hardiness.min, 10) : null,
      hardiness_max: details.hardiness?.max ? parseInt(details.hardiness.max, 10) : null,
      soil: details.soil,
      pest_susceptibility: details.pest_susceptibility,
      drought_tolerant: details.drought_tolerant,
      poisonous_to_humans: details.poisonous_to_humans,
      poisonous_to_pets: details.poisonous_to_pets,
      care_level: details.care_level,
      growth_rate: details.growth_rate,
      description: details.description,
      fallback_description: prose?.description ?? null,
      fallback_care: prose?.care ?? null,
      type: details.type,
      cycle: details.cycle,
      family: details.family,
      genus: details.genus,
      other_name: details.other_name,
      origin: details.origin,
      propagation: details.propagation,
      dimensions: details.dimensions,
      plant_anatomy: details.plant_anatomy,
      pruning_count: details.pruning_count,
      maintenance: details.maintenance,
      flowering_season: details.flowering_season,
      harvest_season: details.harvest_season,
      // Only the URL is kept - the rest of default_image is licence
      // metadata for images we don't otherwise use.
      default_image_url:
        details.default_image?.regular_url ?? details.default_image?.small_url ?? null,
      salt_tolerant: details.salt_tolerant,
      thorny: details.thorny,
      invasive: details.invasive,
      tropical: details.tropical,
      indoor: details.indoor,
      flowers: details.flowers,
      cones: details.cones,
      fruits: details.fruits,
      edible_fruit: details.edible_fruit,
      leaf: details.leaf,
      edible_leaf: details.edible_leaf,
      cuisine: details.cuisine,
      medicinal: details.medicinal,
      seeds: details.seeds,
    })
    .select(SPECIES_COLUMNS)
    .single();
  if (inserted) return inserted as unknown as Species;

  // Insert failed - most likely a concurrent analysis of another instance
  // of the same species already cached it (unique scientific_name). Check
  // once more before giving up on the Perenual path.
  const { data: retry } = await supabase
    .from("species")
    .select(SPECIES_COLUMNS)
    .ilike("scientific_name", canonicalName)
    .maybeSingle();
  return (retry as unknown as Species) ?? null;
}

async function resolveWithGeminiFallback(
  supabase: SupabaseClient,
  guess: string,
  geminiApiKey: string | null,
  gardenContext: GardenContext
): Promise<Species | null> {
  const prose = await generateLocalizedProse(geminiApiKey, geminiFallbackPrompt(guess, gardenContext));

  const { data: inserted } = await supabase
    .from("species")
    .insert({
      scientific_name: guess,
      data_source: "gemini_fallback",
      fallback_description: prose?.description ?? null,
      fallback_care: prose?.care ?? null,
    })
    .select(SPECIES_COLUMNS)
    .single();
  if (inserted) return inserted as unknown as Species;

  const { data: retry } = await supabase
    .from("species")
    .select(SPECIES_COLUMNS)
    .ilike("scientific_name", guess)
    .maybeSingle();
  return (retry as unknown as Species) ?? null;
}

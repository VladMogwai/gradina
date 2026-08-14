"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { resolveSpecies } from "@/entities/species/api/resolveSpecies";
import type { Species } from "@/entities/species";
import { createClient } from "@/shared/api/supabase/server";
import { PLANT_PHOTOS_BUCKET } from "./plantPhotoApi";

// Free-tier model; gemini-2.5-flash and gemini-2.5-flash-lite are no
// longer available to this project (confirmed via a live API call, not
// docs), so this is the current mainline Flash model instead.
const MODEL = "gemini-3.5-flash";

// Identification only - no care text. Care facts are grounded in Perenual
// (see resolveSpecies.ts), not guessed by the model.
const IDENTIFY_PROMPT = `You are identifying a garden plant from a photo.

Give your best single guess even if you are not fully sure. Respond with
a JSON object matching the required schema:
- scientific_name: the Latin genus + species, your single best guess
- confidence: your own honest self-assessment of this identification -
  "low", "medium", or "high". Never claim "high" unless the photo makes
  the species genuinely unambiguous.`;

const IDENTIFY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    scientific_name: { type: Type.STRING },
    confidence: { type: Type.STRING, enum: ["low", "medium", "high"] },
  },
  required: ["scientific_name", "confidence"],
};

const identifySchema = z.object({
  scientific_name: z.string().min(1),
  confidence: z.enum(["low", "medium", "high"]),
});
type Identification = z.infer<typeof identifySchema>;

export type AnalyzePlantPhotoResult =
  | { ok: true; species: Species; confidence: Identification["confidence"]; analyzedAt: string }
  | {
      ok: false;
      error: "not_authenticated" | "no_photo" | "not_configured" | "request_failed" | "invalid_response" | "save_failed";
    };

// Retries once with a stricter instruction before giving up - structured
// output is "near-deterministic, not a hard guarantee" per Google's own
// docs. On repeated failure this fails closed: nothing gets persisted.
async function identify(ai: GoogleGenAI, base64Image: string, mimeType: string): Promise<Identification | null> {
  const attempts = [
    IDENTIFY_PROMPT,
    `${IDENTIFY_PROMPT}\n\nYour previous response was not valid JSON matching the schema. Respond with ONLY the JSON object, nothing else.`,
  ];
  for (const prompt of attempts) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: [{ parts: [{ text: prompt }, { inlineData: { data: base64Image, mimeType } }] }],
        config: { responseMimeType: "application/json", responseSchema: IDENTIFY_SCHEMA },
      });
      if (!response.text) continue;
      const parsed = identifySchema.safeParse(JSON.parse(response.text));
      if (parsed.success) return parsed.data;
    } catch {
      // network/parse error on this attempt - fall through to retry
    }
  }
  return null;
}

// Best-effort: every failure path returns a typed error instead of
// throwing, so a bad analysis never corrupts the plant's existing state.
export async function analyzePlantPhoto(plantId: string): Promise<AnalyzePlantPhotoResult> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) return { ok: false, error: "not_configured" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_authenticated" };

  // Look up the primary (first) photo ourselves - RLS-scoped to the
  // caller's own plants via plant_photos' garden_plants -> garden_plans ->
  // user_id policy - instead of trusting a client-supplied URL as a
  // server-side fetch target. With multiple photos, only the primary one
  // gets analyzed for now; which photo that is may change later.
  const { data: photo, error: photoError } = await supabase
    .from("plant_photos")
    .select("storage_path")
    .eq("plant_id", plantId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (photoError) return { ok: false, error: "request_failed" };
  if (!photo) return { ok: false, error: "no_photo" };
  const photoUrl = supabase.storage.from(PLANT_PHOTOS_BUCKET).getPublicUrl(photo.storage_path).data.publicUrl;

  let base64Image: string;
  let mimeType: string;
  try {
    const photoResponse = await fetch(photoUrl);
    if (!photoResponse.ok) throw new Error("photo fetch failed");
    mimeType = photoResponse.headers.get("content-type") ?? "image/jpeg";
    base64Image = Buffer.from(await photoResponse.arrayBuffer()).toString("base64");
  } catch {
    return { ok: false, error: "request_failed" };
  }

  const ai = new GoogleGenAI({ apiKey: geminiKey });
  const identification = await identify(ai, base64Image, mimeType);
  if (!identification) return { ok: false, error: "invalid_response" };

  // The garden's climate settings, only needed if Perenual has no match
  // for this species and resolveSpecies falls back to Gemini prose.
  const { data: plant } = await supabase.from("garden_plants").select("garden_id").eq("id", plantId).maybeSingle();
  const { data: garden } = plant
    ? await supabase
        .from("garden_plans")
        .select("hardinessZone:hardiness_zone, lastFrostDate:last_frost_date, firstFrostDate:first_frost_date")
        .eq("id", plant.garden_id)
        .maybeSingle()
    : { data: null };

  const species = await resolveSpecies(supabase, identification.scientific_name, geminiKey, {
    hardinessZone: garden?.hardinessZone ?? null,
    lastFrostDate: garden?.lastFrostDate ?? null,
    firstFrostDate: garden?.firstFrostDate ?? null,
  });
  if (!species) return { ok: false, error: "invalid_response" };

  const analyzedAt = new Date().toISOString();
  const { error: dbError } = await supabase
    .from("garden_plants")
    .update({ species_id: species.id, identification_confidence: identification.confidence, analyzed_at: analyzedAt })
    .eq("id", plantId);
  if (dbError) return { ok: false, error: "save_failed" };

  return { ok: true, species, confidence: identification.confidence, analyzedAt };
}

// Server-only: PERENUAL_API_KEY must never reach the client. Only ever
// import this from a Server Action / route handler, never a "use client"
// component - see resolveSpecies.ts, the sole caller.

const BASE_URL = "https://perenual.com/api/v2";

export interface PerenualSearchResult {
  id: number;
  common_name: string | null;
  scientific_name: string[];
}

export interface PerenualDimension {
  type: string; // "Height" | "Spread"
  min_value: number;
  max_value: number;
  unit: string; // "feet" | "inches" | "cm"
}

export interface PerenualAnatomy {
  part: string;
  color: string[];
}

export interface PerenualSpeciesDetails {
  id: number;
  common_name: string | null;
  watering: string | null;
  watering_general_benchmark: { value: string; unit: string } | null;
  sunlight: string[] | null;
  pruning_month: string[] | null;
  hardiness: { min: string; max: string } | null;
  soil: string[] | null;
  pest_susceptibility: string[] | null;
  drought_tolerant: boolean | null;
  poisonous_to_humans: boolean | null;
  poisonous_to_pets: boolean | null;
  care_level: string | null;
  growth_rate: string | null;
  description: string | null;

  // Everything below is also on the free tier - see the
  // 20260820000000_species_full_perenual migration for what each means and
  // for the fields deliberately left out (paid, always-null, or link-only).
  type: string | null;
  cycle: string | null;
  family: string | null;
  genus: string | null;
  other_name: string[] | null;
  origin: string[] | null;
  propagation: string[] | null;
  dimensions: PerenualDimension[] | null;
  plant_anatomy: PerenualAnatomy[] | null;
  pruning_count: { amount: number; interval: string } | null;
  maintenance: string | null;
  flowering_season: string | null;
  harvest_season: string | null;
  default_image: { thumbnail?: string; small_url?: string; regular_url?: string } | null;

  salt_tolerant: boolean | null;
  thorny: boolean | null;
  invasive: boolean | null;
  tropical: boolean | null;
  indoor: boolean | null;
  flowers: boolean | null;
  cones: boolean | null;
  fruits: boolean | null;
  edible_fruit: boolean | null;
  leaf: boolean | null;
  edible_leaf: boolean | null;
  cuisine: boolean | null;
  medicinal: boolean | null;
  seeds: boolean | null;
}

// Returns null on any failure (network error, non-2xx, no results) -
// callers treat "no Perenual data" as a normal, expected outcome (the
// gemini_fallback path), not an error to surface.
export async function searchSpecies(query: string): Promise<PerenualSearchResult[] | null> {
  const apiKey = process.env.PERENUAL_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `${BASE_URL}/species-list?key=${apiKey}&q=${encodeURIComponent(query)}`
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: PerenualSearchResult[] };
    return body.data ?? null;
  } catch {
    return null;
  }
}

export async function getSpeciesDetails(id: number): Promise<PerenualSpeciesDetails | null> {
  const apiKey = process.env.PERENUAL_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(`${BASE_URL}/species/details/${id}?key=${apiKey}`);
    if (!res.ok) return null;
    return (await res.json()) as PerenualSpeciesDetails;
  } catch {
    return null;
  }
}

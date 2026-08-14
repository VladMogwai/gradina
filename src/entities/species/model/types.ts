export type SpeciesDataSource = "perenual" | "gemini_fallback";

export interface SpeciesLocalized {
  ro: string;
  en: string;
  ru: string;
}

// Shared, cached-once reference data - never per-plant. Only one of the
// two field groups below is populated, matching dataSource: the Perenual
// block when a real match was found (id 1-3000 on the free tier), the
// fallback block when Perenual had nothing and a validated Gemini prose
// pass filled the gap instead.
export interface Species {
  id: string;
  scientificName: string;
  dataSource: SpeciesDataSource;

  perenualId: number | null;
  commonName: string | null;
  watering: string | null;
  wateringBenchmarkValue: string | null;
  wateringBenchmarkUnit: string | null;
  sunlight: string[] | null;
  pruningMonth: string[] | null;
  hardinessMin: number | null;
  hardinessMax: number | null;
  soil: string[] | null;
  pestSusceptibility: string[] | null;
  droughtTolerant: boolean | null;
  poisonousToHumans: boolean | null;
  poisonousToPets: boolean | null;
  careLevel: string | null;
  growthRate: string | null;
  description: string | null;

  fallbackDescription: SpeciesLocalized | null;
  fallbackCare: SpeciesLocalized | null;
}

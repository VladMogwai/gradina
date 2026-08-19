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

  // Perenual free-tier extras. Enum-ish text fields (type, cycle,
  // maintenance, seasons, propagation) go through localizeEnum for display;
  // family/genus stay Latin.
  type: string | null;
  cycle: string | null;
  family: string | null;
  genus: string | null;
  otherName: string[] | null;
  origin: string[] | null;
  propagation: string[] | null;
  dimensions: SpeciesDimension[] | null;
  plantAnatomy: SpeciesAnatomy[] | null;
  pruningCount: { amount: number; interval: string } | null;
  maintenance: string | null;
  floweringSeason: string | null;
  harvestSeason: string | null;
  defaultImageUrl: string | null;

  saltTolerant: boolean | null;
  thorny: boolean | null;
  invasive: boolean | null;
  tropical: boolean | null;
  indoor: boolean | null;
  flowers: boolean | null;
  cones: boolean | null;
  fruits: boolean | null;
  edibleFruit: boolean | null;
  leaf: boolean | null;
  edibleLeaf: boolean | null;
  cuisine: boolean | null;
  medicinal: boolean | null;
  seeds: boolean | null;
}

export interface SpeciesDimension {
  type: string;
  min_value: number;
  max_value: number;
  unit: string;
}

export interface SpeciesAnatomy {
  part: string;
  color: string[];
}

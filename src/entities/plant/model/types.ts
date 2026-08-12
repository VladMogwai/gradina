// Mirrors the `plants` table + position, per the future Supabase schema.
export interface Plant {
  id: string;
  name: string; // display_name
  startRow: number;
  startCol: number;
  width: number; // in cells
  height: number; // in cells
  photoUrl: string | null; // photo_path (Storage)
  // Fill color chosen when the plant was created/edited; falls back to a
  // name-derived color (see fallbackColorFor) only when this is null.
  color: string | null;
  species: string | null; // ai_species
  speciesUncertain: boolean; // ai_is_certain === false
  lastWateredAt: string | null; // ISO date
  careAdvice: string | null; // ai_content[locale].care
  notes: string | null;
}

export type PlantDraft = Omit<Plant, "id">;

// Prototype-only stand-in for the future "add plant via photo + AI" flow.
export interface LibrarySpecies {
  key: string;
  name: string;
  color: string;
  defaultWidth: number;
  defaultHeight: number;
  custom?: boolean; // user-added via the library panel, deletable
}

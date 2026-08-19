import type { Species } from "@/entities/species";

export type IdentificationConfidence = "low" | "medium" | "high";

// One row in plant_photos, with storage_path already resolved to a public
// URL (the client never needs the raw path).
export interface PlantPhoto {
  id: string;
  url: string;
  sortOrder: number;
  // base64 thumbhash written at upload time, rendered as next/image's blur
  // placeholder. Null for photos uploaded before the column existed - they
  // just render without a blur-up.
  placeholder: string | null;
}

// Mirrors the `plants` table + position, per the future Supabase schema.
// Care facts live on the shared `species` row (see entities/species), not
// here - a plant instance only carries its own position/photos/identity.
export interface Plant {
  id: string;
  name: string; // display_name
  startRow: number;
  startCol: number;
  width: number; // in cells
  height: number; // in cells
  // Ordered by sortOrder; photos[0] is the primary photo. Managed via
  // direct Storage/DB writes (see plantPhotoApi.ts), not the JSON-blob
  // autosave - add/remove take effect immediately, not on the next save.
  photos: PlantPhoto[];
  // Fill color chosen when the plant was created/edited; falls back to a
  // name-derived color (see fallbackColorFor) only when this is null.
  color: string | null;
  speciesId: string | null;
  // This plant's own identification confidence - species-level facts
  // (grounded in Perenual) don't have a per-instance confidence.
  identificationConfidence: IdentificationConfidence | null;
  species: Species | null; // joined at fetch time; null until analyzed
  notes: string | null;
  analyzedAt: string | null; // ISO date, set on each successful identification
}

export type PlantDraft = Omit<Plant, "id">;

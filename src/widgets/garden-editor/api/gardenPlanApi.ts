import type { SupabaseClient } from "@supabase/supabase-js";
import { PLANT_PHOTOS_BUCKET, type Plant, type PlantPhoto } from "@/entities/plant";
import { SPECIES_COLUMNS, type Species } from "@/entities/species";
import type { Zone } from "@/entities/zone";
import type { GardenDoc, GardenSettings } from "../model/useHistory";

const PLANT_COLUMNS =
  "id, name, startRow:start_row, startCol:start_col, width, height, " +
  "color, speciesId:species_id, identificationConfidence:identification_confidence, " +
  "notes, analyzedAt:analyzed_at, " +
  `species(${SPECIES_COLUMNS}), ` +
  "plant_photos(id, storagePath:storage_path, sortOrder:sort_order, placeholder)";

const ZONE_COLUMNS = "id, kind, label, startRow:start_row, startCol:start_col, width, height, color, notes";

const GARDEN_COLUMNS =
  "id, rows, cols, hardinessZone:hardiness_zone, lastFrostDate:last_frost_date, firstFrostDate:first_frost_date";

type PlantRow = Omit<Plant, "photos" | "species"> & {
  species: Species | null;
  plant_photos: { id: string; storagePath: string; sortOrder: number; placeholder: string | null }[];
};

function resolvePhotos(supabase: SupabaseClient, rows: PlantRow["plant_photos"]): PlantPhoto[] {
  return [...rows]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((r) => ({
      id: r.id,
      url: supabase.storage.from(PLANT_PHOTOS_BUCKET).getPublicUrl(r.storagePath).data.publicUrl,
      sortOrder: r.sortOrder,
      placeholder: r.placeholder,
    }));
}

// Returns null if the user has no saved garden plan yet.
export async function fetchGardenDoc(supabase: SupabaseClient, userId: string): Promise<GardenDoc | null> {
  const { data: plan } = await supabase
    .from("garden_plans")
    .select(GARDEN_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();
  if (!plan) return null;

  const [{ data: plants }, { data: zones }] = await Promise.all([
    supabase.from("garden_plants").select(PLANT_COLUMNS).eq("garden_id", plan.id).returns<PlantRow[]>(),
    supabase.from("garden_zones").select(ZONE_COLUMNS).eq("garden_id", plan.id).returns<Zone[]>(),
  ]);

  const settings: GardenSettings = {
    hardinessZone: plan.hardinessZone,
    lastFrostDate: plan.lastFrostDate,
    firstFrostDate: plan.firstFrostDate,
  };

  return {
    grid: { rows: plan.rows, cols: plan.cols },
    plants: (plants ?? []).map(({ plant_photos, ...plant }) => ({
      ...plant,
      photos: resolvePhotos(supabase, plant_photos),
    })),
    zones: zones ?? [],
    settings,
  };
}

// Replaces the caller's whole garden document in one transaction; see the
// save_garden_plan() Postgres function for the upsert-plan + replace-children
// logic.
export async function saveGardenDoc(supabase: SupabaseClient, doc: GardenDoc): Promise<void> {
  const { error } = await supabase.rpc("save_garden_plan", {
    p_rows: doc.grid.rows,
    p_cols: doc.grid.cols,
    p_plants: doc.plants,
    p_zones: doc.zones,
    p_hardiness_zone: doc.settings.hardinessZone,
    p_last_frost_date: doc.settings.lastFrostDate,
    p_first_frost_date: doc.settings.firstFrostDate,
  });
  if (error) throw error;
}

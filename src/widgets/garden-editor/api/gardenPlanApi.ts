import type { SupabaseClient } from "@supabase/supabase-js";
import type { Plant } from "@/entities/plant";
import type { Zone } from "@/entities/zone";
import type { GardenDoc } from "../model/useHistory";

const PLANT_COLUMNS =
  "id, name, startRow:start_row, startCol:start_col, width, height, " +
  "photoUrl:photo_url, color, species, speciesUncertain:species_uncertain, " +
  "lastWateredAt:last_watered_at, careAdvice:care_advice, notes";

const ZONE_COLUMNS = "id, kind, label, startRow:start_row, startCol:start_col, width, height, color, notes";

// Returns null if the user has no saved garden plan yet.
export async function fetchGardenDoc(supabase: SupabaseClient, userId: string): Promise<GardenDoc | null> {
  const { data: plan } = await supabase
    .from("garden_plans")
    .select("id, rows, cols")
    .eq("user_id", userId)
    .maybeSingle();
  if (!plan) return null;

  const [{ data: plants }, { data: zones }] = await Promise.all([
    supabase.from("garden_plants").select(PLANT_COLUMNS).eq("garden_id", plan.id).returns<Plant[]>(),
    supabase.from("garden_zones").select(ZONE_COLUMNS).eq("garden_id", plan.id).returns<Zone[]>(),
  ]);

  return {
    grid: { rows: plan.rows, cols: plan.cols },
    plants: plants ?? [],
    zones: zones ?? [],
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
  });
  if (error) throw error;
}

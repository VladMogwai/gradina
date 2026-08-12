import { GardenEditor } from "@/widgets/garden-editor";
import { fetchGardenDoc } from "@/widgets/garden-editor/api/gardenPlanApi";
import { DEFAULT_GRID } from "@/widgets/garden-editor/config/constants";
import { createClient } from "@/shared/api/supabase/server";

export default async function GardenEditorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const doc = user ? await fetchGardenDoc(supabase, user.id) : null;

  return <GardenEditor initialDoc={doc ?? { grid: DEFAULT_GRID, plants: [], zones: [] }} />;
}

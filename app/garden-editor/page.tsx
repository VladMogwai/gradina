import { GardenEditor } from "@/widgets/garden-editor";
import { fetchGardenDoc } from "@/widgets/garden-editor/api/gardenPlanApi";
import { DEFAULT_GRID } from "@/widgets/garden-editor/config/constants";
import { createClient } from "@/shared/api/supabase/server";

export default async function GardenEditorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null; // unreachable: middleware redirects unauthenticated requests to /login

  const doc = await fetchGardenDoc(supabase, user.id);

  return <GardenEditor userId={user.id} initialDoc={doc ?? { grid: DEFAULT_GRID, plants: [], zones: [] }} />;
}

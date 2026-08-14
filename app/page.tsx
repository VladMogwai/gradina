import { EditorShell, GardenEditor } from "@/widgets/garden-editor";
import { fetchGardenDoc } from "@/widgets/garden-editor/api/gardenPlanApi";
import { DEFAULT_GRID } from "@/widgets/garden-editor/config/constants";
import { LoginScreen } from "@/widgets/login";
import { createClient } from "@/shared/api/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <LoginScreen />;

  const doc = await fetchGardenDoc(supabase, user.id);

  return (
    <EditorShell>
      <GardenEditor
        userId={user.id}
        initialDoc={
          doc ?? {
            grid: DEFAULT_GRID,
            plants: [],
            zones: [],
            settings: { hardinessZone: null, lastFrostDate: null, firstFrostDate: null },
          }
        }
      />
    </EditorShell>
  );
}

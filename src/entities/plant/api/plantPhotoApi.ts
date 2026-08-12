import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "plant-photos";

// Uploads under the user's own folder (storage RLS checks this prefix) with
// a unique filename per upload so replacing a photo never collides with an
// in-flight request for the old one.
export async function uploadPlantPhoto(
  supabase: SupabaseClient,
  userId: string,
  plantId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${plantId}-${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// Best-effort cleanup of the previous photo when it's replaced; ignores
// URLs that aren't from this bucket (e.g. already-revoked local blob URLs).
export async function deletePlantPhoto(supabase: SupabaseClient, photoUrl: string): Promise<void> {
  const marker = `/${BUCKET}/`;
  const index = photoUrl.indexOf(marker);
  if (index === -1) return;
  const path = photoUrl.slice(index + marker.length);
  await supabase.storage.from(BUCKET).remove([path]);
}

import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "plant-photos";

// Browsers other than Safari have no native HEIC/HEIF decoder at all (the
// default iPhone photo format) - an <img> pointing at one just fails to
// render, in every non-Safari browser, with no CSS/HTML fix possible.
// Normalizing to JPEG once here (at upload) is cheaper than re-decoding it
// via WASM on every render of the photo. Dynamically imported so the
// (WASM-backed) library only loads for users who actually upload HEIC.
async function normalizeForWeb(file: File): Promise<File> {
  const { isHeic, heicTo } = await import("heic-to");
  if (!(await isHeic(file))) return file;
  const jpeg = await heicTo({ blob: file, type: "image/jpeg", quality: 0.92 });
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([jpeg], name, { type: "image/jpeg" });
}

// Uploads under the user's own folder (storage RLS checks this prefix) with
// a unique filename per upload so replacing a photo never collides with an
// in-flight request for the old one.
export async function uploadPlantPhoto(
  supabase: SupabaseClient,
  userId: string,
  plantId: string,
  file: File
): Promise<string> {
  const normalized = await normalizeForWeb(file);
  const ext = normalized.name.split(".").pop();
  const path = `${userId}/${plantId}-${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, normalized, { contentType: normalized.type });
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

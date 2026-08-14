import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlantPhoto } from "../model/types";

export const PLANT_PHOTOS_BUCKET = "plant-photos";
const BUCKET = PLANT_PHOTOS_BUCKET;

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

const MAX_DIMENSION = 1600;

// Camera photos routinely run 10-40+MB at full resolution, which is both
// wasteful for a 112px detail box / 44px thumbnail and prone to tripping
// Storage's max-object-size limit. Downscales only when actually needed
// (skips already-small images) and re-encodes as JPEG.
async function resizeIfNeeded(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    bitmap.close();
    return file;
  }
  const scale = MAX_DIMENSION / Math.max(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
  if (!blob) return file;
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}

// Uploads under the user's own folder (storage RLS checks this prefix) with
// a unique filename per upload, then adds one plant_photos row. This is a
// direct write - not routed through the debounced doc autosave - so the
// photo is durable the moment this resolves. nextSortOrder is the caller's
// job (it already has the plant's current photos in memory as photos.length).
export async function addPlantPhoto(
  supabase: SupabaseClient,
  userId: string,
  plantId: string,
  file: File,
  nextSortOrder: number
): Promise<PlantPhoto> {
  const normalized = await resizeIfNeeded(await normalizeForWeb(file));
  const ext = normalized.name.split(".").pop();
  const path = `${userId}/${plantId}-${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, normalized, { contentType: normalized.type });
  if (uploadError) throw uploadError;

  const { data, error: insertError } = await supabase
    .from("plant_photos")
    .insert({ plant_id: plantId, storage_path: path, sort_order: nextSortOrder })
    .select("id, sortOrder:sort_order")
    .single();
  if (insertError) throw insertError;

  return {
    id: data.id,
    url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
    sortOrder: data.sortOrder,
  };
}

// Removes the DB row first (authoritative - a reload should never show a
// photo that's "half deleted"), then best-effort cleans up the Storage
// object. A failed Storage delete just leaves an orphaned file; it can't
// corrupt the plant or its other photos.
export async function removePlantPhoto(supabase: SupabaseClient, photoId: string, photoUrl: string): Promise<void> {
  const { error } = await supabase.from("plant_photos").delete().eq("id", photoId);
  if (error) throw error;
  const marker = `/${BUCKET}/`;
  const index = photoUrl.indexOf(marker);
  if (index === -1) return;
  const path = photoUrl.slice(index + marker.length);
  await supabase.storage.from(BUCKET).remove([path]);
}

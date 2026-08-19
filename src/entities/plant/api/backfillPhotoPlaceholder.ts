import type { SupabaseClient } from "@supabase/supabase-js";
import { encodeThumbhash } from "./plantPhotoApi";
import type { PlantPhoto } from "../model/types";

// Photos uploaded before the `placeholder` column existed have no
// thumbhash, which costs them both their blur-up AND their real aspect
// ratio (tiles fall back to a flat 4:3, so a masonry grid of only legacy
// photos looks like a uniform grid). The migration deliberately had no
// backfill - it can't, since hashing needs to decode the image, and the
// pixels only live in Storage.
//
// So it's done here instead, lazily and once per photo: re-fetch the
// object, hash it, write it back. Runs under the user's own session, so
// RLS covers it the same as any other edit - no service-role key needed.
// Entirely best-effort: any failure leaves the photo exactly as it is
// today and it simply gets retried on a later visit.
export async function backfillPhotoPlaceholder(
  supabase: SupabaseClient,
  photo: PlantPhoto
): Promise<string | null> {
  try {
    const response = await fetch(photo.url);
    if (!response.ok) return null;
    const placeholder = await encodeThumbhash(await response.blob());
    if (!placeholder) return null;

    const { error } = await supabase.from("plant_photos").update({ placeholder }).eq("id", photo.id);
    if (error) return null;
    return placeholder;
  } catch {
    return null;
  }
}

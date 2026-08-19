import { thumbHashToApproximateAspectRatio } from "thumbhash";

// Tiles fall back to this when a photo predates the placeholder column (or
// its hash is unreadable) - a neutral, slightly-portrait shape that looks
// deliberate in a masonry grid rather than obviously "missing".
export const DEFAULT_PHOTO_ASPECT = 4 / 3;

export function decodeThumbhash(placeholder: string | null | undefined): Uint8Array | null {
  if (!placeholder) return null;
  try {
    return Uint8Array.from(atob(placeholder), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

// The stored thumbhash already encodes the image's proportions, so a tile
// can reserve its exact height before the photo loads - masonry lays out
// correctly on first paint instead of reflowing as images arrive. Saves
// storing width/height columns just for layout.
export function aspectRatioFor(placeholder: string | null | undefined): number {
  const bytes = decodeThumbhash(placeholder);
  if (!bytes) return DEFAULT_PHOTO_ASPECT;
  try {
    const ratio = thumbHashToApproximateAspectRatio(bytes);
    // Guard against a corrupt hash producing a degenerate tile.
    return Number.isFinite(ratio) && ratio > 0.2 && ratio < 5 ? ratio : DEFAULT_PHOTO_ASPECT;
  } catch {
    return DEFAULT_PHOTO_ASPECT;
  }
}

import { rectsOverlap, type Rect } from "@/shared/lib/geometry";
import { zoneHasPriority } from "./zoneClip";
import type { Zone } from "../model/types";

// A plant's "location" is whichever zone it visually sits in on the
// canvas - reusing zoneHasPriority (smaller zone wins) so this always
// agrees with what the canvas itself renders on top at that spot. A plant
// that doesn't overlap any zone has no location (renders as unplaced).
export function zoneForPlant(plant: Rect, zones: Zone[]): Zone | null {
  const overlapping = zones.filter((z) => rectsOverlap(plant, z));
  if (overlapping.length === 0) return null;
  return overlapping.reduce((best, z) => (zoneHasPriority(z, best) ? z : best));
}

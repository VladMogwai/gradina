import type { GridSize } from "@/shared/lib/geometry";
import { orphanedBy } from "@/shared/lib/geometry";
import type { Plant } from "../model/types";

// Plants that would end up (partially or fully) outside a shrunk grid.
export function plantsOrphanedBy(plants: Plant[], grid: GridSize): Plant[] {
  return orphanedBy(plants, grid);
}

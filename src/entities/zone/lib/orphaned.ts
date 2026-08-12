import type { GridSize } from "@/shared/lib/geometry";
import { orphanedBy } from "@/shared/lib/geometry";
import type { Zone } from "../model/types";

// Zones that would end up (partially or fully) outside a shrunk grid.
export function zonesOrphanedBy(zones: Zone[], grid: GridSize): Zone[] {
  return orphanedBy(zones, grid);
}

"use client";

import { useCallback, useState } from "react";
import { plantsOrphanedBy, type Plant } from "@/entities/plant";
import { zonesOrphanedBy, type Zone } from "@/entities/zone";
import { clamp, type GridSize } from "@/shared/lib/geometry";
import { MAX_GRID_SIZE, MIN_GRID_SIZE } from "../config/constants";
import type { GardenDoc } from "./useHistory";

interface UseGridResizeParams {
  grid: GridSize;
  plants: Plant[];
  zones: Zone[];
  commit: (updater: (doc: GardenDoc) => GardenDoc) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

// Grid resizing is blocked when it would orphan (push out of bounds) any
// existing plant or zone, rather than silently clipping them.
export function useGridResize({ grid, plants, zones, commit, t }: UseGridResizeParams) {
  const [gridResizeError, setGridResizeError] = useState<string | null>(null);

  const handleRowsChange = useCallback(
    (rows: number) => {
      const clamped = clamp(Math.round(rows) || MIN_GRID_SIZE, MIN_GRID_SIZE, MAX_GRID_SIZE);
      const nextGrid = { ...grid, rows: clamped };
      const orphanedPlants = plantsOrphanedBy(plants, nextGrid);
      const orphanedZones = zonesOrphanedBy(zones, nextGrid);
      if (orphanedPlants.length > 0 || orphanedZones.length > 0) {
        const names = [...orphanedPlants.map((p) => p.name), ...orphanedZones.map((z) => z.label)].join(", ");
        setGridResizeError(t("gridResizeBlockedRows", { count: clamped, names }));
        return;
      }
      setGridResizeError(null);
      commit((d) => ({ ...d, grid: nextGrid }));
    },
    [grid, plants, zones, commit, t]
  );

  const handleColsChange = useCallback(
    (cols: number) => {
      const clamped = clamp(Math.round(cols) || MIN_GRID_SIZE, MIN_GRID_SIZE, MAX_GRID_SIZE);
      const nextGrid = { ...grid, cols: clamped };
      const orphanedPlants = plantsOrphanedBy(plants, nextGrid);
      const orphanedZones = zonesOrphanedBy(zones, nextGrid);
      if (orphanedPlants.length > 0 || orphanedZones.length > 0) {
        const names = [...orphanedPlants.map((p) => p.name), ...orphanedZones.map((z) => z.label)].join(", ");
        setGridResizeError(t("gridResizeBlockedCols", { count: clamped, names }));
        return;
      }
      setGridResizeError(null);
      commit((d) => ({ ...d, grid: nextGrid }));
    },
    [grid, plants, zones, commit, t]
  );

  return { gridResizeError, handleRowsChange, handleColsChange };
}

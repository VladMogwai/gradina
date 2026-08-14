"use client";

import { useCallback } from "react";
import type { ZoneKind } from "@/entities/zone";
import { canPlace, type GridSize } from "@/shared/lib/geometry";
import { createId } from "@/shared/lib/id";
import type { Selection } from "./types";
import type { GardenDoc } from "./useHistory";

interface UseZoneActionsParams {
  grid: GridSize;
  commit: (updater: (doc: GardenDoc) => GardenDoc) => void;
  setSelection: (selection: Selection) => void;
}

export function useZoneActions({ grid, commit, setSelection }: UseZoneActionsParams) {
  const handleZoneLabelChange = useCallback(
    (id: string, label: string) => {
      commit((d) => ({ ...d, zones: d.zones.map((z) => (z.id === id ? { ...z, label } : z)) }));
    },
    [commit]
  );

  const handleZoneColorChange = useCallback(
    (id: string, color: string) => {
      commit((d) => ({ ...d, zones: d.zones.map((z) => (z.id === id ? { ...z, color } : z)) }));
    },
    [commit]
  );

  const handleZoneNotesChange = useCallback(
    (id: string, notes: string) => {
      commit((d) => ({
        ...d,
        zones: d.zones.map((z) => (z.id === id ? { ...z, notes: notes.trim() ? notes : null } : z)),
      }));
    },
    [commit]
  );

  const handleAddZone = useCallback(
    (row: number, col: number, kind: ZoneKind, label: string, color: string, width: number, height: number) => {
      // Zones may freely overlap other zones (only the grid bounds matter).
      const rect = { startRow: row, startCol: col, width, height };
      if (!canPlace(rect, [], grid)) return false;
      const id = createId();
      commit((d) => ({
        ...d,
        zones: [...d.zones, { id, kind, label, startRow: row, startCol: col, width, height, color, notes: null }],
      }));
      setSelection({ kind: "zone", id });
      return true;
    },
    [grid, commit, setSelection]
  );

  const handleDeleteZone = useCallback(
    (id: string) => {
      commit((d) => ({ ...d, zones: d.zones.filter((z) => z.id !== id) }));
      setSelection(null);
    },
    [commit, setSelection]
  );

  return {
    handleZoneLabelChange,
    handleZoneColorChange,
    handleZoneNotesChange,
    handleAddZone,
    handleDeleteZone,
  };
}

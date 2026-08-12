"use client";

import { useCallback, useState } from "react";
import type { Plant } from "@/entities/plant";
import type { Zone } from "@/entities/zone";
import type { Selection } from "./types";

// If the selected plant/zone disappeared (delete/undo), fall back to no
// selection instead of pointing at a stale id.
export function useEditorSelection(plants: Plant[], zones: Zone[]) {
  const [selection, setSelection] = useState<Selection>(null);

  const effectiveSelection: Selection =
    (selection?.kind === "plant" && !plants.some((p) => p.id === selection.id)) ||
    (selection?.kind === "zone" && !zones.some((z) => z.id === selection.id))
      ? null
      : selection;

  const selectCell = useCallback((row: number, col: number) => {
    setSelection({ kind: "cell", row, col });
  }, []);
  const selectPlant = useCallback((id: string) => {
    setSelection({ kind: "plant", id });
  }, []);
  const selectZone = useCallback((id: string) => {
    setSelection({ kind: "zone", id });
  }, []);
  const clearSelection = useCallback(() => setSelection(null), []);

  return { selection: effectiveSelection, setSelection, selectCell, selectPlant, selectZone, clearSelection };
}

import type { Plant } from "@/entities/plant";
import type { Zone } from "@/entities/zone";
import type { GridSize } from "@/shared/lib/geometry";
import { useCallback, useState } from "react";

export interface GardenDoc {
  grid: GridSize;
  plants: Plant[];
  zones: Zone[];
}

interface HistoryState {
  past: GardenDoc[];
  present: GardenDoc;
  future: GardenDoc[];
}

const MAX_HISTORY = 100;

export function useHistory(initial: GardenDoc) {
  const [state, setState] = useState<HistoryState>({
    past: [],
    present: initial,
    future: [],
  });

  // Commits a new document as an undoable step.
  const commit = useCallback((updater: (doc: GardenDoc) => GardenDoc) => {
    setState((s) => {
      const next = updater(s.present);
      if (next === s.present) return s;
      return {
        past: [...s.past, s.present].slice(-MAX_HISTORY),
        present: next,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState((s) => {
      if (s.past.length === 0) return s;
      const previous = s.past[s.past.length - 1];
      return {
        past: s.past.slice(0, -1),
        present: previous,
        future: [s.present, ...s.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((s) => {
      if (s.future.length === 0) return s;
      const [next, ...rest] = s.future;
      return {
        past: [...s.past, s.present],
        present: next,
        future: rest,
      };
    });
  }, []);

  return {
    doc: state.present,
    commit,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}

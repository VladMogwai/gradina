import type { Plant } from "@/entities/plant";
import type { Zone } from "@/entities/zone";
import type { GridSize } from "@/shared/lib/geometry";
import { useCallback, useState } from "react";

// The garden is one fixed physical plot, so these are settings, not a
// per-plant field. Nullable: unset until the user fills them in, and
// every consumer (survivability flag, AI-prose context) degrades
// silently when a value is missing instead of failing.
export interface GardenSettings {
  hardinessZone: string | null;
  lastFrostDate: string | null; // ISO date (YYYY-MM-DD)
  firstFrostDate: string | null; // ISO date (YYYY-MM-DD)
}

export interface GardenDoc {
  grid: GridSize;
  plants: Plant[];
  zones: Zone[];
  settings: GardenSettings;
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

  // For state that's already durable via its own direct write (photos hit
  // Storage + a DB row immediately, not the debounced JSON autosave) - it
  // needs the doc updated so the UI reflects it, but it isn't a user edit
  // step: undo can't meaningfully reverse an upload/delete that already
  // happened server-side, so this skips the history stack entirely.
  const replacePresent = useCallback((updater: (doc: GardenDoc) => GardenDoc) => {
    setState((s) => ({ ...s, present: updater(s.present) }));
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
    replacePresent,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}

"use client";

import { useCallback, useState } from "react";
import type { LibrarySpecies } from "@/entities/plant";
import type { LibraryZoneKind, ZoneKind } from "@/entities/zone";
import { createId } from "@/shared/lib/id";

// Library catalog is session-only tool config, not garden document state,
// so it lives outside useHistory (no undo/redo for it).
export function useCustomLibrary() {
  const [customSpecies, setCustomSpecies] = useState<LibrarySpecies[]>([]);
  const [customZoneKinds, setCustomZoneKinds] = useState<LibraryZoneKind[]>([]);

  const handleAddCustomSpecies = useCallback((name: string, color: string, width: number, height: number) => {
    setCustomSpecies((cs) => [
      ...cs,
      { key: createId(), name, color, defaultWidth: width, defaultHeight: height, custom: true },
    ]);
  }, []);

  const handleDeleteCustomSpecies = useCallback((key: string) => {
    setCustomSpecies((cs) => cs.filter((s) => s.key !== key));
  }, []);

  const handleUpdateCustomSpecies = useCallback(
    (key: string, patch: Partial<Omit<LibrarySpecies, "key" | "custom">>) => {
      setCustomSpecies((cs) => cs.map((s) => (s.key === key ? { ...s, ...patch } : s)));
    },
    []
  );

  const handleAddCustomZoneKind = useCallback(
    (kind: ZoneKind, label: string, color: string, width: number, height: number) => {
      setCustomZoneKinds((cz) => [
        ...cz,
        { key: createId(), kind, label, color, defaultWidth: width, defaultHeight: height, custom: true },
      ]);
    },
    []
  );

  const handleDeleteCustomZoneKind = useCallback((key: string) => {
    setCustomZoneKinds((cz) => cz.filter((z) => z.key !== key));
  }, []);

  const handleUpdateCustomZoneKind = useCallback(
    (key: string, patch: Partial<Omit<LibraryZoneKind, "key" | "custom">>) => {
      setCustomZoneKinds((cz) => cz.map((z) => (z.key === key ? { ...z, ...patch } : z)));
    },
    []
  );

  return {
    customSpecies,
    customZoneKinds,
    handleAddCustomSpecies,
    handleDeleteCustomSpecies,
    handleUpdateCustomSpecies,
    handleAddCustomZoneKind,
    handleDeleteCustomZoneKind,
    handleUpdateCustomZoneKind,
  };
}

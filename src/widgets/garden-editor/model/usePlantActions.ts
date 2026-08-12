"use client";

import { useCallback } from "react";
import type { Plant } from "@/entities/plant";
import { canPlace, type GridSize } from "@/shared/lib/geometry";
import { createId } from "@/shared/lib/id";
import type { Selection } from "./types";
import type { GardenDoc } from "./useHistory";

interface UsePlantActionsParams {
  grid: GridSize;
  plants: Plant[];
  commit: (updater: (doc: GardenDoc) => GardenDoc) => void;
  setSelection: (selection: Selection) => void;
}

export function usePlantActions({ grid, plants, commit, setSelection }: UsePlantActionsParams) {
  const handleWaterNow = useCallback(
    (id: string) => {
      commit((d) => ({
        ...d,
        plants: d.plants.map((p) => (p.id === id ? { ...p, lastWateredAt: new Date().toISOString() } : p)),
      }));
    },
    [commit]
  );

  const handlePhotoChange = useCallback(
    (id: string, photoUrl: string) => {
      commit((d) => ({ ...d, plants: d.plants.map((p) => (p.id === id ? { ...p, photoUrl } : p)) }));
    },
    [commit]
  );

  const handlePlantNameChange = useCallback(
    (id: string, name: string) => {
      commit((d) => ({ ...d, plants: d.plants.map((p) => (p.id === id ? { ...p, name } : p)) }));
    },
    [commit]
  );

  const handlePlantColorChange = useCallback(
    (id: string, color: string) => {
      commit((d) => ({ ...d, plants: d.plants.map((p) => (p.id === id ? { ...p, color } : p)) }));
    },
    [commit]
  );

  const handlePlantSpeciesChange = useCallback(
    (id: string, species: string) => {
      commit((d) => ({
        ...d,
        plants: d.plants.map((p) =>
          p.id === id ? { ...p, species: species.trim() || null, speciesUncertain: false } : p
        ),
      }));
    },
    [commit]
  );

  const handlePlantNotesChange = useCallback(
    (id: string, notes: string) => {
      commit((d) => ({
        ...d,
        plants: d.plants.map((p) => (p.id === id ? { ...p, notes: notes.trim() ? notes : null } : p)),
      }));
    },
    [commit]
  );

  const handleDeletePlant = useCallback(
    (id: string) => {
      commit((d) => ({ ...d, plants: d.plants.filter((p) => p.id !== id) }));
      setSelection(null);
    },
    [commit, setSelection]
  );

  const handleAddPlant = useCallback(
    (row: number, col: number, name: string, width: number, height: number) => {
      const rect = { startRow: row, startCol: col, width, height };
      if (!canPlace(rect, plants, grid)) return false;
      const id = createId();
      commit((d) => ({
        ...d,
        plants: [
          ...d.plants,
          {
            id,
            name,
            startRow: row,
            startCol: col,
            width,
            height,
            photoUrl: null,
            color: null,
            species: null,
            speciesUncertain: false,
            lastWateredAt: null,
            careAdvice: null,
            notes: null,
          },
        ],
      }));
      setSelection({ kind: "plant", id });
      return true;
    },
    [grid, plants, commit, setSelection]
  );

  return {
    handleWaterNow,
    handlePhotoChange,
    handlePlantNameChange,
    handlePlantColorChange,
    handlePlantSpeciesChange,
    handlePlantNotesChange,
    handleDeletePlant,
    handleAddPlant,
  };
}

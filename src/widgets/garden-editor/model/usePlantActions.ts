"use client";

import { useCallback } from "react";
import type { IdentificationConfidence, Plant, PlantPhoto } from "@/entities/plant";
import type { Species } from "@/entities/species";
import { canPlace, type GridSize } from "@/shared/lib/geometry";
import { createId } from "@/shared/lib/id";
import type { Selection } from "./types";
import type { GardenDoc } from "./useHistory";

interface UsePlantActionsParams {
  grid: GridSize;
  plants: Plant[];
  commit: (updater: (doc: GardenDoc) => GardenDoc) => void;
  replacePresent: (updater: (doc: GardenDoc) => GardenDoc) => void;
  setSelection: (selection: Selection) => void;
}

export function usePlantActions({ grid, plants, commit, replacePresent, setSelection }: UsePlantActionsParams) {
  // The actual Storage/DB write already happened (see plantPhotoApi.ts) by
  // the time these run - this just syncs the in-memory doc so the UI shows
  // it, via replacePresent so it isn't a separate undo step.
  const handleAddPhoto = useCallback(
    (id: string, photo: PlantPhoto) => {
      replacePresent((d) => ({
        ...d,
        plants: d.plants.map((p) => (p.id === id ? { ...p, photos: [...p.photos, photo] } : p)),
      }));
    },
    [replacePresent]
  );

  const handleRemovePhoto = useCallback(
    (id: string, photoId: string) => {
      replacePresent((d) => ({
        ...d,
        plants: d.plants.map((p) =>
          p.id === id ? { ...p, photos: p.photos.filter((ph) => ph.id !== photoId) } : p
        ),
      }));
    },
    [replacePresent]
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

  const handlePlantNotesChange = useCallback(
    (id: string, notes: string) => {
      commit((d) => ({
        ...d,
        plants: d.plants.map((p) => (p.id === id ? { ...p, notes: notes.trim() ? notes : null } : p)),
      }));
    },
    [commit]
  );

  const handleAnalysisChange = useCallback(
    (id: string, species: Species, confidence: IdentificationConfidence, analyzedAt: string) => {
      const name = species.commonName ?? species.scientificName;
      commit((d) => ({
        ...d,
        plants: d.plants.map((p) =>
          p.id === id
            ? { ...p, name, species, speciesId: species.id, identificationConfidence: confidence, analyzedAt }
            : p
        ),
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
    (row: number, col: number, name: string, width: number, height: number, color: string | null = null) => {
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
            photos: [],
            color,
            speciesId: null,
            identificationConfidence: null,
            species: null,
            notes: null,
            analyzedAt: null,
          },
        ],
      }));
      setSelection({ kind: "plant", id });
      return true;
    },
    [grid, plants, commit, setSelection]
  );

  return {
    handleAddPhoto,
    handleRemovePhoto,
    handlePlantNameChange,
    handlePlantColorChange,
    handlePlantNotesChange,
    handleAnalysisChange,
    handleDeletePlant,
    handleAddPlant,
  };
}

"use client";

import { useCallback } from "react";
import type { IdentificationConfidence, Plant, PlantPhoto } from "@/entities/plant";
import type { Species } from "@/entities/species";
import { findFreeCell, type GridSize } from "@/shared/lib/geometry";
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

  // Photo-only creation path: no name/color/size form, so this always
  // places a 1x1 plant with a placeholder name (overwritten once analysis
  // runs, see handleAnalysisChange) and a null color (falls back to
  // fallbackColorFor). Returns the new Plant (not just its id) so the
  // caller can build an exact GardenDoc snapshot for a direct saveNow(doc)
  // call without racing the debounced autosave - see GardenEditor's
  // handleCreatePlantFromPhoto. Returns null if the grid is completely full.
  const handleCreatePlant = useCallback(
    (name: string): Plant | null => {
      const free = findFreeCell(1, 1, plants, grid);
      if (!free) return null;
      const newPlant: Plant = {
        id: createId(),
        name,
        startRow: free.row,
        startCol: free.col,
        width: 1,
        height: 1,
        photos: [],
        color: null,
        speciesId: null,
        identificationConfidence: null,
        species: null,
        notes: null,
        analyzedAt: null,
      };
      commit((d) => ({ ...d, plants: [...d.plants, newPlant] }));
      setSelection({ kind: "plant", id: newPlant.id });
      return newPlant;
    },
    [grid, plants, commit, setSelection]
  );

  return {
    handleAddPhoto,
    handleRemovePhoto,
    handlePlantNotesChange,
    handleAnalysisChange,
    handleDeletePlant,
    handleCreatePlant,
  };
}

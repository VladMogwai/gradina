"use client";

import type { LibrarySpecies, Plant } from "@/entities/plant";
import { zoneKindLibraryLabel, type LibraryZoneKind, type Zone } from "@/entities/zone";
import { canPlace, pointToCell, type GridSize } from "@/shared/lib/geometry";
import { createId } from "@/shared/lib/id";
import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_CELL_SIZE } from "../config/constants";
import type { DragState } from "./dragTypes";
import type { Selection } from "./types";
import type { GardenDoc } from "./useHistory";

interface UseGardenDragParams {
  zoom: number;
  grid: GridSize;
  plants: Plant[];
  zones: Zone[];
  commit: (updater: (doc: GardenDoc) => GardenDoc) => void;
  setSelection: (selection: Selection) => void;
  t: (key: string) => string;
}

// Owns the whole pointer drag lifecycle for moving/resizing plants and
// zones, and for dropping new ones from the library. Listeners are
// attached to window (not the canvas) so movement/release outside the
// canvas is still tracked, Figma-style.
export function useGardenDrag({ zoom, grid, plants, zones, commit, setSelection, t }: UseGardenDragParams) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  // Mirrors the latest props into a ref so the window-level listeners
  // (subscribed once per drag) always read fresh values without needing to
  // resubscribe on every state change.
  const latest = useRef({ zoom, grid, plants, zones });
  const tRef = useRef(t);
  const isDragging = dragState !== null;

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  useEffect(() => {
    latest.current = { zoom, grid, plants, zones };
  }, [zoom, grid, plants, zones]);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const beginMove = useCallback(
    (id: string, target: "plant" | "zone", e: React.PointerEvent) => {
      const item =
        target === "plant"
          ? latest.current.plants.find((p) => p.id === id)
          : latest.current.zones.find((z) => z.id === id);
      if (!item) return;
      setSelection({ kind: target, id });
      setDragState({
        type: "move",
        target,
        id,
        startClientX: e.clientX,
        startClientY: e.clientY,
        origin: { startRow: item.startRow, startCol: item.startCol },
        candidateRow: item.startRow,
        candidateCol: item.startCol,
        valid: true,
      });
    },
    [setSelection]
  );

  const beginResize = useCallback(
    (id: string, target: "plant" | "zone", e: React.PointerEvent) => {
      const item =
        target === "plant"
          ? latest.current.plants.find((p) => p.id === id)
          : latest.current.zones.find((z) => z.id === id);
      if (!item) return;
      setSelection({ kind: target, id });
      setDragState({
        type: "resize",
        target,
        id,
        startClientX: e.clientX,
        startClientY: e.clientY,
        origin: { width: item.width, height: item.height },
        candidateWidth: item.width,
        candidateHeight: item.height,
        valid: true,
      });
    },
    [setSelection]
  );

  const beginLibraryPlantDrag = useCallback((species: LibrarySpecies) => {
    setDragState({
      type: "library-plant",
      species,
      candidateRow: null,
      candidateCol: null,
      valid: false,
    });
  }, []);

  const beginLibraryZoneDrag = useCallback((zoneKind: LibraryZoneKind) => {
    setDragState({
      type: "library-zone",
      zoneKind,
      candidateRow: null,
      candidateCol: null,
      valid: false,
    });
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    function handleMove(e: PointerEvent) {
      const { zoom, grid, plants, zones } = latest.current;
      const cs = BASE_CELL_SIZE * zoom;
      setDragState((ds) => {
        if (!ds) return ds;
        if (ds.type === "move") {
          const collection = ds.target === "plant" ? plants : zones;
          const item = collection.find((p) => p.id === ds.id);
          if (!item) return ds;
          const dCol = Math.round((e.clientX - ds.startClientX) / cs);
          const dRow = Math.round((e.clientY - ds.startClientY) / cs);
          const candidateRow = ds.origin.startRow + dRow;
          const candidateCol = ds.origin.startCol + dCol;
          // Zones may freely overlap other zones (rendered "flowing around"
          // each other); only plants still collide with plants.
          const valid = canPlace(
            { startRow: candidateRow, startCol: candidateCol, width: item.width, height: item.height },
            ds.target === "plant" ? collection : [],
            grid,
            ds.id
          );
          return { ...ds, candidateRow, candidateCol, valid };
        }
        if (ds.type === "resize") {
          const collection = ds.target === "plant" ? plants : zones;
          const item = collection.find((p) => p.id === ds.id);
          if (!item) return ds;
          const dCol = Math.round((e.clientX - ds.startClientX) / cs);
          const dRow = Math.round((e.clientY - ds.startClientY) / cs);
          const candidateWidth = Math.max(1, ds.origin.width + dCol);
          const candidateHeight = Math.max(1, ds.origin.height + dRow);
          const valid = canPlace(
            {
              startRow: item.startRow,
              startCol: item.startCol,
              width: candidateWidth,
              height: candidateHeight,
            },
            ds.target === "plant" ? collection : [],
            grid,
            ds.id
          );
          return { ...ds, candidateWidth, candidateHeight, valid };
        }
        // library-plant / library-zone
        if (!canvasRef.current) return ds;
        const rect = canvasRef.current.getBoundingClientRect();
        const inside =
          e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
        if (!inside) return { ...ds, candidateRow: null, candidateCol: null, valid: false };
        const { row, col } = pointToCell(e.clientX, e.clientY, rect, cs);
        if (ds.type === "library-plant") {
          const valid = canPlace(
            { startRow: row, startCol: col, width: ds.species.defaultWidth, height: ds.species.defaultHeight },
            plants,
            grid
          );
          return { ...ds, candidateRow: row, candidateCol: col, valid };
        }
        // Zones may freely overlap other zones.
        const valid = canPlace(
          { startRow: row, startCol: col, width: ds.zoneKind.defaultWidth, height: ds.zoneKind.defaultHeight },
          [],
          grid
        );
        return { ...ds, candidateRow: row, candidateCol: col, valid };
      });
    }

    function handleUp() {
      const ds = dragStateRef.current;
      setDragState(null);
      if (!ds) return;

      if (ds.type === "move") {
        if (ds.valid && (ds.candidateRow !== ds.origin.startRow || ds.candidateCol !== ds.origin.startCol)) {
          if (ds.target === "plant") {
            commit((d) => ({
              ...d,
              plants: d.plants.map((p) =>
                p.id === ds.id ? { ...p, startRow: ds.candidateRow, startCol: ds.candidateCol } : p
              ),
            }));
          } else {
            commit((d) => ({
              ...d,
              zones: d.zones.map((z) =>
                z.id === ds.id ? { ...z, startRow: ds.candidateRow, startCol: ds.candidateCol } : z
              ),
            }));
          }
        }
      } else if (ds.type === "resize") {
        if (ds.valid && (ds.candidateWidth !== ds.origin.width || ds.candidateHeight !== ds.origin.height)) {
          if (ds.target === "plant") {
            commit((d) => ({
              ...d,
              plants: d.plants.map((p) =>
                p.id === ds.id ? { ...p, width: ds.candidateWidth, height: ds.candidateHeight } : p
              ),
            }));
          } else {
            commit((d) => ({
              ...d,
              zones: d.zones.map((z) =>
                z.id === ds.id ? { ...z, width: ds.candidateWidth, height: ds.candidateHeight } : z
              ),
            }));
          }
        }
      } else if (ds.type === "library-plant") {
        if (ds.valid && ds.candidateRow !== null && ds.candidateCol !== null) {
          const species = ds.species;
          const startRow = ds.candidateRow;
          const startCol = ds.candidateCol;
          commit((d) => ({
            ...d,
            plants: [
              ...d.plants,
              {
                id: createId(),
                name: species.name,
                startRow,
                startCol,
                width: species.defaultWidth,
                height: species.defaultHeight,
                photoUrl: null,
                color: species.color,
                species: null,
                speciesUncertain: false,
                lastWateredAt: null,
                careAdvice: null,
                notes: null,
              },
            ],
          }));
        }
      } else if (ds.type === "library-zone") {
        if (ds.valid && ds.candidateRow !== null && ds.candidateCol !== null) {
          const zoneKind = ds.zoneKind;
          const startRow = ds.candidateRow;
          const startCol = ds.candidateCol;
          commit((d) => ({
            ...d,
            zones: [
              ...d.zones,
              {
                id: createId(),
                kind: zoneKind.kind,
                label: zoneKindLibraryLabel(zoneKind, tRef.current),
                startRow,
                startCol,
                width: zoneKind.defaultWidth,
                height: zoneKind.defaultHeight,
                color: zoneKind.color,
                notes: null,
              },
            ],
          }));
        }
      }
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isDragging, commit]);

  return { canvasRef, dragState, beginMove, beginResize, beginLibraryPlantDrag, beginLibraryZoneDrag };
}

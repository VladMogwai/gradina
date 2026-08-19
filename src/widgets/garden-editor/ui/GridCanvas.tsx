import { PlantObject, type Plant } from "@/entities/plant";
import { buildZonePathData, ZoneObject, type Zone } from "@/entities/zone";
import { clamp, type GridSize, type Rect } from "@/shared/lib/geometry";
import { useTranslations } from "next-intl";
import { useEffect, useRef, type RefObject } from "react";
import { BASE_CELL_SIZE, ZOOM_MAX, ZOOM_MIN } from "../config/constants";
import type { DragState } from "../model/dragTypes";
import type { EditorMode, Selection } from "../model/types";
import styles from "../styles/GridCanvas.module.scss";

const CANVAS_MARGIN = 24; // matches the inline `margin: 24` on the canvas div below
const FIT_PADDING_CELLS = 2;

interface GridCanvasProps {
  canvasRef: RefObject<HTMLDivElement | null>;
  grid: GridSize;
  plants: Plant[];
  zones: Zone[];
  cellSize: number;
  mode: EditorMode;
  debug: boolean;
  selection: Selection;
  dragState: DragState | null;
  onSelectCell: (row: number, col: number) => void;
  onSelectPlant: (id: string) => void;
  onSelectZone: (id: string) => void;
  onBeginMove: (id: string, target: "plant" | "zone", e: React.PointerEvent) => void;
  onBeginResize: (id: string, target: "plant" | "zone", e: React.PointerEvent) => void;
  onZoomDelta: (deltaY: number) => void;
  onZoomChange: (zoom: number) => void;
  fitSignal: number;
}

export function GridCanvas({
  canvasRef,
  grid,
  plants,
  zones,
  cellSize,
  mode,
  debug,
  selection,
  dragState,
  onSelectCell,
  onSelectPlant,
  onSelectZone,
  onBeginMove,
  onBeginResize,
  onZoomDelta,
  onZoomChange,
  fitSignal,
}: GridCanvasProps) {
  const t = useTranslations("Editor");
  const widthPx = grid.cols * cellSize;
  const heightPx = grid.rows * cellSize;
  const editable = mode === "edit";
  const scrollRef = useRef<HTMLDivElement>(null);
  // Mirrors the latest geometry into a ref so the pinch listener (attached
  // once per gesture) reads fresh values without resubscribing mid-pinch.
  const latest = useRef({ grid, plants, zones, cellSize });

  useEffect(() => {
    latest.current = { grid, plants, zones, cellSize };
  }, [grid, plants, zones, cellSize]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function handleWheel(e: WheelEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      onZoomDelta(e.deltaY);
    }
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [onZoomDelta]);

  // Two-finger pinch zoom, the touch-first counterpart to the ctrl/cmd+wheel
  // handler above. Tracks the distance between the two touch points and
  // scales zoom relative to where the pinch started, same absolute-setter
  // (onZoomChange) the fit-to-screen effect below uses.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let pinchStartDist: number | null = null;
    let pinchStartZoom = 1;

    function distance(touches: TouchList) {
      const [a, b] = [touches[0], touches[1]];
      return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
    }

    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length !== 2) return;
      pinchStartDist = distance(e.touches);
      pinchStartZoom = latest.current.cellSize / BASE_CELL_SIZE;
    }

    function handleTouchMove(e: TouchEvent) {
      if (e.touches.length !== 2 || pinchStartDist === null) return;
      e.preventDefault();
      const ratio = distance(e.touches) / pinchStartDist;
      onZoomChange(clamp(Number((pinchStartZoom * ratio).toFixed(2)), ZOOM_MIN, ZOOM_MAX));
    }

    function handleTouchEnd(e: TouchEvent) {
      if (e.touches.length < 2) pinchStartDist = null;
    }

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    el.addEventListener("touchcancel", handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [onZoomChange]);

  // Fits the plants+zones bounding box (padded) into the visible viewport
  // and centers it. Runs once on mount (fitSignal starts at 0) and again
  // each time the caller's fit-to-screen control bumps fitSignal - it never
  // re-runs on its own while the user is editing, so it doesn't fight a
  // zoom/pan the user set manually via pinch.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { grid, plants, zones } = latest.current;
    const containerW = el.clientWidth;
    const containerH = el.clientHeight;
    if (containerW === 0 || containerH === 0) return;

    const items = [...plants, ...zones];
    let minRow = 0;
    let minCol = 0;
    let maxRow = Math.min(grid.rows, 10);
    let maxCol = Math.min(grid.cols, 10);
    if (items.length > 0) {
      minRow = Math.min(...items.map((i) => i.startRow));
      minCol = Math.min(...items.map((i) => i.startCol));
      maxRow = Math.max(...items.map((i) => i.startRow + i.height));
      maxCol = Math.max(...items.map((i) => i.startCol + i.width));
    }
    minRow = Math.max(0, minRow - FIT_PADDING_CELLS);
    minCol = Math.max(0, minCol - FIT_PADDING_CELLS);
    maxRow = Math.min(grid.rows, maxRow + FIT_PADDING_CELLS);
    maxCol = Math.min(grid.cols, maxCol + FIT_PADDING_CELLS);

    const boxRows = Math.max(1, maxRow - minRow);
    const boxCols = Math.max(1, maxCol - minCol);
    const fitZoom = clamp(
      Math.min(containerW / (boxCols * BASE_CELL_SIZE), containerH / (boxRows * BASE_CELL_SIZE)),
      ZOOM_MIN,
      ZOOM_MAX
    );
    onZoomChange(Number(fitZoom.toFixed(2)));

    // Deferred a frame so cellSize/layout has caught up with the new zoom
    // before computing where to scroll to.
    requestAnimationFrame(() => {
      const cs = BASE_CELL_SIZE * fitZoom;
      el.scrollLeft = Math.max(0, minCol * cs - (containerW - boxCols * cs) / 2 + CANVAS_MARGIN);
      el.scrollTop = Math.max(0, minRow * cs - (containerH - boxRows * cs) / 2 + CANVAS_MARGIN);
    });
    // Deliberately excludes grid/plants/zones/onZoomChange - this should
    // only fire on mount and on an explicit fit request, not on every edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitSignal]);

  function handleCanvasClick(e: React.MouseEvent) {
    if (!editable) return;
    if (e.target !== e.currentTarget) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const row = Math.floor((e.clientY - rect.top) / cellSize);
    const col = Math.floor((e.clientX - rect.left) / cellSize);
    if (row < 0 || row >= grid.rows || col < 0 || col >= grid.cols) return;
    onSelectCell(row, col);
  }

  return (
    <div ref={scrollRef} className={styles.scrollArea}>
      <div
        ref={canvasRef}
        onClick={handleCanvasClick}
        className={styles.canvas}
        style={{ width: widthPx, height: heightPx, margin: CANVAS_MARGIN }}
      >
        {/* Layer 1: zones (bottom). Overlapping zones "flow around" one
            another: the smaller zone renders solid on top, the bigger one
            gets a hole clipped out around it. */}
        {(() => {
          function zoneOverride(zone: Zone) {
            if (dragState?.type === "library-zone" && dragState.id === zone.id) {
              return {
                startRow: dragState.candidateRow ?? zone.startRow,
                startCol: dragState.candidateCol ?? zone.startCol,
                width: zone.width,
                height: zone.height,
                valid: dragState.valid,
              };
            }
            return dragState &&
              (dragState.type === "move" || dragState.type === "resize") &&
              dragState.target === "zone" &&
              dragState.id === zone.id
              ? dragState.type === "move"
                ? {
                    startRow: dragState.candidateRow,
                    startCol: dragState.candidateCol,
                    width: zone.width,
                    height: zone.height,
                    valid: dragState.valid,
                  }
                : {
                    startRow: zone.startRow,
                    startCol: zone.startCol,
                    width: dragState.candidateWidth,
                    height: dragState.candidateHeight,
                    valid: dragState.valid,
                  }
              : undefined;
          }

          const effectiveRects: (Rect & { id: string })[] = zones.map((z) => {
            const o = zoneOverride(z);
            return {
              id: z.id,
              startRow: o?.startRow ?? z.startRow,
              startCol: o?.startCol ?? z.startCol,
              width: o?.width ?? z.width,
              height: o?.height ?? z.height,
            };
          });

          // Bigger zones first, so smaller ones sit on top in the DOM.
          const renderOrder = [...zones].sort(
            (a, b) => b.width * b.height - a.width * a.height
          );

          return renderOrder.map((zone) => {
            const override = zoneOverride(zone);
            const effectiveRect = effectiveRects.find((r) => r.id === zone.id)!;
            const pathData = buildZonePathData(effectiveRect, effectiveRects, cellSize);

            return (
              <ZoneObject
                key={zone.id}
                zone={zone}
                cellSize={cellSize}
                selected={selection?.kind === "zone" && selection.id === zone.id}
                editable={editable}
                override={override}
                pathData={pathData}
                onSelect={onSelectZone}
                onBeginMove={(id, e) => onBeginMove(id, "zone", e)}
                onBeginResize={(id, e) => onBeginResize(id, "zone", e)}
              />
            );
          });
        })()}

        {/* Layer 2: grid lines */}
        {editable && (
          <div
            className={styles.gridLines}
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.06) 1px, transparent 1px)",
              backgroundSize: `${cellSize}px ${cellSize}px`,
            }}
          />
        )}

        {/* Selected empty cell highlight */}
        {selection?.kind === "cell" && editable && (
          <div
            className={styles.cellHighlight}
            style={{
              top: selection.row * cellSize,
              left: selection.col * cellSize,
              width: cellSize,
              height: cellSize,
            }}
          />
        )}

        {/* Debug ruler */}
        {debug &&
          editable &&
          Array.from({ length: grid.cols }).map((_, col) => (
            <div
              key={`c${col}`}
              aria-label={`${t("column")} ${col}`}
              className={styles.rulerCol}
              style={{ left: col * cellSize, width: cellSize, transform: "translateY(-14px)" }}
            >
              {col}
            </div>
          ))}
        {debug &&
          editable &&
          Array.from({ length: grid.rows }).map((_, row) => (
            <div
              key={`r${row}`}
              aria-label={`${t("row")} ${row}`}
              className={styles.rulerRow}
              style={{ top: row * cellSize, height: cellSize, transform: "translateX(-14px)" }}
            >
              {row}
            </div>
          ))}

        {/* Layer 3: plants (top) */}
        {plants.map((plant) => {
          const override =
            dragState?.type === "library-plant" && dragState.id === plant.id
              ? {
                  startRow: dragState.candidateRow ?? plant.startRow,
                  startCol: dragState.candidateCol ?? plant.startCol,
                  width: plant.width,
                  height: plant.height,
                  valid: dragState.valid,
                }
              : dragState &&
                  (dragState.type === "move" || dragState.type === "resize") &&
                  dragState.target === "plant" &&
                  dragState.id === plant.id
                ? dragState.type === "move"
                  ? {
                      startRow: dragState.candidateRow,
                      startCol: dragState.candidateCol,
                      width: plant.width,
                      height: plant.height,
                      valid: dragState.valid,
                    }
                  : {
                      startRow: plant.startRow,
                      startCol: plant.startCol,
                      width: dragState.candidateWidth,
                      height: dragState.candidateHeight,
                      valid: dragState.valid,
                    }
                : undefined;

          return (
            <PlantObject
              key={plant.id}
              plant={plant}
              cellSize={cellSize}
              selected={selection?.kind === "plant" && selection.id === plant.id}
              editable={editable}
              debug={debug}
              override={override}
              onSelect={onSelectPlant}
              onBeginMove={(id, e) => onBeginMove(id, "plant", e)}
              onBeginResize={(id, e) => onBeginResize(id, "plant", e)}
            />
          );
        })}
      </div>
    </div>
  );
}

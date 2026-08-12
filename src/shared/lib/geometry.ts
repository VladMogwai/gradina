export interface GridSize {
  rows: number;
  cols: number;
}

export interface Rect {
  startRow: number;
  startCol: number;
  width: number;
  height: number;
}

interface Placed extends Rect {
  id: string;
}

export function isWithinGrid(rect: Rect, grid: GridSize): boolean {
  return (
    rect.startRow >= 0 &&
    rect.startCol >= 0 &&
    rect.startRow + rect.height <= grid.rows &&
    rect.startCol + rect.width <= grid.cols
  );
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.startRow < b.startRow + b.height &&
    a.startRow + a.height > b.startRow &&
    a.startCol < b.startCol + b.width &&
    a.startCol + a.width > b.startCol
  );
}

// The overlapping area of two rects, or null if they don't overlap.
export function rectIntersection(a: Rect, b: Rect): Rect | null {
  const startRow = Math.max(a.startRow, b.startRow);
  const startCol = Math.max(a.startCol, b.startCol);
  const endRow = Math.min(a.startRow + a.height, b.startRow + b.height);
  const endCol = Math.min(a.startCol + a.width, b.startCol + b.width);
  if (endRow <= startRow || endCol <= startCol) return null;
  return { startRow, startCol, width: endCol - startCol, height: endRow - startRow };
}

// `others` only needs to be the items that should block this placement:
// pass `plants` to check plant-vs-plant, or `zones` to check zone-vs-zone.
// Plants and zones are never checked against each other (plants may sit on
// top of a zone).
export function canPlace(
  rect: Rect,
  others: Placed[],
  grid: GridSize,
  ignoreId?: string
): boolean {
  if (rect.width < 1 || rect.height < 1) return false;
  if (!isWithinGrid(rect, grid)) return false;
  return !others.some((p) => p.id !== ignoreId && rectsOverlap(rect, p));
}

// Items that would end up (partially or fully) outside a shrunk grid.
export function orphanedBy<T extends Rect>(items: T[], grid: GridSize): T[] {
  return items.filter((item) => !isWithinGrid(item, grid));
}

export function pointToCell(
  clientX: number,
  clientY: number,
  canvasRect: DOMRect,
  cellSize: number
): { row: number; col: number } {
  return {
    row: Math.floor((clientY - canvasRect.top) / cellSize),
    col: Math.floor((clientX - canvasRect.left) / cellSize),
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

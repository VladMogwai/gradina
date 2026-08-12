import { rectIntersection, type Rect } from "@/shared/lib/geometry";

interface PrioritizedRect extends Rect {
  id: string;
}

function area(r: Rect): number {
  return r.width * r.height;
}

// Smaller zones "win": they render solid on top, while bigger zones are
// visually notched out around them, so overlapping zones flow around each
// other instead of stacking flatly.
export function zoneHasPriority(a: PrioritizedRect, b: PrioritizedRect): boolean {
  const areaA = area(a);
  const areaB = area(b);
  if (areaA !== areaB) return areaA < areaB;
  return a.id < b.id;
}

function rectPath(x: number, y: number, w: number, h: number): string {
  return `M${x} ${y} L${x + w} ${y} L${x + w} ${y + h} L${x} ${y + h} Z`;
}

// SVG path data (use with fill-rule="evenodd") for `rect`'s visible shape:
// its own bounding box with a hole cut out for every higher-priority
// (smaller) zone it overlaps, so it renders flowing around them.
export function buildZonePathData(
  rect: PrioritizedRect,
  others: PrioritizedRect[],
  cellSize: number
): string {
  const holes = others
    .filter((o) => o.id !== rect.id && zoneHasPriority(o, rect))
    .map((o) => rectIntersection(rect, o))
    .filter((h): h is Rect => h !== null);

  const outer = rectPath(0, 0, rect.width * cellSize, rect.height * cellSize);
  const inner = holes
    .map((h) =>
      rectPath(
        (h.startCol - rect.startCol) * cellSize,
        (h.startRow - rect.startRow) * cellSize,
        h.width * cellSize,
        h.height * cellSize
      )
    )
    .join(" ");

  return inner ? `${outer} ${inner}` : outer;
}

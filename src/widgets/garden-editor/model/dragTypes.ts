interface MoveDrag {
  type: "move";
  target: "plant" | "zone";
  id: string;
  startClientX: number;
  startClientY: number;
  origin: { startRow: number; startCol: number };
  candidateRow: number;
  candidateCol: number;
  valid: boolean;
}

interface ResizeDrag {
  type: "resize";
  target: "plant" | "zone";
  id: string;
  startClientX: number;
  startClientY: number;
  origin: { width: number; height: number };
  candidateWidth: number;
  candidateHeight: number;
  valid: boolean;
}

// Dragging a row out of the Library panel relocates that exact plant/zone
// (the row IS the placed item, not a stamp for a new one) - so this only
// needs the id plus its fixed size for the drop-validity check.
interface LibraryPlantDrag {
  type: "library-plant";
  id: string;
  width: number;
  height: number;
  candidateRow: number | null;
  candidateCol: number | null;
  valid: boolean;
}

interface LibraryZoneDrag {
  type: "library-zone";
  id: string;
  width: number;
  height: number;
  candidateRow: number | null;
  candidateCol: number | null;
  valid: boolean;
}

export type DragState = MoveDrag | ResizeDrag | LibraryPlantDrag | LibraryZoneDrag;

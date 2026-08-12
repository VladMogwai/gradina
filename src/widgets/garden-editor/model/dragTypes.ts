import type { LibrarySpecies } from "@/entities/plant";
import type { LibraryZoneKind } from "@/entities/zone";

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

interface LibraryPlantDrag {
  type: "library-plant";
  species: LibrarySpecies;
  candidateRow: number | null;
  candidateCol: number | null;
  valid: boolean;
}

interface LibraryZoneDrag {
  type: "library-zone";
  zoneKind: LibraryZoneKind;
  candidateRow: number | null;
  candidateCol: number | null;
  valid: boolean;
}

export type DragState = MoveDrag | ResizeDrag | LibraryPlantDrag | LibraryZoneDrag;

export interface GridSize {
  rows: number;
  cols: number;
}

export type Selection =
  | { kind: "cell"; row: number; col: number }
  | { kind: "plant"; id: string }
  | { kind: "zone"; id: string }
  | null;

export type EditorMode = "edit" | "preview";

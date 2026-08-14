// "other" is a neutral catch-all so a zone never has to be forced into one
// of the specific kinds below - it can just be freely named and colored.
export type ZoneKind = "other" | "house" | "garden" | "path" | "greenhouse";

// A parcel layout region, rendered under the grid lines and under plants.
export interface Zone {
  id: string;
  kind: ZoneKind;
  label: string;
  startRow: number;
  startCol: number;
  width: number; // in cells
  height: number; // in cells
  color: string;
  notes: string | null;
}

import type { LibraryZoneKind, ZoneKind } from "./types";

export const LIBRARY_ZONES: LibraryZoneKind[] = [];

// The `Zone.kind` union stays fixed (tied to the future Supabase schema),
// independent of the (empty) library catalog above. Used to build the
// "kind" picker and its default color when creating a zone.
// "other" first: it's the default kind, so adding a zone never forces a
// choice from the specific list - it can just be freely named/colored.
export const ZONE_KINDS: ZoneKind[] = ["other", "house", "garden", "path", "greenhouse"];

export const ZONE_KIND_DEFAULT_COLOR: Record<ZoneKind, string> = {
  other: "#64748b",
  house: "#78716c",
  garden: "#22c55e",
  path: "#a8a29e",
  greenhouse: "#38bdf8",
};

export const DEFAULT_ZONE_SIZE = 3;

// Maps a zone kind to its Editor.* translation key (used for both the
// library entry label and a zone's localized default label).
export const ZONE_KIND_LABEL_KEYS: Record<ZoneKind, string> = {
  other: "zoneOther",
  house: "zoneHouse",
  garden: "zoneGarden",
  path: "zonePath",
  greenhouse: "zoneGreenhouse",
};

// Display label for a library zone entry: a custom label if the user set
// one, otherwise the kind's translated name.
export function zoneKindLibraryLabel(zk: LibraryZoneKind, t: (key: string) => string): string {
  return zk.label ?? t(ZONE_KIND_LABEL_KEYS[zk.kind]);
}

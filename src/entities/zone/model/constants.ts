import type { ZoneKind } from "./types";

// The `Zone.kind` union stays fixed (tied to the future Supabase schema).
// Used to build the "kind" picker and its default color when creating a
// zone.
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

// Maps a zone kind to its Editor.* translation key (used for a zone's
// localized default label).
export const ZONE_KIND_LABEL_KEYS: Record<ZoneKind, string> = {
  other: "zoneOther",
  house: "zoneHouse",
  garden: "zoneGarden",
  path: "zonePath",
  greenhouse: "zoneGreenhouse",
};

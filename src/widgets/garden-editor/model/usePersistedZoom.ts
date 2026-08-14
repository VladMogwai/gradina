"use client";

import { useEffect, useState } from "react";
import { clamp } from "@/shared/lib/geometry";
import { ZOOM_MAX, ZOOM_MIN } from "../config/constants";

const STORAGE_KEY = "gradina:zoom";

// Per-device view preference (not garden content), so this lives in
// localStorage rather than the synced document - reads back after mount to
// avoid an SSR/localStorage mismatch, matching the app's usual pattern for
// browser-only state.
export function usePersistedZoom() {
  const [zoom, setZoomState] = useState(1);

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    if (stored >= ZOOM_MIN && stored <= ZOOM_MAX) setZoomState(stored);
  }, []);

  function setZoom(value: number | ((prev: number) => number)) {
    setZoomState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      const clamped = clamp(Number(next.toFixed(2)), ZOOM_MIN, ZOOM_MAX);
      localStorage.setItem(STORAGE_KEY, String(clamped));
      return clamped;
    });
  }

  return [zoom, setZoom] as const;
}

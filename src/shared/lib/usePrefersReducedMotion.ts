"use client";

import { useEffect, useState } from "react";

// Defaults to false on both server and first client render (no window
// during SSR), then corrects itself right after mount - the standard
// pattern for reading matchMedia without a hydration mismatch.
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

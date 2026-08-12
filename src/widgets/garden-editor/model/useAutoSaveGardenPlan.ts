"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/shared/api/supabase/client";
import { saveGardenDoc } from "../api/gardenPlanApi";
import type { GardenDoc } from "./useHistory";

const AUTOSAVE_DELAY_MS = 1000;

export type SaveStatus = "idle" | "saving" | "saved" | "error";

// Debounced autosave: every change to the document is persisted to Supabase
// ~1s after the user stops editing. Skips the first render so loading the
// already-saved doc doesn't trigger a redundant save.
export function useAutoSaveGardenPlan(doc: GardenDoc) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const supabaseRef = useRef(createClient());
  const mountedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const docRef = useRef(doc);

  const saveRef = useRef(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setStatus("saving");
    try {
      await saveGardenDoc(supabaseRef.current, docRef.current);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  });

  useEffect(() => {
    docRef.current = doc;
  }, [doc]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      saveRef.current();
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [doc]);

  return { status, saveNow: () => saveRef.current() };
}

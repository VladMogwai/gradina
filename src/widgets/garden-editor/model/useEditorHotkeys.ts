"use client";

import { useEffect } from "react";

interface UseEditorHotkeysParams {
  undo: () => void;
  redo: () => void;
  onEscape: () => void;
}

// Keyboard shortcuts: undo/redo, deselect.
export function useEditorHotkeys({ undo, redo, onEscape }: UseEditorHotkeysParams) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.key === "Escape") {
        onEscape();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, onEscape]);
}

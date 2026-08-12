"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "dhun:reduced-motion";

export function useReducedMotion() {
  // Starts false (motion on) to match server render; corrected on mount so
  // there's no hydration mismatch, same pattern as usePreferredLanguage.
  const [reducedMotion, setReducedMotionState] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setReducedMotionState(stored === "true");
    } else {
      setReducedMotionState(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
  }, []);

  const setReducedMotion = (value: boolean) => {
    setReducedMotionState(value);
    window.localStorage.setItem(STORAGE_KEY, String(value));
  };

  return [reducedMotion, setReducedMotion] as const;
}

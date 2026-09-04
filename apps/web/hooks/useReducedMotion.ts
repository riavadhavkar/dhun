"use client";

import { useMotionState } from "@/components/MotionProvider";

// Thin adapter over the app-wide motion state (see <MotionProvider>). Kept as a
// tuple so existing call sites don't change.
export function useReducedMotion() {
  const { reducedMotion, setReducedMotion } = useMotionState();
  return [reducedMotion, setReducedMotion] as const;
}

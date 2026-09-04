"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const COOKIE_KEY = "dhun_reduced_motion";
const STORAGE_KEY = "dhun:reduced-motion";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

interface MotionState {
  reducedMotion: boolean;
  setReducedMotion: (value: boolean) => void;
}

const MotionContext = createContext<MotionState | null>(null);

// Single source of truth: a first-party cookie (read server-side in the root
// layout so the first paint is already correct — no flash, no re-derivation on
// navigation), mirrored to localStorage and a <html data-reduced-motion> hook.
function persist(value: boolean): void {
  const raw = String(value);
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    /* private mode — the cookie still carries it */
  }
  document.cookie = `${COOKIE_KEY}=${raw}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  document.documentElement.dataset.reducedMotion = raw;
}

export function MotionProvider({
  initialReducedMotion,
  children,
}: {
  initialReducedMotion: boolean;
  children: React.ReactNode;
}) {
  const [reducedMotion, setState] = useState(initialReducedMotion);

  // First visit only (no cookie yet): adopt the OS setting and save it. From
  // then on the cookie is authoritative and nothing re-derives it.
  useEffect(() => {
    if (document.cookie.includes(`${COOKIE_KEY}=`)) return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    setState(prefersReduced);
    persist(prefersReduced);
  }, []);

  const setReducedMotion = useCallback((value: boolean) => {
    setState(value);
    persist(value);
  }, []);

  return (
    <MotionContext.Provider value={{ reducedMotion, setReducedMotion }}>
      {children}
    </MotionContext.Provider>
  );
}

export function useMotionState(): MotionState {
  const ctx = useContext(MotionContext);
  if (!ctx) {
    throw new Error("useMotionState must be used within <MotionProvider>");
  }
  return ctx;
}

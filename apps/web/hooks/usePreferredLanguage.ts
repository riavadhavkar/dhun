"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "dhun:preferred-language";
const DEFAULT_LANGUAGE = "en";

export function usePreferredLanguage() {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setLanguageState(stored);
  }, []);

  const setLanguage = (code: string) => {
    setLanguageState(code);
    window.localStorage.setItem(STORAGE_KEY, code);
  };

  return [language, setLanguage] as const;
}

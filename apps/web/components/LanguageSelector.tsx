"use client";

import { useLanguages } from "@/hooks/useLanguages";

import styles from "./LanguageSelector.module.css";

interface LanguageSelectorProps {
  value: string;
  onChange: (code: string) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const { data: languages } = useLanguages();

  return (
    <select
      className={styles.select}
      aria-label="translation language"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {languages?.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}

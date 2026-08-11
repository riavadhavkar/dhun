"use client";

import { useLanguages } from "@/hooks/useLanguages";

interface LanguageSelectorProps {
  value: string;
  onChange: (code: string) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const { data: languages } = useLanguages();

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "0.5rem 0.75rem",
        borderRadius: "8px",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        color: "var(--text)",
      }}
    >
      {languages?.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}

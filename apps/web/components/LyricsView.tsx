"use client";

import { useEffect, useMemo, useRef } from "react";

import { findActiveLineIndex } from "@/lib/lyrics";
import type { LyricLine } from "@/lib/types";

interface LyricsViewProps {
  lines: LyricLine[];
  positionMs: number;
}

export function LyricsView({ lines, positionMs }: LyricsViewProps) {
  const activeIndex = useMemo(() => findActiveLineIndex(lines, positionMs), [lines, positionMs]);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    lineRefs.current[activeIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIndex]);

  return (
    <div style={{ maxHeight: "60vh", overflowY: "auto", padding: "1rem 0" }}>
      {lines.map((line, i) => {
        const isActive = i === activeIndex;
        const isPast = i < activeIndex;
        return (
          <div
            key={line.start_ms}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
            style={{
              padding: "0.6rem 0",
              opacity: isActive ? 1 : isPast ? 0.35 : 0.55,
              transform: isActive ? "scale(1.03)" : "scale(1)",
              transformOrigin: "left",
              transition: "opacity 150ms ease, transform 150ms ease",
            }}
          >
            <div
              style={{
                fontSize: "1.15rem",
                fontWeight: isActive ? 700 : 400,
                color: isActive ? "var(--accent)" : "var(--text)",
              }}
            >
              {line.original}
            </div>
            <div style={{ fontSize: "0.95rem", color: "var(--text-dim)" }}>{line.translated}</div>
          </div>
        );
      })}
    </div>
  );
}

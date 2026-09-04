"use client";

import { useEffect, useMemo, useRef } from "react";

import { findActiveLineIndex } from "@/lib/lyrics";
import type { LyricLine } from "@/lib/types";

import styles from "./LyricsView.module.css";

interface LyricsViewProps {
  lines: LyricLine[];
  positionMs: number;
  onSeek: (ms: number) => void;
}

export function LyricsView({ lines, positionMs, onSeek }: LyricsViewProps) {
  const activeIndex = useMemo(() => findActiveLineIndex(lines, positionMs), [lines, positionMs]);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    lineRefs.current[activeIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIndex]);

  return (
    <div className={styles.scroll}>
      {lines.map((line, i) => {
        const state =
          i === activeIndex ? styles.active : i < activeIndex ? styles.past : styles.upcoming;
        return (
          <div
            key={line.start_ms}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
            className={`${styles.line} ${state}`}
            onClick={() => onSeek(line.start_ms)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSeek(line.start_ms);
            }}
          >
            <div className={styles.original}>{line.original}</div>
            {line.pronunciation && (
              <div className={styles.pronunciation}>{line.pronunciation}</div>
            )}
            {line.translated && <div className={styles.translated}>{line.translated}</div>}
          </div>
        );
      })}
    </div>
  );
}

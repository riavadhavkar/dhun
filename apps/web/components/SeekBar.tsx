"use client";

import { useState } from "react";

import styles from "./SeekBar.module.css";

interface SeekBarProps {
  positionMs: number;
  durationMs: number;
  disabled?: boolean;
  onSeek: (ms: number) => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function SeekBar({ positionMs, durationMs, disabled, onSeek }: SeekBarProps) {
  // While dragging, show the drag value instead of the live (polled)
  // position — otherwise the slider fights the poll and jumps back mid-drag.
  const [dragValue, setDragValue] = useState<number | null>(null);
  const displayValue = dragValue ?? positionMs;
  const max = durationMs || 1;
  const pct = `${Math.min(100, (displayValue / max) * 100)}%`;

  const commitSeek = (e: React.SyntheticEvent<HTMLInputElement>) => {
    onSeek(Number(e.currentTarget.value));
    setDragValue(null);
  };

  return (
    <div className={styles.wrap}>
      <input
        className={styles.range}
        style={{ "--pct": pct } as React.CSSProperties}
        type="range"
        min={0}
        max={max}
        value={Math.min(displayValue, max)}
        disabled={disabled}
        aria-label="seek"
        onChange={(e) => setDragValue(Number(e.target.value))}
        onMouseUp={commitSeek}
        onTouchEnd={commitSeek}
      />
      <div className={styles.times}>
        <span>{formatTime(displayValue)}</span>
        <span>{formatTime(durationMs)}</span>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

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

  const commitSeek = (e: React.SyntheticEvent<HTMLInputElement>) => {
    onSeek(Number(e.currentTarget.value));
    setDragValue(null);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%" }}>
      <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", minWidth: "2.5rem" }}>
        {formatTime(displayValue)}
      </span>
      <input
        type="range"
        min={0}
        max={max}
        value={Math.min(displayValue, max)}
        disabled={disabled}
        onChange={(e) => setDragValue(Number(e.target.value))}
        onMouseUp={commitSeek}
        onTouchEnd={commitSeek}
        style={{ flex: 1, accentColor: "var(--accent)", opacity: disabled ? 0.4 : 1 }}
      />
      <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", minWidth: "2.5rem" }}>
        {formatTime(durationMs)}
      </span>
    </div>
  );
}

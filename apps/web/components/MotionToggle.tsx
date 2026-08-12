"use client";

interface MotionToggleProps {
  reducedMotion: boolean;
  onChange: (value: boolean) => void;
}

export function MotionToggle({ reducedMotion, onChange }: MotionToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={reducedMotion}
      aria-label="Reduce motion"
      title="Reduce motion"
      onClick={() => onChange(!reducedMotion)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.4rem 0.7rem",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        background: reducedMotion ? "var(--surface)" : "transparent",
        color: reducedMotion ? "var(--text)" : "var(--text-dim)",
        fontSize: "0.8rem",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: "0.6rem",
          height: "0.6rem",
          borderRadius: "50%",
          background: reducedMotion ? "var(--accent)" : "var(--border)",
        }}
      />
      Reduce motion
    </button>
  );
}

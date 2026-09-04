"use client";

import styles from "./MotionToggle.module.css";

interface MotionToggleProps {
  reducedMotion: boolean;
  onChange: (value: boolean) => void;
}

export function MotionToggle({ reducedMotion, onChange }: MotionToggleProps) {
  // Icon + label both describe the current state: walking = motion reduced,
  // running = motion on.
  const label = reducedMotion ? "reduced motion" : "motion on";

  return (
    <button
      type="button"
      className={styles.button}
      aria-pressed={reducedMotion}
      aria-label={label}
      data-tip={label}
      onClick={() => onChange(!reducedMotion)}
    >
      <span aria-hidden="true">{reducedMotion ? "🚶‍♀️" : "🏃‍♀️"}</span>
    </button>
  );
}

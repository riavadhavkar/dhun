"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[dhun] unhandled page error", error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-md)",
        padding: "var(--space-xl)",
        textAlign: "center",
        color: "var(--text)",
        background: "var(--bg)",
      }}
    >
      <span style={{ fontSize: "3rem" }}>(ᵕ—ᴗ—)</span>
      <h1 style={{ margin: 0, fontSize: "1.25rem" }}>something skipped</h1>
      <p style={{ margin: 0, color: "var(--text-dim)", maxWidth: "36ch" }}>
        dhun hit an unexpected error. try again — if it keeps happening, refresh the page.
      </p>
      <button
        onClick={reset}
        style={{
          marginTop: "var(--space-sm)",
          color: "var(--accent-ink)",
          background: "var(--accent-soft)",
          padding: "var(--space-sm) var(--space-lg)",
          borderRadius: "var(--radius-full)",
          border: "none",
          cursor: "pointer",
          fontWeight: 600,
          font: "inherit",
        }}
      >
        try again
      </button>
    </main>
  );
}

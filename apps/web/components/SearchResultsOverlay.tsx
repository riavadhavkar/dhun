"use client";

import { motion } from "framer-motion";
import Image from "next/image";

import type { TrackSearchResult } from "@/lib/types";

interface SearchResultsOverlayProps {
  results: TrackSearchResult[];
  isFetching: boolean;
  error: Error | null;
  onSelect: (track: TrackSearchResult) => void;
}

export function SearchResultsOverlay({ results, isFetching, error, onSelect }: SearchResultsOverlayProps) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        marginTop: "var(--space-sm)",
        overflow: "hidden",
      }}
    >
      {isFetching && (
        <p style={{ color: "var(--text-dim)", padding: "var(--space-md)", margin: 0 }}>Searching…</p>
      )}
      {error && (
        <p style={{ color: "#f87171", padding: "var(--space-md)", margin: 0 }}>
          Couldn&apos;t reach the search service. Is the backend running?
        </p>
      )}
      {!isFetching && !error && results.length === 0 && (
        <p style={{ color: "var(--text-dim)", padding: "var(--space-md)", margin: 0 }}>No results.</p>
      )}

      <ul
        aria-live="polite"
        style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: "50vh", overflowY: "auto" }}
      >
        {results.map((track) => (
          <li key={track.id}>
            <button
              onClick={() => onSelect(track)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                width: "100%",
                padding: "var(--space-sm)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                color: "var(--text)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {/* Shares layoutId with RecordPlayer's art image — this is the
                  flight animation's source element. */}
              <motion.div
                layoutId={`album-art-${track.id}`}
                style={{ width: 48, height: 48, borderRadius: "var(--radius-sm)", overflow: "hidden", flexShrink: 0 }}
              >
                {track.album_art ? (
                  <Image src={track.album_art} alt={track.album} width={48} height={48} />
                ) : (
                  <div style={{ width: 48, height: 48, background: "var(--vinyl-black)" }} />
                )}
              </motion.div>
              <div>
                <div>{track.name}</div>
                <div style={{ color: "var(--text-dim)", fontSize: "0.875rem" }}>{track.artist}</div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

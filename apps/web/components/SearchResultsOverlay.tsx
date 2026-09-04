"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { TrackSearchResult } from "@/lib/types";

import styles from "./SearchResultsOverlay.module.css";

interface SearchResultsOverlayProps {
  results: TrackSearchResult[];
  isFetching: boolean;
  error: Error | null;
  onSelect: (track: TrackSearchResult) => void;
}

export function SearchResultsOverlay({ results, isFetching, error, onSelect }: SearchResultsOverlayProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  // Reset the highlight whenever the result set changes.
  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  // Arrow-key navigation over the results, scoped to when the list has focus
  // within it (keeps the search input's own caret keys working).
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      onSelect(results[activeIndex]);
    }
  };

  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <div className={styles.overlay} onKeyDown={handleKeyDown}>
      {isFetching && <p className={styles.note}>searching…</p>}
      {error && (
        <p className={styles.noteError}>
          couldn&apos;t reach the search service. is the backend running?
        </p>
      )}
      {!isFetching && !error && results.length === 0 && (
        <p className={styles.note}>no results.</p>
      )}

      <ul
        ref={listRef}
        className={styles.list}
        aria-live="polite"
        aria-label={
          results.length > 0 ? `${results.length} results` : undefined
        }
      >
        {results.map((track, i) => (
          // `layout="position"` on the whole row so that when results reorder,
          // the thumbnail and the title/artist glide to their new spot together
          // — the thumbnail's own layoutId used to animate on its own while the
          // text snapped.
          <motion.li key={track.id} layout="position">
            <button
              className={`${styles.row} ${i === activeIndex ? styles.rowActive : ""}`}
              onClick={() => onSelect(track)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {/* Shares layoutId with RecordPlayer's art — the flight source. */}
              <motion.div className={styles.thumb} layoutId={`album-art-${track.id}`}>
                {track.album_art ? (
                  <Image src={track.album_art} alt={track.album} width={48} height={48} />
                ) : (
                  <div className={styles.thumbFallback} />
                )}
              </motion.div>
              <div className={styles.meta}>
                <div className={styles.name}>{track.name}</div>
                <div className={styles.artist}>{track.artist}</div>
              </div>
            </button>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

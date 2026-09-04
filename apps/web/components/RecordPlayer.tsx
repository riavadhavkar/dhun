"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import styles from "./RecordPlayer.module.css";

export interface RecordPlayerTrack {
  id: string;
  name: string;
  album: string;
  album_art: string | null;
}

interface RecordPlayerProps {
  track: RecordPlayerTrack | null;
  isPlaying: boolean;
  reducedMotion: boolean;
  /** 0–1 playback position — drives the tonearm's slow inward creep. */
  progress?: number;
}

// Tonearm rotation (pivot at top-right): parked clear of the disc, then it
// drops onto the outer groove at the song's start and creeps toward the label
// as it plays — like a real deck.
const TONEARM_PARKED = -4;
const TONEARM_START = 17; // needle on the outer groove, near the disc rim
const TONEARM_END = 27; // needle just outside the album-art label — no overlap

export function RecordPlayer({
  track,
  isPlaying,
  reducedMotion,
  progress = 0,
}: RecordPlayerProps) {
  // Gates spin/tonearm-down — and which art layer renders — until the
  // album art's flight animation has actually finished landing on the
  // platter.
  const [flightComplete, setFlightComplete] = useState(false);

  // Resetting this in a useEffect (which runs after commit) races with the
  // page's click handler, which unmounts the search results overlay (the
  // flight's "from" element) in the SAME render as selecting a new track.
  // On any selection after the first, flightComplete was still true from
  // the previous track by the time this render decides what to show, so the
  // art swapped instantly with no flight — and by the time the effect fired
  // a render later, the "from" element was already gone, so the flight
  // layer mounted with nothing to animate from and never actually landed
  // (no onLayoutAnimationComplete), leaving the disc gated off forever.
  // Resetting synchronously during render — React's documented pattern for
  // "adjusting state when a prop changes" — closes that race.
  const [trackedId, setTrackedId] = useState<string | null>(track?.id ?? null);
  if ((track?.id ?? null) !== trackedId) {
    setTrackedId(track?.id ?? null);
    setFlightComplete(false);
  }

  const hasTrack = track !== null;
  // Engaged once the record is playing — and it *stays* engaged while paused
  // (progress > 0), like a real deck where you'd have to lift the arm yourself.
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const armEngaged = hasTrack && (isPlaying || clampedProgress > 0);
  const tonearmAngle = armEngaged
    ? TONEARM_START + clampedProgress * (TONEARM_END - TONEARM_START)
    : TONEARM_PARKED;
  // Spin as soon as audio is playing — the disc is a sibling of the flight
  // element, never its ancestor, so it's safe to rotate during the ~550ms
  // art flight. Gating this on `flightComplete` (a Framer callback that can
  // silently not fire) was leaving the platter frozen mid-song.
  const spinning = !reducedMotion && isPlaying;

  const art = (t: RecordPlayerTrack) =>
    t.album_art ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={t.album_art} alt={t.album} />
    ) : (
      <span className={styles.wordmark} style={{ fontSize: "1.1rem" }}>
        dhun
      </span>
    );

  return (
    <div className={styles.stage}>
      <div className={`${styles.glow} ${spinning ? styles.glowOn : ""}`} aria-hidden="true" />

      {/* Rotating disc — plain CSS animation, and deliberately never contains
          a Framer `layoutId`-tracked element. A continuously rotating ancestor
          invalidates Framer's layout projection every frame, which is what
          caused the art to visually detach and drift. The layoutId element
          must never be a descendant of anything that rotates, ever. */}
      <div
        className={styles.disc}
        aria-hidden="true"
        style={{ animationPlayState: spinning ? "running" : "paused" }}
      >
        {/* Plain (non-Framer) art layer — only mounted once the flight has
            landed, so it never coexists with the layoutId flight element
            below for the same track. Same size/position as the flight
            element's landing spot, so the handoff is visually seamless. */}
        {track && flightComplete && (
          <div
            className={`${styles.label} ${
              track.album_art ? styles.labelArt : styles.labelFallback
            }`}
          >
            {art(track)}
          </div>
        )}

        {!hasTrack && (
          <span className={styles.emptyMark} aria-hidden="true">
            dhun
          </span>
        )}

        {hasTrack && <div className={styles.spindle} />}
      </div>

      {/* Flight layer — a sibling of the rotating disc, not a descendant, so
          Framer's layout projection is never fighting a rotating ancestor.
          Lands at exactly the spot the plain art layer above occupies. */}
      {track && !flightComplete && (
        <motion.div
          className={styles.flight}
          layoutId={`album-art-${track.id}`}
          onLayoutAnimationComplete={() => setFlightComplete(true)}
          transition={{ duration: reducedMotion ? 0.15 : 0.55, ease: [0, 0, 0.2, 1] }}
          style={{
            background: track.album_art ? "var(--surface)" : "#1a1a1f",
          }}
        >
          {art(track)}
        </motion.div>
      )}

      {/* Tonearm — pivots at top-right, parked clear of the platter, then drops
          onto the outer groove and creeps toward the label as the song plays. */}
      <motion.div
        className={styles.tonearm}
        aria-hidden="true"
        // Framer overrides CSS transform-origin with its own default (center),
        // so the pivot point must be set inline here, not in the module.
        style={{ transformOrigin: "top center" }}
        animate={{ rotate: tonearmAngle }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.6, ease: "easeOut" }}
      >
        <div className={styles.tonearmTube} />
        <div className={styles.tonearmPivot} />
        <div className={styles.tonearmHead} />
      </motion.div>
    </div>
  );
}

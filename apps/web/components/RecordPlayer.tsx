"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

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
  size?: number;
}

const SPIN_SECONDS_PER_ROTATION = 1.8;

function ArtContent({ track, size }: { track: RecordPlayerTrack; size: number }) {
  return track.album_art ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={track.album_art}
      alt={track.album}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  ) : (
    <span style={{ fontSize: size * 0.1, color: "var(--vinyl-dark)", fontWeight: 700 }}>dhun</span>
  );
}

export function RecordPlayer({ track, isPlaying, reducedMotion, size = 220 }: RecordPlayerProps) {
  // Gates spin/tonearm-down — and which art layer renders — until the
  // album art's flight animation has actually finished landing on the
  // platter.
  const [flightComplete, setFlightComplete] = useState(false);

  useEffect(() => {
    setFlightComplete(false);
  }, [track?.id]);

  const hasTrack = track !== null;
  const tonearmLowered = reducedMotion ? hasTrack : isPlaying && flightComplete;
  const spinning = !reducedMotion && isPlaying && flightComplete;

  const containerSize = size * 1.3;
  const artSize = size * 0.9;
  const artInset = (size - artSize) / 2;

  const artBackground = track?.album_art ? "var(--surface)" : "var(--label-gold)";

  return (
    <div
      style={{
        position: "relative",
        width: containerSize,
        height: containerSize * 0.95,
        margin: "0 auto",
      }}
    >
      {/* Rotating disc — plain CSS animation, and deliberately never
          contains a Framer `layoutId`-tracked element. Framer's layout
          projection computes an element's position via getBoundingClientRect
          and applies a compensating transform assuming a stable coordinate
          space; a continuously rotating ancestor (whether the rotation is
          CSS- or Framer-driven) invalidates that assumption every frame,
          which is what caused the art to visually detach and drift instead
          of tracking the disc. The fix is architectural, not just "use CSS
          instead of Framer for the rotation": the layoutId element must
          never be a descendant of anything that rotates, ever. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: size,
          height: size,
          borderRadius: "50%",
          background:
            "repeating-radial-gradient(circle, var(--vinyl-groove) 0px, var(--vinyl-groove) 1px, transparent 2px, transparent 5px), " +
            "radial-gradient(circle at 38% 32%, var(--vinyl-highlight) 0%, var(--vinyl-mid) 45%, var(--vinyl-dark) 100%)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          animation: `dhun-spin ${SPIN_SECONDS_PER_ROTATION}s linear infinite`,
          animationPlayState: spinning ? "running" : "paused",
        }}
      >
        {/* Plain (non-Framer) art layer — only mounted once the flight has
            landed, so it never coexists with the layoutId flight element
            below for the same track. Same size/position as the flight
            element's landing spot, so the handoff is visually seamless. */}
        {track && flightComplete && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: artSize,
              height: artSize,
              borderRadius: "50%",
              overflow: "hidden",
              background: artBackground,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArtContent track={track} size={size} />
          </div>
        )}

        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: size * 0.03,
            height: size * 0.03,
            borderRadius: "50%",
            background: "var(--bg)",
            zIndex: 2,
          }}
        />
      </div>

      {/* Flight layer — a sibling of the rotating disc, not a descendant, so
          Framer's layout projection is never fighting a rotating ancestor.
          Positioned to land at exactly the same screen spot the plain art
          layer above occupies, so there's no visible jump at handoff (the
          disc is always at 0deg when this completes, since spinning only
          starts once flightComplete flips true). */}
      {track && !flightComplete && (
        <motion.div
          layoutId={`album-art-${track.id}`}
          onLayoutAnimationComplete={() => setFlightComplete(true)}
          transition={{ duration: reducedMotion ? 0.15 : 0.55, ease: [0, 0, 0.2, 1] }}
          style={{
            position: "absolute",
            left: artInset,
            bottom: artInset,
            width: artSize,
            height: artSize,
            borderRadius: "50%",
            overflow: "hidden",
            background: artBackground,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <ArtContent track={track} size={size} />
        </motion.div>
      )}

      {/* Tonearm — pivots at top-right, rests off-disc when lifted, angles
          down onto the platter's edge when lowered. */}
      <motion.div
        aria-hidden="true"
        animate={{ rotate: tonearmLowered ? 25 : -20 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.35, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: 0,
          right: size * 0.08,
          width: 4,
          height: size * 0.55,
          borderRadius: "var(--radius-full)",
          background: "var(--tonearm-metal)",
          transformOrigin: "top center",
          zIndex: 3,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -5,
            left: -6,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "var(--tonearm-metal)",
          }}
        />
      </motion.div>
    </div>
  );
}

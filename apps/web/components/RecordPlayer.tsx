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

export function RecordPlayer({ track, isPlaying, reducedMotion, size = 220 }: RecordPlayerProps) {
  // Gates spin/tonearm-down until the album art's flight animation (driven
  // by its shared layoutId with the search result thumbnail) has actually
  // finished landing on the platter — otherwise the disc would start
  // spinning mid-flight, before the art has arrived.
  const [flightComplete, setFlightComplete] = useState(false);

  useEffect(() => {
    setFlightComplete(false);
  }, [track?.id]);

  const hasTrack = track !== null;
  const tonearmLowered = reducedMotion ? hasTrack : isPlaying && flightComplete;
  const spinning = !reducedMotion && isPlaying && flightComplete;

  const containerSize = size * 1.3;

  return (
    <div
      style={{
        position: "relative",
        width: containerSize,
        height: containerSize * 0.95,
        margin: "0 auto",
      }}
    >
      {/* Plain CSS animation, not Framer Motion, drives the spin — nesting a
          Framer `layoutId`-tracked child (the album art below) inside a
          parent that Framer *itself* is also animating causes the two to
          fight over the child's projected position every frame (visible as
          the art teleporting/spinning independently of the disc). A CSS
          `@keyframes` animation on a plain element has no such conflict, and
          `animationPlayState: paused` (vs. removing the animation) is the
          correct native way to freeze mid-rotation instead of resetting to 0deg. */}
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
        {track && (
          <motion.div
            layoutId={`album-art-${track.id}`}
            onLayoutAnimationComplete={() => setFlightComplete(true)}
            transition={{ duration: reducedMotion ? 0.15 : 0.55, ease: [0, 0, 0.2, 1] }}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: size * 0.9,
              height: size * 0.9,
              borderRadius: "50%",
              overflow: "hidden",
              background: track.album_art ? "var(--surface)" : "var(--label-gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {track.album_art ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={track.album_art}
                alt={track.album}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: size * 0.1, color: "var(--vinyl-dark)", fontWeight: 700 }}>dhun</span>
            )}
          </motion.div>
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

"use client";

import { motion, useAnimationControls } from "framer-motion";
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

  // Imperative controls, not a plain `animate` prop, are what let a paused
  // disc freeze at whatever angle it was at instead of snapping back to 0 —
  // `.stop()` halts the loop in place; only `.start()` ever sets a target.
  const discControls = useAnimationControls();

  useEffect(() => {
    if (spinning) {
      discControls.start({
        rotate: 360,
        transition: { repeat: Infinity, duration: SPIN_SECONDS_PER_ROTATION, ease: "linear" },
      });
    } else {
      discControls.stop();
    }
  }, [spinning, discControls]);

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
      <motion.div
        aria-hidden="true"
        animate={discControls}
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: size,
          height: size,
          borderRadius: "50%",
          background:
            "repeating-radial-gradient(circle, var(--vinyl-black) 0px, var(--vinyl-black) 3px, var(--vinyl-groove) 4px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
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
              width: size,
              height: size,
              borderRadius: "50%",
              overflow: "hidden",
              background: "var(--surface)",
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
              <span style={{ fontSize: size * 0.1, color: "var(--text-dim)", fontWeight: 700 }}>dhun</span>
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
      </motion.div>

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
          width: 6,
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
            top: -4,
            left: -5,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "var(--tonearm-metal)",
          }}
        />
      </motion.div>
    </div>
  );
}

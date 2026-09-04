"use client";

import type { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";
import type { TrackSearchResult } from "@/lib/types";

import { LanguageSelector } from "./LanguageSelector";
import styles from "./PlaybackControls.module.css";
import { PlayButton } from "./PlayButton";
import { SeekBar } from "./SeekBar";

const SKIP_MS = 10_000;

interface PlaybackControlsProps {
  track: TrackSearchResult;
  player: ReturnType<typeof useSpotifyPlayer>;
  isLoaded: boolean;
  isPlaying: boolean;
  language: string;
  onLanguageChange: (code: string) => void;
  onStarted: () => void;
  onSeek: (ms: number) => void;
}

export function PlaybackControls({
  track,
  player,
  isLoaded,
  language,
  onLanguageChange,
  onStarted,
  onSeek,
}: PlaybackControlsProps) {
  const duration = track.duration_ms ?? player.durationMs;
  const canSkip = player.isAuthenticated && player.isReady && !player.error && isLoaded;

  const skip = (deltaMs: number) => {
    const next = Math.min(Math.max(player.positionMs + deltaMs, 0), duration || 0);
    onSeek(next);
  };

  return (
    <div className={styles.controls}>
      <div className={styles.meta}>
        <div className={styles.title}>{track.name}</div>
        <div className={styles.artist}>{track.artist}</div>
      </div>

      {player.isAuthenticated && (
        <SeekBar
          positionMs={player.positionMs}
          durationMs={duration}
          disabled={!player.isReady}
          onSeek={onSeek}
        />
      )}

      <div className={styles.transport}>
        {canSkip && (
          <button
            className={styles.skip}
            onClick={() => skip(-SKIP_MS)}
            aria-label="back 10 seconds"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M11 18V6l-8.5 6 8.5 6zM11.5 12l8.5 6V6l-8.5 6z" />
            </svg>
          </button>
        )}

        <PlayButton
          spotifyTrackId={track.id}
          player={player}
          started={isLoaded}
          onStarted={onStarted}
        />

        {canSkip && (
          <button
            className={styles.skip}
            onClick={() => skip(SKIP_MS)}
            aria-label="forward 10 seconds"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 18l8.5-6L4 6v12zM13 6v12l8.5-6L13 6z" />
            </svg>
          </button>
        )}
      </div>

      <LanguageSelector value={language} onChange={onLanguageChange} />
    </div>
  );
}

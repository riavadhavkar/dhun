"use client";

import { signIn } from "next-auth/react";

import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";

import styles from "./PlayButton.module.css";

interface PlayButtonProps {
  spotifyTrackId: string;
  player: ReturnType<typeof useSpotifyPlayer>;
  // Whether *this* track has been started at least once — lifted to the
  // parent since the seek bar and lyric-click-to-seek need to know it too
  // (resuming after pause should call `togglePlay`; `playTrack` always
  // restarts from the given position instead of resuming).
  started: boolean;
  onStarted: () => void;
}

export function PlayButton({ spotifyTrackId, player, started, onStarted }: PlayButtonProps) {
  if (!player.isAuthenticated) {
    return (
      <button className={styles.connect} onClick={() => signIn("spotify")}>
        connect spotify
      </button>
    );
  }

  if (player.error) {
    return <p className={styles.status}>{player.error.toLowerCase()}</p>;
  }

  if (!player.isReady) {
    return <p className={styles.status}>connecting…</p>;
  }

  const handleClick = () => {
    if (!started) {
      player.activateElement();
      onStarted();
      player.playTrack(spotifyTrackId);
    } else {
      player.togglePlay();
    }
  };

  return (
    <button
      className={styles.play}
      onClick={handleClick}
      aria-label={player.isPaused ? "play" : "pause"}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {player.isPaused ? (
          <path d="M8 5v14l11-7z" />
        ) : (
          <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
        )}
      </svg>
    </button>
  );
}

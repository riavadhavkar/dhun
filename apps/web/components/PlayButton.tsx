"use client";

import { signIn } from "next-auth/react";

import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";

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
      <button onClick={() => signIn("spotify")} style={buttonStyle}>
        Connect Spotify to play
      </button>
    );
  }

  if (player.error) {
    return <p style={{ color: "#f87171" }}>{player.error}</p>;
  }

  if (!player.isReady) {
    return <p style={{ color: "var(--text-dim)" }}>Connecting to Spotify…</p>;
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
    <button onClick={handleClick} style={buttonStyle}>
      {player.isPaused ? "Play" : "Pause"}
    </button>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: "0.6rem 1.25rem",
  borderRadius: "999px",
  border: "none",
  background: "var(--accent)",
  color: "#04140a",
  fontWeight: 600,
  cursor: "pointer",
};

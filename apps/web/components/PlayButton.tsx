"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";

interface PlayButtonProps {
  spotifyTrackId: string;
  player: ReturnType<typeof useSpotifyPlayer>;
}

export function PlayButton({ spotifyTrackId, player }: PlayButtonProps) {
  // Tracks whether *this* track has been started via `play`, since resuming
  // after a pause should call `togglePlay` — `playTrack` always restarts it.
  const [started, setStarted] = useState(false);

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
      setStarted(true);
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

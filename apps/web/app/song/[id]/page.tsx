"use client";

import Image from "next/image";
import { useState } from "react";

import { LanguageSelector } from "@/components/LanguageSelector";
import { LyricsView } from "@/components/LyricsView";
import { PlayButton } from "@/components/PlayButton";
import { SeekBar } from "@/components/SeekBar";
import { useLyrics } from "@/hooks/useLyrics";
import { usePreferredLanguage } from "@/hooks/usePreferredLanguage";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";
import { useTrack } from "@/hooks/useTrack";

export default function SongPage({ params }: { params: { id: string } }) {
  const { id: trackId } = params;

  const { data: track } = useTrack(trackId);
  const [language, setLanguage] = usePreferredLanguage();
  const { data: lyrics, isLoading, error } = useLyrics(trackId, language);
  const player = useSpotifyPlayer();
  const [started, setStarted] = useState(false);

  const handleSeek = (ms: number) => {
    if (!started) {
      setStarted(true);
      player.playTrack(trackId, ms);
    } else {
      player.seek(ms);
    }
  };

  return (
    <main>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        {track?.album_art && (
          <Image
            src={track.album_art}
            alt={track.album}
            width={72}
            height={72}
            style={{ borderRadius: "6px" }}
          />
        )}
        <div>
          <h1 style={{ fontSize: "1.4rem", margin: 0 }}>{track?.name ?? "…"}</h1>
          <p style={{ color: "var(--text-dim)", margin: 0 }}>{track?.artist}</p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
        <PlayButton spotifyTrackId={trackId} player={player} started={started} onStarted={() => setStarted(true)} />
        <LanguageSelector value={language} onChange={setLanguage} />
      </div>

      {player.isAuthenticated && (
        <div style={{ marginBottom: "1.5rem" }}>
          <SeekBar
            positionMs={player.positionMs}
            durationMs={track?.duration_ms ?? player.durationMs}
            disabled={!player.isReady}
            onSeek={handleSeek}
          />
        </div>
      )}

      {isLoading && <p style={{ color: "var(--text-dim)" }}>Loading lyrics…</p>}
      {error && <p style={{ color: "#f87171" }}>{error.message}</p>}

      {lyrics && <LyricsView lines={lyrics.lines} positionMs={player.positionMs} onSeek={handleSeek} />}
    </main>
  );
}

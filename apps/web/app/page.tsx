"use client";

import { useMemo, useState } from "react";

import { LanguageSelector } from "@/components/LanguageSelector";
import { LyricsView } from "@/components/LyricsView";
import { MotionToggle } from "@/components/MotionToggle";
import { PlayButton } from "@/components/PlayButton";
import { RecordPlayer } from "@/components/RecordPlayer";
import { SearchResultsOverlay } from "@/components/SearchResultsOverlay";
import { SeekBar } from "@/components/SeekBar";
import { useOriginalLyrics } from "@/hooks/useOriginalLyrics";
import { usePreferredLanguage } from "@/hooks/usePreferredLanguage";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSearch } from "@/hooks/useSearch";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";
import { useTranslation } from "@/hooks/useTranslation";
import type { LyricLine, TrackSearchResult } from "@/lib/types";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const { data: results, isFetching, error: searchError } = useSearch(query);

  const [selectedTrack, setSelectedTrack] = useState<TrackSearchResult | null>(null);
  const [loadedTrackId, setLoadedTrackId] = useState<string | null>(null);

  const [language, setLanguage] = usePreferredLanguage();
  const [reducedMotion, setReducedMotion] = useReducedMotion();
  const player = useSpotifyPlayer();

  // Fetched independently — original lyrics are fast (no LLM call involved)
  // and render immediately; translation is slower and fills in a moment
  // later rather than blocking the whole view.
  const {
    data: originalLyrics,
    isLoading: originalLoading,
    error: originalError,
  } = useOriginalLyrics(selectedTrack?.id ?? null);
  const {
    data: translation,
    isLoading: translationLoading,
    error: translationError,
  } = useTranslation(selectedTrack?.id ?? null, language);

  const mergedLines: LyricLine[] | null = useMemo(() => {
    if (!originalLyrics) return null;
    return originalLyrics.lines.map((line, i) => ({
      start_ms: line.start_ms,
      original: line.text,
      pronunciation: translation?.lines[i]?.pronunciation ?? null,
      translated: translation?.lines[i]?.translation ?? null,
    }));
  }, [originalLyrics, translation]);

  const isLoaded = selectedTrack !== null && loadedTrackId === selectedTrack.id;

  const beginPlayback = (trackId: string, positionMs?: number) => {
    player.activateElement();
    setLoadedTrackId(trackId);
    player.playTrack(trackId, positionMs);
  };

  const handleSelectTrack = (track: TrackSearchResult) => {
    setSelectedTrack(track);
    setQuery(""); // closes the results overlay, which is what lets the shared
    // layoutId flight animation actually run (the "from" element unmounts
    // and the "to" element mounts in the same commit)
    if (player.isAuthenticated && player.isReady) {
      beginPlayback(track.id);
    }
  };

  const handleSeek = (ms: number) => {
    if (!selectedTrack) return;
    if (isLoaded) {
      player.seek(ms);
    } else {
      beginPlayback(selectedTrack.id, ms);
    }
  };

  return (
    <main className="dhun-main">
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", marginBottom: "0.5rem" }}>
        <h1 style={{ fontSize: "1.75rem", margin: 0 }}>dhun</h1>
        <div style={{ marginLeft: "auto" }}>
          <MotionToggle reducedMotion={reducedMotion} onChange={setReducedMotion} />
        </div>
      </div>

      <input
        type="text"
        placeholder="Search for a song..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          padding: "0.75rem 1rem",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: "var(--text)",
        }}
      />

      {query.trim().length > 0 && (
        <SearchResultsOverlay
          results={results ?? []}
          isFetching={isFetching}
          error={searchError}
          onSelect={handleSelectTrack}
        />
      )}

      <div className="dhun-columns" style={{ marginTop: "var(--space-xl)" }}>
        <div className="dhun-col-left">
          <RecordPlayer
            track={selectedTrack}
            isPlaying={isLoaded && !player.isPaused}
            reducedMotion={reducedMotion}
          />

          {selectedTrack && (
            <div style={{ marginTop: "var(--space-lg)" }}>
              <div style={{ textAlign: "center", marginBottom: "var(--space-md)" }}>
                <div style={{ fontWeight: 600 }}>{selectedTrack.name}</div>
                <div style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>{selectedTrack.artist}</div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "var(--space-md)",
                  marginBottom: "var(--space-md)",
                }}
              >
                <PlayButton
                  spotifyTrackId={selectedTrack.id}
                  player={player}
                  started={isLoaded}
                  onStarted={() => setLoadedTrackId(selectedTrack.id)}
                />
                <LanguageSelector value={language} onChange={setLanguage} />
              </div>

              {player.isAuthenticated && (
                <SeekBar
                  positionMs={player.positionMs}
                  durationMs={selectedTrack.duration_ms ?? player.durationMs}
                  disabled={!player.isReady}
                  onSeek={handleSeek}
                />
              )}
            </div>
          )}
        </div>

        <div className="dhun-col-right">
          {!selectedTrack && (
            <p style={{ color: "var(--text-dim)", textAlign: "center", marginTop: "var(--space-xl)" }}>
              Search for a song to get started.
            </p>
          )}
          {selectedTrack && originalLoading && <p style={{ color: "var(--text-dim)" }}>Loading lyrics…</p>}
          {selectedTrack && originalError && <p style={{ color: "#f87171" }}>{originalError.message}</p>}
          {selectedTrack && mergedLines && (
            <>
              {translationLoading && (
                <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginBottom: "var(--space-sm)" }}>
                  Translating…
                </p>
              )}
              {translationError && (
                <p style={{ color: "#f87171", fontSize: "0.85rem", marginBottom: "var(--space-sm)" }}>
                  {translationError.message}
                </p>
              )}
              <LyricsView lines={mergedLines} positionMs={player.positionMs} onSeek={handleSeek} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";

import { LyricsView } from "@/components/LyricsView";
import { MotionToggle } from "@/components/MotionToggle";
import { PlaybackControls } from "@/components/PlaybackControls";
import { RecordPlayer } from "@/components/RecordPlayer";
import { SearchResultsOverlay } from "@/components/SearchResultsOverlay";
import { SpotifyConnect, type SpotifyGate } from "@/components/SpotifyConnect";
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
  const isPlaying = isLoaded && !player.isPaused;

  const trackDuration = selectedTrack?.duration_ms ?? player.durationMs;
  const playbackProgress =
    isLoaded && trackDuration > 0 ? player.positionMs / trackDuration : 0;

  // Surface an OAuth failure bounced back from Spotify (declined consent, etc.)
  // then strip it from the URL so a refresh doesn't keep showing it.
  const [oauthError, setOauthError] = useState<string | null>(null);
  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get("error");
    if (!err) return;
    setOauthError(
      err === "AccessDenied" || err === "OAuthCallback"
        ? "spotify access was declined."
        : "spotify sign-in didn’t go through. give it another try."
    );
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  // Which connect/auth screen (if any) to show in place of the controls.
  const spotifyGate: SpotifyGate | null =
    player.authStatus === "loading"
      ? "loading"
      : oauthError
        ? "error"
        : !player.isAuthenticated
          ? "connect"
          : player.sessionError
            ? "expired"
            : player.error
              ? "error"
              : null;
  const spotifyGateMessage = oauthError ?? player.error;

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
    <main className="dhun-page">
      <div className="dhun-shell">
        <div className="dhun-console">
          <div className="dhun-search-row">
            <div className="dhun-search-wrap">
              <svg className="dhun-search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
                <path d="M14 14l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                className="dhun-search"
                type="text"
                placeholder="search for a song"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query.trim().length > 0 && (
                <SearchResultsOverlay
                  results={results ?? []}
                  isFetching={isFetching}
                  error={searchError}
                  onSelect={handleSelectTrack}
                />
              )}
            </div>
            <MotionToggle reducedMotion={reducedMotion} onChange={setReducedMotion} />
          </div>

          <div className="dhun-columns">
            <div className="dhun-col-left">
              <RecordPlayer
                track={selectedTrack}
                isPlaying={isPlaying}
                reducedMotion={reducedMotion}
                progress={playbackProgress}
              />

              {!spotifyGate && selectedTrack && (
                <PlaybackControls
                  track={selectedTrack}
                  player={player}
                  isLoaded={isLoaded}
                  isPlaying={isPlaying}
                  language={language}
                  onLanguageChange={setLanguage}
                  onStarted={() => setLoadedTrackId(selectedTrack.id)}
                  onSeek={handleSeek}
                />
              )}
            </div>

            <div className="dhun-col-right">
              {spotifyGate ? (
                <div className="dhun-empty">
                  <SpotifyConnect variant={spotifyGate} message={spotifyGateMessage} />
                </div>
              ) : !selectedTrack ? (
                <div className="dhun-empty">
                  <p className="dhun-empty-sub">search for a song to begin</p>
                </div>
              ) : (
                <>
                  {originalLoading && (
                    <div className="dhun-skeleton" aria-label="loading lyrics">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="dhun-skeleton-line" />
                      ))}
                    </div>
                  )}

                  {originalError && (
                    <p className="dhun-error">{originalError.message.toLowerCase()}</p>
                  )}

                  {mergedLines && (
                    <>
                      <div className="dhun-lyrics-status">
                        {translationLoading && (
                          <span className="dhun-pill">translating…</span>
                        )}
                        {translationError && (
                          <span className="dhun-pill dhun-pill-error">
                            {translationError.message.toLowerCase()}
                          </span>
                        )}
                      </div>
                      <LyricsView
                        lines={mergedLines}
                        positionMs={player.positionMs}
                        onSeek={handleSeek}
                      />
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <footer className="dhun-copyright" suppressHydrationWarning>
          © {new Date().getFullYear()} dhun. all rights reserved
        </footer>
      </div>
    </main>
  );
}

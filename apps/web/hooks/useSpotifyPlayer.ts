"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

const SDK_SRC = "https://sdk.scdn.co/spotify-player.js";
const POLL_INTERVAL_MS = 250;

interface SpotifyPlayerState {
  isReady: boolean;
  deviceId: string | null;
  isPaused: boolean;
  positionMs: number;
  durationMs: number;
  error: string | null;
}

function loadSdkScript(): Promise<void> {
  if (window.Spotify) return Promise.resolve();

  return new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${SDK_SRC}"]`);
    if (!existing) {
      const script = document.createElement("script");
      script.src = SDK_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
  });
}

export function useSpotifyPlayer() {
  const { data: session, status } = useSession();
  const accessTokenRef = useRef<string | undefined>(session?.accessToken);
  accessTokenRef.current = session?.accessToken;

  const playerRef = useRef<Spotify.Player | null>(null);
  const [state, setState] = useState<SpotifyPlayerState>({
    isReady: false,
    deviceId: null,
    isPaused: true,
    positionMs: 0,
    durationMs: 0,
    error: null,
  });

  useEffect(() => {
    if (status !== "authenticated" || !session?.accessToken) return;

    let cancelled = false;

    loadSdkScript().then(() => {
      if (cancelled) return;

      const player = new window.Spotify.Player({
        name: "dhun",
        getOAuthToken: (cb) => cb(accessTokenRef.current ?? ""),
        volume: 0.8,
      });

      player.addListener("ready", ({ device_id }) => {
        setState((s) => ({ ...s, isReady: true, deviceId: device_id, error: null }));
      });

      player.addListener("not_ready", () => {
        setState((s) => ({ ...s, isReady: false }));
      });

      player.addListener("initialization_error", ({ message }) => {
        setState((s) => ({ ...s, error: message }));
      });
      player.addListener("authentication_error", ({ message }) => {
        setState((s) => ({ ...s, error: message }));
      });
      player.addListener("account_error", () => {
        setState((s) => ({
          ...s,
          error: "This feature requires a Spotify Premium account.",
        }));
      });

      player.addListener("player_state_changed", (playbackState) => {
        if (!playbackState) return;
        setState((s) => ({
          ...s,
          isPaused: playbackState.paused,
          durationMs: playbackState.duration,
        }));
      });

      player.connect();
      playerRef.current = player;
    });

    return () => {
      cancelled = true;
      playerRef.current?.disconnect();
      playerRef.current = null;
    };
  }, [status, session?.accessToken]);

  // The SDK only emits `player_state_changed` on discrete events (play/pause/seek),
  // not continuously — poll for position so the karaoke highlight stays smooth.
  useEffect(() => {
    if (!state.isReady) return;

    const interval = setInterval(async () => {
      const playbackState = await playerRef.current?.getCurrentState();
      if (playbackState) {
        setState((s) => ({ ...s, positionMs: playbackState.position, isPaused: playbackState.paused }));
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [state.isReady]);

  const playTrack = useCallback(
    async (spotifyTrackId: string, positionMs?: number) => {
      if (!state.deviceId || !accessTokenRef.current) return;
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${state.deviceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessTokenRef.current}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: [`spotify:track:${spotifyTrackId}`],
          ...(positionMs !== undefined ? { position_ms: positionMs } : {}),
        }),
      });
    },
    [state.deviceId]
  );

  const togglePlay = useCallback(() => playerRef.current?.togglePlay(), []);
  const seek = useCallback((ms: number) => playerRef.current?.seek(ms), []);

  return { ...state, isAuthenticated: status === "authenticated", playTrack, togglePlay, seek };
}

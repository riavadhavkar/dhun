import type { Language, LyricsResponse, TrackSearchResult } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function searchTracks(query: string): Promise<TrackSearchResult[]> {
  return fetchJson(`/api/search?q=${encodeURIComponent(query)}`);
}

export function getTrack(trackId: string): Promise<TrackSearchResult> {
  return fetchJson(`/api/songs/${trackId}`);
}

export function getLyrics(trackId: string, lang: string): Promise<LyricsResponse> {
  return fetchJson(`/api/songs/${trackId}/lyrics?lang=${encodeURIComponent(lang)}`);
}

export function getLanguages(): Promise<Language[]> {
  return fetchJson(`/api/languages`);
}

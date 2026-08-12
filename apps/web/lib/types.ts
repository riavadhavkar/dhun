export interface TrackSearchResult {
  id: string;
  name: string;
  artist: string;
  album: string;
  album_art: string | null;
  duration_ms: number;
}

export interface LyricLine {
  start_ms: number;
  original: string;
  pronunciation: string;
  translated: string;
}

export interface LyricsResponse {
  track_id: string;
  language: string;
  lines: LyricLine[];
}

export interface Language {
  code: string;
  name: string;
}

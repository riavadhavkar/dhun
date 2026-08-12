export interface TrackSearchResult {
  id: string;
  name: string;
  artist: string;
  album: string;
  album_art: string | null;
  duration_ms: number;
}

export interface OriginalLyricLine {
  start_ms: number;
  text: string;
}

export interface OriginalLyricsResponse {
  track_id: string;
  lines: OriginalLyricLine[];
}

export interface TranslationLine {
  start_ms: number;
  pronunciation: string;
  translation: string;
}

export interface TranslationResponse {
  track_id: string;
  language: string;
  lines: TranslationLine[];
}

// Merged shape LyricsView renders — pronunciation/translated are null until
// the (slower) translation request resolves, so the view can render as soon
// as the original lyrics arrive.
export interface LyricLine {
  start_ms: number;
  original: string;
  pronunciation: string | null;
  translated: string | null;
}

export interface Language {
  code: string;
  name: string;
}

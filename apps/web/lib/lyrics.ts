import type { LyricLine } from "./types";

/**
 * Binary search for the last line whose `start_ms` is <= positionMs.
 * Lines are always returned from the API sorted ascending by start_ms.
 * Returns -1 if playback hasn't reached the first line yet.
 */
export function findActiveLineIndex(lines: LyricLine[], positionMs: number): number {
  let lo = 0;
  let hi = lines.length - 1;
  let result = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].start_ms <= positionMs) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return result;
}

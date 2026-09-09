import { describe, expect, it } from "vitest";

import { findActiveLineIndex } from "./lyrics";
import type { LyricLine } from "./types";

function line(start_ms: number): LyricLine {
  return { start_ms, original: `line at ${start_ms}`, pronunciation: null, translated: null };
}

describe("findActiveLineIndex", () => {
  const lines = [line(0), line(1000), line(2500), line(5000)];

  it("returns -1 before the first line", () => {
    expect(findActiveLineIndex(lines, -100)).toBe(-1);
  });

  it("returns the exact index on an exact match", () => {
    expect(findActiveLineIndex(lines, 2500)).toBe(2);
  });

  it("returns the last line whose start is <= position", () => {
    expect(findActiveLineIndex(lines, 3000)).toBe(2);
  });

  it("returns the last index once past the final line", () => {
    expect(findActiveLineIndex(lines, 999_999)).toBe(3);
  });

  it("returns -1 for an empty line list", () => {
    expect(findActiveLineIndex([], 1000)).toBe(-1);
  });
});

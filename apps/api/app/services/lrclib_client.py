"""LRCLIB client — fetches timestamped ("synced") lyrics.

Free, open, community-sourced, no API key required. `/api/get` does an exact
match on artist/track/album/duration and 404s if nothing matches closely
enough; `/api/search` is fuzzier and returns a ranked list, used as a
fallback when the exact lookup fails (e.g. album name mismatches between
Spotify and LRCLIB, or duration off by a second due to rounding).
"""

import re

import httpx

API_BASE = "https://lrclib.net/api"

_LRC_LINE_RE = re.compile(r"^\[(\d+):(\d+(?:\.\d+)?)\](.*)$")


class NoSyncedLyricsError(Exception):
    pass


def _parse_lrc(synced_lyrics: str) -> list[dict]:
    lines = []
    for raw_line in synced_lyrics.splitlines():
        match = _LRC_LINE_RE.match(raw_line)
        if not match:
            continue

        minutes, seconds, text = match.groups()
        text = text.strip()
        if not text:
            continue

        start_ms = round((int(minutes) * 60 + float(seconds)) * 1000)
        lines.append({"start_ms": start_ms, "text": text})

    lines.sort(key=lambda line: line["start_ms"])
    return lines


class LrclibClient:
    async def get_synced_lyrics(
        self, artist: str, title: str, album: str | None = None, duration_ms: int | None = None
    ) -> list[dict]:
        async with httpx.AsyncClient(timeout=10, headers={"User-Agent": "dhun (github.com/riavadhavkar/dhun)"}) as client:
            synced_lyrics = await self._get_exact(client, artist, title, album, duration_ms)
            if synced_lyrics is None:
                synced_lyrics = await self._search_fallback(client, artist, title)

        if synced_lyrics is None:
            raise NoSyncedLyricsError(f"no synced lyrics found for {artist} - {title}")

        lines = _parse_lrc(synced_lyrics)
        if not lines:
            raise NoSyncedLyricsError(f"empty synced lyrics for {artist} - {title}")

        return lines

    async def _get_exact(
        self,
        client: httpx.AsyncClient,
        artist: str,
        title: str,
        album: str | None,
        duration_ms: int | None,
    ) -> str | None:
        params = {"artist_name": artist, "track_name": title}
        if album:
            params["album_name"] = album
        if duration_ms:
            params["duration"] = round(duration_ms / 1000)

        resp = await client.get(f"{API_BASE}/get", params=params)
        if resp.status_code == 404:
            return None
        resp.raise_for_status()

        return resp.json().get("syncedLyrics") or None

    async def _search_fallback(self, client: httpx.AsyncClient, artist: str, title: str) -> str | None:
        resp = await client.get(f"{API_BASE}/search", params={"artist_name": artist, "track_name": title})
        resp.raise_for_status()
        results = resp.json()

        for result in results:
            synced = result.get("syncedLyrics")
            if synced:
                return synced

        return None


lrclib_client = LrclibClient()

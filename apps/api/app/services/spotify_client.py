"""Spotify client-credentials flow — app-level token for search/metadata only.

User playback (Web Playback SDK) is handled entirely on the frontend via
NextAuth's Spotify OAuth provider and never touches this backend.
"""

import time

import httpx

from app.config import get_settings

TOKEN_URL = "https://accounts.spotify.com/api/token"
API_BASE = "https://api.spotify.com/v1"


class SpotifyClient:
    def __init__(self) -> None:
        self._token: str | None = None
        self._token_expires_at: float = 0.0

    async def _get_token(self, client: httpx.AsyncClient) -> str:
        if self._token and time.monotonic() < self._token_expires_at - 30:
            return self._token

        settings = get_settings()
        resp = await client.post(
            TOKEN_URL,
            data={"grant_type": "client_credentials"},
            auth=(settings.spotify_client_id, settings.spotify_client_secret),
        )
        resp.raise_for_status()
        payload = resp.json()

        self._token = payload["access_token"]
        self._token_expires_at = time.monotonic() + payload["expires_in"]
        return self._token

    async def search_tracks(self, query: str, limit: int = 15) -> list[dict]:
        async with httpx.AsyncClient(timeout=10) as client:
            token = await self._get_token(client)
            resp = await client.get(
                f"{API_BASE}/search",
                params={"q": query, "type": "track", "limit": limit},
                headers={"Authorization": f"Bearer {token}"},
            )
            resp.raise_for_status()
            items = resp.json()["tracks"]["items"]

        return [
            {
                "id": item["id"],
                "name": item["name"],
                "artist": ", ".join(a["name"] for a in item["artists"]),
                "album": item["album"]["name"],
                "album_art": (item["album"]["images"][0]["url"] if item["album"]["images"] else None),
                "duration_ms": item["duration_ms"],
            }
            for item in items
        ]

    async def get_track(self, track_id: str) -> dict:
        async with httpx.AsyncClient(timeout=10) as client:
            token = await self._get_token(client)
            resp = await client.get(
                f"{API_BASE}/tracks/{track_id}",
                headers={"Authorization": f"Bearer {token}"},
            )
            resp.raise_for_status()
            item = resp.json()

        return {
            "id": item["id"],
            "name": item["name"],
            "artist": ", ".join(a["name"] for a in item["artists"]),
            "album": item["album"]["name"],
            "album_art": (item["album"]["images"][0]["url"] if item["album"]["images"] else None),
            "duration_ms": item["duration_ms"],
        }


spotify_client = SpotifyClient()

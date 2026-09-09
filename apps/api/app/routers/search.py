from fastapi import APIRouter, Query, Request

from app.limiter import limiter
from app.schemas import TrackSearchResult
from app.services.spotify_client import spotify_client

router = APIRouter(prefix="/api", tags=["search"])


# Fires on every keystroke from the frontend even with debouncing, and each
# call burns a Spotify API request — keep this tighter than the app default.
@router.get("/search", response_model=list[TrackSearchResult])
@limiter.limit("30/minute")
async def search(request: Request, q: str = Query(min_length=1)) -> list[TrackSearchResult]:
    results = await spotify_client.search_tracks(q)
    return [TrackSearchResult(**r) for r in results]

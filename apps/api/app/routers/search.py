from fastapi import APIRouter, Query

from app.schemas import TrackSearchResult
from app.services.spotify_client import spotify_client

router = APIRouter(prefix="/api", tags=["search"])


@router.get("/search", response_model=list[TrackSearchResult])
async def search(q: str = Query(min_length=1)) -> list[TrackSearchResult]:
    results = await spotify_client.search_tracks(q)
    return [TrackSearchResult(**r) for r in results]

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import search, songs

app = FastAPI(title="dhun api")

app.add_middleware(
    CORSMiddleware,
    # Both origins are allowed since browsers treat localhost and 127.0.0.1 as
    # distinct origins — the app is served from 127.0.0.1 (required for the
    # Spotify redirect URI, which no longer accepts "localhost" as a host),
    # but localhost is kept too for convenience when hitting the API directly.
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router)
app.include_router(songs.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.limiter import limiter
from app.routers import search, songs

settings = get_settings()
settings.validate_required()

app = FastAPI(title="dhun api")

# Per-IP rate limiting on top of the (unauthenticated, low-key-quota) Spotify,
# LRCLIB and Anthropic calls this API fans out to — /search and /translation
# are the expensive ones, so they carry tighter route-level limits below.
app.state.limiter = limiter


def _rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(status_code=429, content={"detail": "too many requests, slow down a little."})


app.add_exception_handler(RateLimitExceeded, _rate_limit_handler)

app.add_middleware(
    CORSMiddleware,
    # Both 127.0.0.1 and localhost dev origins are kept by default — browsers
    # treat them as distinct origins, and 127.0.0.1 is required for the
    # Spotify redirect URI. Override via CORS_ALLOWED_ORIGINS for deploys.
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router)
app.include_router(songs.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

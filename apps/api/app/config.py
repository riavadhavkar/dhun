import sys
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

# Required at boot — the app can't do anything useful without these, and
# failing fast here beats a confusing 500 the first time a request touches
# whichever client actually needed the missing key.
_REQUIRED_KEYS = ("spotify_client_id", "spotify_client_secret", "anthropic_api_key")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://dhun:dhun@localhost:5432/dhun"

    spotify_client_id: str = ""
    spotify_client_secret: str = ""

    anthropic_api_key: str = ""

    # Comma-separated list of allowed frontend origins, e.g.
    # "https://dhun.app,https://www.dhun.app". Defaults to local dev origins
    # so `docker compose up` keeps working with no extra config.
    cors_allowed_origins: str = "http://127.0.0.1:3000,http://localhost:3000"

    @property
    def cors_origins(self) -> list[str]:
        # An empty/unset CORS_ALLOWED_ORIGINS (e.g. a blank line left in
        # .env) should fall back to the local dev origins, not "allow no
        # origins at all".
        origins = [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]
        return origins or ["http://127.0.0.1:3000", "http://localhost:3000"]

    def validate_required(self) -> None:
        missing = [key for key in _REQUIRED_KEYS if not getattr(self, key)]
        if missing:
            sys.exit(
                "dhun api: missing required environment variable(s): "
                + ", ".join(key.upper() for key in missing)
                + " — check your .env file (see .env.example)."
            )


@lru_cache
def get_settings() -> Settings:
    return Settings()

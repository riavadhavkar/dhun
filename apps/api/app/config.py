from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://dhun:dhun@localhost:5432/dhun"

    spotify_client_id: str = ""
    spotify_client_secret: str = ""

    anthropic_api_key: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()

# dhun

Search for a song, play it, and follow along with synced lyrics translated into your preferred language — karaoke for songs in languages you can't read.

## Stack

- **Frontend**: Next.js (App Router) + TypeScript, TanStack Query, NextAuth (Spotify), Spotify Web Playback SDK
- **Backend**: FastAPI + SQLAlchemy + Alembic
- **Database**: PostgreSQL
- **Translation**: Anthropic API (batched per song + target language, cached)
- **Lyrics**: LRCLIB (free, no API key required)
- **Infra**: Docker, Terraform (AWS: ECS/Fargate, RDS)

## Local development

```bash
cp .env.example .env   # fill in API keys
docker compose up --build
```

- Frontend: **http://127.0.0.1:3000** — use this exact host, not `localhost` (see note below)
- Backend: http://localhost:8000/docs

> **Use `127.0.0.1`, not `localhost`, to browse the frontend.** Spotify's
> OAuth no longer accepts `localhost` as a redirect URI hostname — only
> literal loopback addresses like `127.0.0.1`. Your Spotify app's Redirect
> URI must be `http://127.0.0.1:3000/api/auth/callback/spotify`, and
> `NEXTAUTH_URL` in `.env` must match (`http://127.0.0.1:3000`), because
> browsers treat `localhost` and `127.0.0.1` as different origins — visiting
> the wrong one will silently break login/cookies.

On first run, apply database migrations:

```bash
docker compose exec api alembic upgrade head
```

## Structure

```
apps/
  web/    Next.js frontend
  api/    FastAPI backend
infra/
  terraform/   AWS infra (ECS, RDS, ALB)
```

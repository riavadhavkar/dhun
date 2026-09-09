"""Small shared retry/backoff helper for the outbound HTTP clients.

Spotify and LRCLIB are both external services this app has no control over —
a transient 429 (rate limit) or 5xx shouldn't surface as a hard failure to
the user when a short retry would likely succeed.
"""

import asyncio
import random

import httpx

DEFAULT_MAX_ATTEMPTS = 3
DEFAULT_BASE_DELAY_SECONDS = 0.5

# Only these are worth retrying — a 4xx other than 429 means the request
# itself is wrong (bad query, not found, etc.) and retrying won't help.
_RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}


async def request_with_retry(
    client: httpx.AsyncClient,
    method: str,
    url: str,
    *,
    max_attempts: int = DEFAULT_MAX_ATTEMPTS,
    **kwargs,
) -> httpx.Response:
    last_exc: Exception | None = None

    for attempt in range(max_attempts):
        try:
            resp = await client.request(method, url, **kwargs)
        except httpx.TransportError as exc:
            last_exc = exc
        else:
            if resp.status_code not in _RETRYABLE_STATUS_CODES:
                return resp
            last_exc = None

            # Respect Retry-After when the server sends one (Spotify does on 429s).
            retry_after = resp.headers.get("Retry-After")
            if retry_after is not None:
                try:
                    delay = float(retry_after)
                except ValueError:
                    delay = _backoff_delay(attempt)
            else:
                delay = _backoff_delay(attempt)

            if attempt == max_attempts - 1:
                return resp
            await asyncio.sleep(delay)
            continue

        if attempt == max_attempts - 1:
            raise last_exc
        await asyncio.sleep(_backoff_delay(attempt))

    # Unreachable, but keeps type checkers happy.
    if last_exc is not None:
        raise last_exc
    return resp


def _backoff_delay(attempt: int) -> float:
    # Exponential backoff with a little jitter so concurrent requests don't
    # all retry in lockstep.
    return DEFAULT_BASE_DELAY_SECONDS * (2**attempt) + random.uniform(0, 0.25)

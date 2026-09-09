import httpx
import pytest

from app.services.retry import request_with_retry


def _client_with_responses(statuses: list[int]) -> httpx.AsyncClient:
    calls = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        status = statuses[min(calls["n"], len(statuses) - 1)]
        calls["n"] += 1
        return httpx.Response(status, json={"ok": True})

    transport = httpx.MockTransport(handler)
    client = httpx.AsyncClient(transport=transport, base_url="https://example.test")
    client._test_calls = calls  # type: ignore[attr-defined]
    return client


@pytest.mark.asyncio
async def test_returns_immediately_on_success():
    client = _client_with_responses([200])
    resp = await request_with_retry(client, "GET", "/thing", max_attempts=3)
    assert resp.status_code == 200
    assert client._test_calls["n"] == 1  # type: ignore[attr-defined]
    await client.aclose()


@pytest.mark.asyncio
async def test_retries_on_429_then_succeeds():
    client = _client_with_responses([429, 200])
    resp = await request_with_retry(client, "GET", "/thing", max_attempts=3)
    assert resp.status_code == 200
    assert client._test_calls["n"] == 2  # type: ignore[attr-defined]
    await client.aclose()


@pytest.mark.asyncio
async def test_gives_up_after_max_attempts():
    client = _client_with_responses([503, 503, 503])
    resp = await request_with_retry(client, "GET", "/thing", max_attempts=3)
    assert resp.status_code == 503
    assert client._test_calls["n"] == 3  # type: ignore[attr-defined]
    await client.aclose()


@pytest.mark.asyncio
async def test_does_not_retry_plain_4xx():
    client = _client_with_responses([404])
    resp = await request_with_retry(client, "GET", "/thing", max_attempts=3)
    assert resp.status_code == 404
    assert client._test_calls["n"] == 1  # type: ignore[attr-defined]
    await client.aclose()

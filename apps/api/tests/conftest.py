import pytest


@pytest.fixture(autouse=True)
def _no_real_backoff_sleep(monkeypatch):
    """Keep retry tests fast — the retry logic itself is under test, not
    real wall-clock backoff timing."""
    import app.services.retry as retry_module

    async def _instant_sleep(_seconds: float) -> None:
        return None

    monkeypatch.setattr(retry_module.asyncio, "sleep", _instant_sleep)

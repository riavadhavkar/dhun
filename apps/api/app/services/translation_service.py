"""Batched lyric translation via Claude.

Translating the whole song in one call (rather than line-by-line) gives the
model surrounding context, which matters a lot for song lyrics — literal
word-for-word translation often reads badly. The model is instructed to
return a JSON array with exactly one string per input line, in order, so it
can be zipped back against the original timestamps.
"""

import json

import anthropic

from app.config import get_settings

MODEL = "claude-sonnet-4-5"


class TranslationError(Exception):
    """Raised for both API-level failures (auth, billing, rate limits) and
    cases where the model didn't return a usable line-for-line translation."""


SYSTEM_PROMPT = """You translate song lyrics for a karaoke app. You will be given a JSON \
array of lyric lines in their original language. Translate each line into {target_language}, \
preserving the natural meaning and singable feel rather than a stiff literal translation. \
Respond with ONLY a JSON array of strings — no markdown, no commentary — with exactly the \
same number of elements, in the same order, as the input array."""


class TranslationService:
    def __init__(self) -> None:
        self._client: anthropic.Anthropic | None = None

    def _get_client(self) -> anthropic.Anthropic:
        if self._client is None:
            self._client = anthropic.Anthropic(api_key=get_settings().anthropic_api_key)
        return self._client

    def translate_lines(self, lines: list[str], target_language: str) -> list[str]:
        client = self._get_client()

        for attempt in range(2):
            try:
                message = client.messages.create(
                    model=MODEL,
                    max_tokens=4096,
                    system=SYSTEM_PROMPT.format(target_language=target_language),
                    messages=[{"role": "user", "content": json.dumps(lines, ensure_ascii=False)}],
                )
            except anthropic.APIError as exc:
                # Auth/billing/rate-limit failures won't be fixed by retrying —
                # surface immediately with Anthropic's own message.
                raise TranslationError(f"Anthropic API error: {exc}") from exc

            raw = message.content[0].text.strip()

            try:
                translated = json.loads(raw)
            except json.JSONDecodeError:
                continue

            if isinstance(translated, list) and len(translated) == len(lines):
                return [str(line) for line in translated]

        raise TranslationError(f"could not get a {len(lines)}-line translation after retry")


translation_service = TranslationService()

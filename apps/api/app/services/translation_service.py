"""Batched lyric translation + transliteration via Claude.

Processing the whole song in one call (rather than line-by-line) gives the
model surrounding context, which matters a lot for song lyrics — literal
word-for-word translation often reads badly. For each line the model returns
two things: a phonetic transliteration (how the original line sounds,
written in the target language's own script) and a natural-meaning
translation. The model is instructed to return one JSON object per input
line, in order, so results can be zipped back against the original
timestamps.
"""

import json
from dataclasses import dataclass

import anthropic

from app.config import get_settings

MODEL = "claude-sonnet-4-5"
MAX_ATTEMPTS = 3
# Each line now returns two fields (pronunciation + translation) instead of
# one, roughly doubling output size versus a plain translation — 4096 was
# enough for single-field output but truncated mid-JSON on longer songs here.
MAX_OUTPUT_TOKENS = 8192

# Substrings identifying failures that retrying the same request won't fix —
# everything else (rate limits, transient content-filter false positives,
# overload errors) is worth retrying.
NON_RETRYABLE_MARKERS = ("credit balance", "authentication_error", "permission_error")


class TranslationError(Exception):
    """Raised for both API-level failures (auth, billing, rate limits) and
    cases where the model didn't return a usable line-for-line result."""


@dataclass
class TranslatedLine:
    pronunciation: str
    translation: str


SYSTEM_PROMPT = """You process song lyrics for a karaoke app aimed at readers of {target_language}. \
You will be given a JSON array of lyric lines in their original language. For each line, produce \
two things:

1. "pronunciation": a phonetic transliteration approximating how the original line sounds, written \
using {target_language}'s own script and spelling conventions (standard romanization if \
{target_language} is written in Latin letters, or the equivalent phonetic rendering in that \
language's native script otherwise).
2. "translation": a natural translation of the line's meaning into {target_language}, preserving \
the natural meaning and singable feel rather than a stiff literal translation.

Respond with ONLY a JSON array of objects — no markdown, no commentary — with exactly the same \
number of elements, in the same order, as the input array. Each object must have exactly two \
string keys: "pronunciation" and "translation"."""


class TranslationService:
    def __init__(self) -> None:
        self._client: anthropic.Anthropic | None = None

    def _get_client(self) -> anthropic.Anthropic:
        if self._client is None:
            self._client = anthropic.Anthropic(api_key=get_settings().anthropic_api_key)
        return self._client

    def translate_lines(self, lines: list[str], target_language: str) -> list[TranslatedLine]:
        client = self._get_client()
        last_error: str | None = None

        for attempt in range(MAX_ATTEMPTS):
            try:
                message = client.messages.create(
                    model=MODEL,
                    max_tokens=MAX_OUTPUT_TOKENS,
                    system=SYSTEM_PROMPT.format(target_language=target_language),
                    messages=[{"role": "user", "content": json.dumps(lines, ensure_ascii=False)}],
                )
            except anthropic.APIError as exc:
                message_text = str(exc)
                if any(marker in message_text for marker in NON_RETRYABLE_MARKERS):
                    raise TranslationError(f"Anthropic API error: {exc}") from exc
                last_error = f"Anthropic API error: {exc}"
                continue

            raw = message.content[0].text.strip()

            try:
                parsed = json.loads(raw)
            except json.JSONDecodeError:
                # Truncation (hitting max_tokens mid-JSON) is the most common
                # cause here — worth distinguishing from a genuinely malformed
                # response so this is diagnosable from logs alone next time.
                if message.stop_reason == "max_tokens":
                    last_error = f"response truncated at {MAX_OUTPUT_TOKENS} output tokens"
                else:
                    last_error = f"model did not return valid JSON (stop_reason={message.stop_reason})"
                continue

            result = self._extract_lines(parsed, expected_count=len(lines))
            if result is not None:
                return result

            last_error = f"expected {len(lines)} {{pronunciation, translation}} objects, got malformed output"

        raise TranslationError(
            f"could not get a {len(lines)}-line translation after {MAX_ATTEMPTS} attempts: {last_error}"
        )

    @staticmethod
    def _extract_lines(parsed: object, expected_count: int) -> list[TranslatedLine] | None:
        if not isinstance(parsed, list) or len(parsed) != expected_count:
            return None

        result = []
        for item in parsed:
            if not isinstance(item, dict) or "pronunciation" not in item or "translation" not in item:
                return None
            result.append(
                TranslatedLine(
                    pronunciation=str(item["pronunciation"]),
                    translation=str(item["translation"]),
                )
            )
        return result


translation_service = TranslationService()

from app.services.lrclib_client import _parse_lrc


def test_parse_lrc_basic():
    raw = "[00:01.00]first line\n[00:05.50]second line"
    lines = _parse_lrc(raw)
    assert lines == [
        {"start_ms": 1000, "text": "first line"},
        {"start_ms": 5500, "text": "second line"},
    ]


def test_parse_lrc_sorts_out_of_order_lines():
    raw = "[00:10.00]later\n[00:02.00]earlier"
    lines = _parse_lrc(raw)
    assert [line["text"] for line in lines] == ["earlier", "later"]


def test_parse_lrc_skips_blank_lines():
    raw = "[00:01.00]  \n[00:02.00]real line"
    lines = _parse_lrc(raw)
    assert len(lines) == 1
    assert lines[0]["text"] == "real line"


def test_parse_lrc_ignores_non_timestamp_lines():
    raw = "[ar:Some Artist]\n[00:01.00]actual lyric"
    lines = _parse_lrc(raw)
    assert len(lines) == 1
    assert lines[0]["text"] == "actual lyric"


def test_parse_lrc_handles_minutes_over_59():
    # LRC timestamps aren't clamped to a 60-minute clock face — a long
    # instrumental/ambient track can legitimately have an [MM:SS] past 59:xx.
    raw = "[75:00.00]late line"
    lines = _parse_lrc(raw)
    assert lines[0]["start_ms"] == 75 * 60 * 1000

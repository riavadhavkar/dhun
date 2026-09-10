from app.services.translation_service import TranslationService, _strip_code_fence


def test_strip_code_fence_removes_json_fence():
    raw = '```json\n[{"a": 1}]\n```'
    assert _strip_code_fence(raw) == '[{"a": 1}]'


def test_strip_code_fence_removes_bare_fence():
    raw = "```\n[1, 2, 3]\n```"
    assert _strip_code_fence(raw) == "[1, 2, 3]"


def test_strip_code_fence_leaves_unfenced_text_alone():
    raw = '[{"a": 1}]'
    assert _strip_code_fence(raw) == raw


def test_extract_lines_happy_path():
    parsed = [
        {"pronunciation": "annyeong", "translation": "hello"},
        {"pronunciation": "saranghae", "translation": "i love you"},
    ]
    result = TranslationService._extract_lines(parsed, expected_count=2)
    assert result is not None
    assert [line.pronunciation for line in result] == ["annyeong", "saranghae"]
    assert [line.translation for line in result] == ["hello", "i love you"]


def test_extract_lines_rejects_wrong_length():
    parsed = [{"pronunciation": "a", "translation": "b"}]
    assert TranslationService._extract_lines(parsed, expected_count=2) is None


def test_extract_lines_rejects_missing_keys():
    parsed = [{"pronunciation": "a"}]
    assert TranslationService._extract_lines(parsed, expected_count=1) is None


def test_extract_lines_rejects_non_list():
    assert TranslationService._extract_lines({"not": "a list"}, expected_count=1) is None


def test_extract_lines_coerces_non_string_values():
    # The model occasionally returns a bare number/bool for a field instead
    # of a string — should be coerced rather than treated as malformed.
    parsed = [{"pronunciation": 123, "translation": True}]
    result = TranslationService._extract_lines(parsed, expected_count=1)
    assert result is not None
    assert result[0].pronunciation == "123"
    assert result[0].translation == "True"

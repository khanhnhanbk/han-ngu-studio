import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from api._core import tokenizer as core_tokenizer  # noqa: E402
from api.index import app  # noqa: E402

client = TestClient(app)


def test_basic_segmentation():
    resp = client.post("/api/py/segment", json={"text": "我喜欢学习中文。"})
    assert resp.status_code == 200
    assert resp.json()["segmented"] == "我 喜欢 学习 中文。"


def test_mixed_text_keeps_latin_and_digits():
    resp = client.post("/api/py/segment", json={"text": "我在2024年学Python。"})
    assert resp.status_code == 200
    segmented = resp.json()["segmented"]
    assert "2024" in segmented
    assert "Python" in segmented


def test_multiline_preserves_line_breaks():
    resp = client.post("/api/py/segment", json={"text": "我喜欢学习。\n你好世界。"})
    assert resp.status_code == 200
    assert "\n" in resp.json()["segmented"]


def test_no_space_around_fullwidth_punctuation():
    resp = client.post("/api/py/segment", json={"text": "今天天气很好，我们去公园吧。"})
    assert resp.status_code == 200
    assert resp.json()["segmented"] == "今天 天气 很 好，我们 去 公园 吧。"


def test_empty_input_returns_422():
    resp = client.post("/api/py/segment", json={"text": ""})
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "invalid_input"


def test_index_imports_as_top_level_module():
    # Vercel loads api/index.py outside of a package.
    import importlib.util

    api_dir = Path(__file__).resolve().parent.parent
    sys.path.insert(0, str(api_dir))
    spec = importlib.util.spec_from_file_location("index", api_dir / "index.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    assert module.app is not None


def test_too_long_input_returns_422():
    resp = client.post("/api/py/segment", json={"text": "我" * 5001})
    assert resp.status_code == 422


def test_parity_with_root_tokenizer():
    root = Path(__file__).resolve().parent.parent.parent.parent
    sys.path.insert(0, str(root))
    from tokenizer_sentence import ViterbiChineseTokenizer  # noqa: E402

    vocab = root / "achieve" / "word_list_full.txt"
    if not vocab.exists():
        pytest.skip("root vocab not available")

    reference = ViterbiChineseTokenizer(vocab_file_path=str(vocab))
    text = "我喜欢学习中文"
    assert core_tokenizer.get_tokenizer().tokenize(text) == reference.tokenize(text)

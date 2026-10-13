"""Chinese word segmentation for the Vercel Python Function.

The Viterbi algorithm is copied unchanged from the repository root
``tokenizer_sentence.py``. The helpers below add pre-splitting so that
Latin words, digits and punctuation are not broken apart by the DAG.
"""

import math
import re
from functools import lru_cache
from pathlib import Path

# Han characters (CJK Unified Ideographs + Extension A).
HAN_RE = re.compile(r"[\u4e00-\u9fff\u3400-\u4dbf]+")
# Latin letters and digits stay together as a single token.
LATIN_RE = re.compile(r"[A-Za-z0-9]+")

# Punctuation that must not be preceded by a space.
NO_SPACE_BEFORE = set("，。！？；：、）》」』”…,.!?;:)")
# Punctuation that must not be followed by a space (full-width punctuation
# already carries its own spacing).
NO_SPACE_AFTER = set("（《「『“(，。！？；：、）》」』”…")

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "word_list.txt"


class ViterbiChineseTokenizer:
    def __init__(self, vocab_file_path):
        self.word_cost = {}

        # Đọc file theo thứ tự để lấy vị trí (hạng) làm trọng số
        with open(vocab_file_path, "r", encoding="utf-8") as f:
            for idx, line in enumerate(f):
                word = line.strip()
                if word:
                    rank = idx + 1
                    length_bonus = 2.5 * (len(word) - 1)
                    self.word_cost[word] = math.log(rank) - length_bonus

        # Tổng số từ để làm mốc tính toán cho từ không có trong từ điển (OOV)
        self.total_words = len(self.word_cost)
        # Lập mức phạt rất nặng cho từ đơn không tồn tại độc lập trong từ điển
        self.oov_cost = math.log(self.total_words + 1)

    def _get_dag(self, text):
        DAG = {}
        N = len(text)
        for k in range(N):
            tmplist = []
            i = k
            frag = text[k]
            while i < N:
                # Nếu từ có trong từ điển HOẶC là ký tự đơn đơn lẻ thì đều đưa vào đồ thị
                if frag in self.word_cost or len(frag) == 1:
                    tmplist.append(i)
                i += 1
                if i < N:
                    frag = text[k : i + 1]
            DAG[k] = tmplist
        return DAG

    def tokenize(self, text):
        if not text:
            return []

        N = len(text)
        DAG = self._get_dag(text)

        # route[i] = (tổng_chi_phí_thấp_nhất, vị_trí_kết_thúc_của_từ)
        route = {N: (0, 0)}

        # Chạy thuật toán Quy hoạch động Viterbi ngược từ cuối câu lên đầu câu
        for idx in range(N - 1, -1, -1):
            candidates = []
            for x in DAG[idx]:
                word = text[idx : x + 1]
                # Tính chi phí của từ hiện tại
                if word in self.word_cost:
                    cost = self.word_cost[word]
                else:
                    cost = self.oov_cost  # Phạt nặng nếu bẻ gãy từ đơn sai quy cách

                # Tổng chi phí = chi phí từ hiện tại + chi phí tốt nhất của đoạn phía sau
                total_cost = cost + route[x + 1][0]
                candidates.append((total_cost, x))

            # Chọn từ có TỔNG CHI PHÍ THẤP NHẤT cho đoạn text từ vị trí idx đến hết câu
            route[idx] = min(candidates, key=lambda c: c[0])

        # Lấy kết quả chuỗi tối ưu từ bảng route
        result = []
        x = 0
        while x < N:
            y = route[x][1] + 1
            result.append(text[x:y])
            x = y

        return result


@lru_cache(maxsize=1)
def get_tokenizer() -> ViterbiChineseTokenizer:
    """Load the tokenizer once per process."""
    return ViterbiChineseTokenizer(vocab_file_path=str(DATA_PATH))


def _split_runs(line: str):
    """Split a line into (kind, text) runs: han / latin / other."""
    runs = []
    i = 0
    n = len(line)
    while i < n:
        ch = line[i]
        if HAN_RE.match(ch):
            j = i
            while j < n and HAN_RE.match(line[j]):
                j += 1
            runs.append(("han", line[i:j]))
            i = j
        elif LATIN_RE.match(ch):
            j = i
            while j < n and LATIN_RE.match(line[j]):
                j += 1
            runs.append(("latin", line[i:j]))
            i = j
        else:
            runs.append(("other", ch))
            i += 1
    return runs


def segment(text: str) -> list[list[str]]:
    """Return tokens per line."""
    tokenizer = get_tokenizer()
    lines = text.split("\n")
    result: list[list[str]] = []
    for line in lines:
        tokens: list[str] = []
        for kind, chunk in _split_runs(line):
            if kind == "han":
                tokens.extend(tokenizer.tokenize(chunk))
            elif kind == "latin":
                tokens.append(chunk)
            else:
                if chunk.strip():
                    tokens.append(chunk)
        result.append(tokens)
    return result


def join_tokens(tokens: list[str]) -> str:
    """Join tokens with spaces, respecting CJK/ASCII punctuation rules."""
    out = ""
    for token in tokens:
        if not out:
            out = token
            continue
        if token and token[0] in NO_SPACE_BEFORE:
            out += token
        elif out[-1] in NO_SPACE_AFTER:
            out += token
        else:
            out += " " + token
    return out

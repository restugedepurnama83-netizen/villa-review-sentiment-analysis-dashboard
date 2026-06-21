import os
import re

import nltk
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory

_LOCAL_NLTK_DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "nltk_data")
if _LOCAL_NLTK_DATA not in nltk.data.path:
    nltk.data.path.insert(0, _LOCAL_NLTK_DATA)

try:
    nltk.data.find("corpora/stopwords")
except LookupError:
    nltk.download("stopwords")

from nltk.corpus import stopwords

# --- Tahap 1: Cleaning dasar ---
def clean_text(text: str) -> str:
    text = str(text)
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\d+", "", text)
    text = re.sub(r"[^\x00-\x7F]+", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


# Tahap 2: Case folding
def case_folding(text: str) -> str:
    return text.lower()


# Tahap 3: Normalisasi slang
SLANG_DICT = {
    "gak": "tidak", "ga": "tidak", "nggak": "tidak",
    "ngga": "tidak", "enggak": "tidak", "tdk": "tidak",
    "yg": "yang", "dgn": "dengan", "utk": "untuk",
    "hrs": "harus", "sdh": "sudah", "blm": "belum",
    "krn": "karena", "jd": "jadi", "sm": "sama",
    "tp": "tapi", "tapi": "tetapi", "jg": "juga",
    "bgt": "banget", "bngt": "banget", "bgs": "bagus",
    "ok": "oke", "mantap": "mantap", "keren": "keren",
    "jelek": "jelek", "brsih": "bersih", "nyaman": "nyaman",
    # Kata bahasa Inggris bermakna sentimen
    "good": "bagus", "bad": "buruk",
    "best": "terbaik", "nice": "bagus",
    "friendly": "ramah", "great": "bagus",
    "clean": "bersih", "slow": "lambat",
    "excellent": "luar biasa", "fast": "cepat",
    "dirty": "kotor", "worst": "terburuk",
    "comfortable": "nyaman", "poor": "buruk",
    "noisy": "berisik", "expensive": "mahal",
}

# Kata bahasa Inggris umum yang tidak bermakna sentimen -> masuk stopwords
STOPWORDS_TAMBAHAN = {"hotel", "room", "staff", "service"}


def normalize_slang(text: str, slang_dict: dict = SLANG_DICT) -> str:
    """Mengganti kata tidak baku dengan kata baku."""
    words = text.split()
    return " ".join(slang_dict.get(w, w) for w in words)


# Tahap 4: Stopword removal (dengan exception kata penting)
KATA_PENTING = {
    # Kata negasi
    "tidak", "kurang", "bukan", "belum", "jangan", "tanpa",
    # Kata negatif kontekstual
    "susah", "sulit", "jauh", "rusak", "sempit", "buruk",
    "jelek", "kotor", "lambat", "lama", "mahal", "kecewa",
    "mengecewakan", "parah", "hancur", "busuk",
}

_STOPWORDS_ID = set(stopwords.words("indonesian")) | STOPWORDS_TAMBAHAN
STOPWORDS_ID = _STOPWORDS_ID - KATA_PENTING  # lindungi kata penting dari penghapusan


def remove_stopwords(text: str, stopwords_set: set = STOPWORDS_ID) -> str:
    words = text.split()
    return " ".join(w for w in words if w not in stopwords_set)


# Tahap 5: Penanganan negasi (bigram)
NEGATION_WORDS = {
    "tidak", "kurang", "bukan", "belum", "jangan", "tanpa",
    "susah", "sulit", "jauh",
}


def handle_negation(text: str) -> str:
    words = text.split()
    result = []
    i = 0
    while i < len(words):
        if words[i] in NEGATION_WORDS and i + 1 < len(words):
            result.append(f"{words[i]}_{words[i + 1]}")
            i += 2
        else:
            result.append(words[i])
            i += 1
    return " ".join(result)


# Tahap 6: Stemming (Sastrawi)
_factory = StemmerFactory()
_stemmer = _factory.create_stemmer()


def stem_text(text: str) -> str:
    words = text.split()
    stemmed = []
    for w in words:
        if "_" in w:
            stemmed.append(w)
        else:
            stemmed.append(_stemmer.stem(w))
    return " ".join(stemmed)


# --- Pipeline lengkap, urutan HARUS sama dengan training ---
def preprocess(text: str) -> str:
    text = clean_text(text)
    text = case_folding(text)
    text = normalize_slang(text)
    text = remove_stopwords(text)
    text = handle_negation(text)
    text = stem_text(text)
    return text


def cek_oov_ratio(cleaned_text: str, tokenizer) -> float:
    tokens = cleaned_text.split()
    if len(tokens) == 0:
        return 1.0  # teks kosong setelah cleaning: anggap full OOV

    oov_count = 0
    for tok in tokens:
        if tok in tokenizer.word_index:
            continue  # token (termasuk bigram utuh) dikenali: bukan OOV

        if "_" in tok:
            # Token bigram tidak dikenali utuh -> cek kata pecahannya
            bagian = tok.split("_")
            if any(b in tokenizer.word_index for b in bagian):
                continue  # minimal satu kata pecahan dikenali: bukan OOV

        oov_count += 1

    return oov_count / len(tokens)

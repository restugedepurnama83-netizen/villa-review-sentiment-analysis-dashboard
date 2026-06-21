import config

def detect_aspek(text: str) -> list[str]:
    text_lower = text.lower()
    found = [
        aspek
        for aspek, keywords in config.ASPEK_KEYWORDS.items()
        if any(kw in text_lower for kw in keywords)
    ]
    return found if found else ["lainnya"]


def generate_alasan(sentimen: str, skor: int, aspek: list[str], oov_ratio: float = 0.0) -> str:
    aspek_str = ", ".join(aspek)
    confidence = "tinggi" if skor >= 75 else "sedang" if skor >= 50 else "rendah"
    catatan_oov = f" (OOV ratio: {oov_ratio:.0%})" if oov_ratio > 0 else ""
    return (
        f"Model mengklasifikasikan ulasan ini sebagai {sentimen} "
        f"dengan kepercayaan {confidence} ({skor}%). "
        f"Aspek yang terdeteksi: {aspek_str}.{catatan_oov}"
    )

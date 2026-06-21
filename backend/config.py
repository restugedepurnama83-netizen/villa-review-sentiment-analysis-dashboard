# Path model & tokenizer
MODEL_PATH = "./model/lstm_sentiment_model[1].keras"
TOKENIZER_PATH = "./model/tokenizer.pkl"

# Parameter model (harus sama dengan saat training)
MAX_LEN = 100
LABELS = ["NEGATIF", "POSITIF"]

# Parameter validasi input
OOV_THRESHOLD = 0.8   # jika >= 80% kata tidak dikenali tokenizer: input ditolak

# Aspek keyword-based
ASPEK_KEYWORDS = {
    "kebersihan": ["bersih", "kotor", "jorok", "rapi", "debu", "sanitasi"],
    "fasilitas": ["fasilitas", "kolam", "wifi", "ac", "tv", "dapur", "kamar"],
    "pelayanan": ["pelayanan", "staff", "ramah", "cepat", "lambat", "respon", "host"],
    "lokasi": ["lokasi", "tempat", "akses", "jalan", "dekat", "jauh", "strategis"],
    "harga": ["harga", "murah", "mahal", "worth", "sebanding", "tarif", "bayar"],
    "suasana": ["suasana", "tenang", "nyaman", "sejuk", "asri", "pemandangan", "view"],
}

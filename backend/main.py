from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import pickle
import re
import tensorflow
from tensorflow.keras.saving import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences

# Konfigurasi sama dengan pada tradining model
MODEL_PATH     = "./lstm_sentiment_model.keras"
TOKENIZER_PATH = "./tokenizer.pkl"
MAX_LEN        = 100
LABELS         = ["NEGATIF", "POSITIF"]

app = FastAPI(title="Villa Sentiment API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model & tokenizer saat startup
print("🔄 Loading model dan tokenizer...")
try:
    model = load_model(MODEL_PATH)
    print(f"✅ Model loaded: {MODEL_PATH}")
except Exception as e:
    raise RuntimeError(f"Gagal load model: {e}")

try:
    with open(TOKENIZER_PATH, "rb") as f:
        tokenizer = pickle.load(f)
    print(f"✅ Tokenizer loaded: {TOKENIZER_PATH}")
except Exception as e:
    raise RuntimeError(f"Gagal load tokenizer: {e}")


# Schema request & response
class ReviewRequest(BaseModel):
    review: str

class SentimentResponse(BaseModel):
    sentimen: str
    skor: int
    aspek: list[str]
    alasan: str

class BatchReviewRequest(BaseModel):
    reviews: list[str]

class BatchSentimentResponse(BaseModel):
    results: list[SentimentResponse]


# Preprocessing
def preprocess(text: str) -> str:
    text = str(text)
    text = re.sub(r'http\S+|www\S+', '', text)
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\d+', '', text)
    text = re.sub(r'[^\x00-\x7F]+', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


# Deteksi aspek keyword-based
ASPEK_KEYWORDS = {
    "kebersihan": ["bersih", "kotor", "jorok", "rapi", "debu", "sanitasi"],
    "fasilitas" : ["fasilitas", "kolam", "wifi", "ac", "tv", "dapur", "kamar"],
    "pelayanan" : ["pelayanan", "staff", "ramah", "cepat", "lambat", "respon", "host"],
    "lokasi"    : ["lokasi", "tempat", "akses", "jalan", "dekat", "jauh", "strategis"],
    "harga"     : ["harga", "murah", "mahal", "worth", "sebanding", "tarif", "bayar"],
    "suasana"   : ["suasana", "tenang", "nyaman", "sejuk", "asri", "pemandangan", "view"],
}

def detect_aspek(text: str) -> list[str]:
    text_lower = text.lower()
    found = [aspek for aspek, keywords in ASPEK_KEYWORDS.items()
             if any(kw in text_lower for kw in keywords)]
    return found if found else ["lainnya"]


# Generate alasan
def generate_alasan(sentimen: str, skor: int, aspek: list[str]) -> str:
    aspek_str  = ", ".join(aspek)
    confidence = "tinggi" if skor >= 75 else "sedang" if skor >= 50 else "rendah"
    return (
        f"Model mengklasifikasikan ulasan ini sebagai {sentimen} "
        f"dengan kepercayaan {confidence} ({skor}%). "
        f"Aspek yang terdeteksi: {aspek_str}."
    )


# Endpoint prediksi
@app.post("/predict", response_model=SentimentResponse)
async def predict(request: ReviewRequest):
    if not request.review.strip():
        raise HTTPException(status_code=400, detail="Field 'review' tidak boleh kosong")

    try:
        cleaned  = preprocess(request.review)
        sequence = tokenizer.texts_to_sequences([cleaned])
        padded   = pad_sequences(sequence, maxlen=MAX_LEN, padding="post", truncating="post")

        prediction = model.predict(padded, verbose=0)

        # Sigmoid (1 neuron) vs Softmax (2 neuron)
        if prediction.shape[1] == 1:
            score_raw = float(prediction[0][0])
            class_idx = 1 if score_raw >= 0.5 else 0
            skor      = int(round(score_raw * 100)) if class_idx == 1 else int(round((1 - score_raw) * 100))
        else:
            class_idx = int(np.argmax(prediction[0]))
            skor      = int(round(float(np.max(prediction[0])) * 100))

        sentimen = LABELS[class_idx]
        aspek    = detect_aspek(request.review)
        alasan   = generate_alasan(sentimen, skor, aspek)

        return SentimentResponse(sentimen=sentimen, skor=skor, aspek=aspek, alasan=alasan)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memproses ulasan: {str(e)}")


# Endpoint prediksi batch
@app.post("/predict-batch", response_model=BatchSentimentResponse)
async def predict_batch(request: BatchReviewRequest):
    if not request.reviews:
        raise HTTPException(status_code=400, detail="Field 'reviews' tidak boleh kosong")

    try:
        original_texts = [r for r in request.reviews if r.strip()]
        if not original_texts:
            raise HTTPException(status_code=400, detail="Semua ulasan kosong")

        # Preprocess & tokenize semua ulasan sekaligus
        cleaned   = [preprocess(text) for text in original_texts]
        sequences = tokenizer.texts_to_sequences(cleaned)
        padded    = pad_sequences(sequences, maxlen=MAX_LEN, padding="post", truncating="post")

        # Prediksi batch dalam 1 kali inference
        predictions = model.predict(padded, verbose=0)

        results = []
        for i, text in enumerate(original_texts):
            if predictions.shape[1] == 1:
                score_raw = float(predictions[i][0])
                class_idx = 1 if score_raw >= 0.5 else 0
                skor      = int(round(score_raw * 100)) if class_idx == 1 else int(round((1 - score_raw) * 100))
            else:
                class_idx = int(np.argmax(predictions[i]))
                skor      = int(round(float(np.max(predictions[i])) * 100))

            sentimen = LABELS[class_idx]
            aspek    = detect_aspek(text)
            alasan   = generate_alasan(sentimen, skor, aspek)
            results.append(SentimentResponse(sentimen=sentimen, skor=skor, aspek=aspek, alasan=alasan))

        return BatchSentimentResponse(results=results)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memproses batch: {str(e)}")


# Health check
@app.get("/")
async def root():
    return {"status": "ok", "message": "Villa Sentiment API berjalan ✅"}

# Run server ------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
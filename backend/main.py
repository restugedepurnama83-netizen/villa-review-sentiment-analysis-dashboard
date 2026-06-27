import hashlib

import config
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from inference import (
    load_model_and_tokenizer,
    predict_sentiment,
    predict_sentiment_batch,
)
from schemas import (
    BatchReviewRequest,
    BatchSentimentResponse,
    ReviewRequest,
    SentimentResponse,
)

app = FastAPI(title="Villa Sentiment API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model & tokenizer sekali saat startup
model, tokenizer = load_model_and_tokenizer()


@app.get("/debug-tokenizer")
async def debug_tokenizer():
    test_word = "afsdfasdfasdfasdf"

    # Hash file tokenizer.pkl yang AKTUAL di-load di production
    with open(config.TOKENIZER_PATH, "rb") as f:
        file_bytes = f.read()
    file_hash = hashlib.md5(file_bytes).hexdigest()
    file_size = len(file_bytes)

    # Import preprocess & cek_oov_ratio dari preprocessing.py yang AKTUAL berjalan
    from preprocessing import cek_oov_ratio, preprocess

    cleaned = preprocess(test_word)
    tokens = cleaned.split()
    oov_ratio = cek_oov_ratio(cleaned, tokenizer)

    return {
        "tokenizer_path": config.TOKENIZER_PATH,
        "tokenizer_file_md5": file_hash,
        "tokenizer_file_size_bytes": file_size,
        "total_word_index": len(tokenizer.word_index),
        "num_words_setting": getattr(tokenizer, "num_words", None),
        "oov_token": getattr(tokenizer, "oov_token", None),
        "oov_threshold_config": config.OOV_THRESHOLD,
        "test_input": test_word,
        "cleaned_after_preprocess": cleaned,
        "tokens": tokens,
        "tokens_in_vocab": {tok: (tok in tokenizer.word_index) for tok in tokens},
        "computed_oov_ratio": oov_ratio,
        "should_be_rejected": oov_ratio >= config.OOV_THRESHOLD,
    }


# Endpoint prediksi
@app.post("/predict", response_model=SentimentResponse)
async def predict(request: ReviewRequest):
    if not request.review.strip():
        raise HTTPException(status_code=400, detail="Field 'review' tidak boleh kosong")

    try:
        hasil = predict_sentiment(request.review, model, tokenizer)
        return SentimentResponse(**hasil)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memproses ulasan: {str(e)}")


# Endpoint prediksi batch
@app.post("/predict-batch", response_model=BatchSentimentResponse)
async def predict_batch(request: BatchReviewRequest):
    if not request.reviews:
        raise HTTPException(
            status_code=400, detail="Field 'reviews' tidak boleh kosong"
        )

    try:
        original_texts = [r for r in request.reviews if r.strip()]
        if not original_texts:
            raise HTTPException(status_code=400, detail="Semua ulasan kosong")

        hasil_list = predict_sentiment_batch(original_texts, model, tokenizer)
        results = [SentimentResponse(**hasil) for hasil in hasil_list]

        return BatchSentimentResponse(results=results)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memproses batch: {str(e)}")


# Health check
@app.get("/")
async def root():
    return {"status": "ok", "message": "Villa Sentiment API berjalan ✅"}


# Run server
if __name__ == "__main__":
    import os

    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)

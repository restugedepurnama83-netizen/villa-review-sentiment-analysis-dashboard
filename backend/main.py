from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from inference import load_model_and_tokenizer, predict_sentiment, predict_sentiment_batch
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
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)

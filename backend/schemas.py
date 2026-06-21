from pydantic import BaseModel

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

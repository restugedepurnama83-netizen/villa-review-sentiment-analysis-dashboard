import { AnalysisResult } from "./types";

const API_BASE = "https://villa-sentiment-analyzer-production.up.railway.app";

export async function analyzeSentiment(
  review: string,
): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ review }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || data.error || "Gagal menganalisis ulasan");
  }

  return data as AnalysisResult;
}

export async function analyzeSentimentBatch(
  reviews: string[],
): Promise<AnalysisResult[]> {
  const res = await fetch(`${API_BASE}/predict-batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reviews }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || data.error || "Gagal menganalisis batch");
  }

  return data.results as AnalysisResult[];
}

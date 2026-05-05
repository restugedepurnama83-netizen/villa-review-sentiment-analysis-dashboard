import { AnalysisResult } from "./types";

// const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
// const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export async function analyzeSentiment(
  review: string,
): Promise<AnalysisResult> {
  // const res = await fetch(`${SUPABASE_URL}/functions/v1/analyze-sentiment`, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  //     Apikey: SUPABASE_ANON_KEY,
  //   },
  //   body: JSON.stringify({ review }),
  // });
  //
  const res = await fetch(`http://localhost:5000/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ review }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Gagal menganalisis ulasan");
  }

  return data as AnalysisResult;
}

export type Sentiment = "POSITIF" | "NEGATIF" | "NETRAL";

export type Aspect = "kebersihan" | "fasilitas" | "pelayanan" | "lokasi" | "harga" | "suasana" | "lainnya";

export interface AnalysisResult {
  sentimen: Sentiment;
  skor: number;
  aspek: Aspect[];
  alasan: string;
}

export interface ReviewRow {
  id: number;
  ulasan: string;
  tanggal?: string;
  result?: AnalysisResult;
  error?: string;
}

export interface DashboardStats {
  total: number;
  positif: number;
  negatif: number;
  netral: number;
  positifPct: number;
  negatifPct: number;
  netralPct: number;
}

export interface AspectSentimentData {
  aspect: string;
  positif: number;
  negatif: number;
  netral: number;
}

export interface TrendData {
  date: string;
  positif: number;
  negatif: number;
  netral: number;
}

export interface KeywordData {
  word: string;
  count: number;
  sentiment: "positif" | "negatif";
}

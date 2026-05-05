import { useState } from "react";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { analyzeSentiment } from "../api";
import { AnalysisResult } from "../types";
import { SentimentBadge } from "./SentimentBadge";

interface Props {
  onResult: (review: string, result: AnalysisResult) => void;
  onError: (msg: string) => void;
}

const aspectLabels: Record<string, string> = {
  kebersihan: "Kebersihan",
  fasilitas: "Fasilitas",
  pelayanan: "Pelayanan",
  lokasi: "Lokasi",
  harga: "Harga",
  suasana: "Suasana",
  lainnya: "Lainnya",
};

const aspectColors: Record<string, string> = {
  kebersihan: "bg-cyan-100 text-cyan-700 border-cyan-200",
  fasilitas: "bg-blue-100 text-blue-700 border-blue-200",
  pelayanan: "bg-orange-100 text-orange-700 border-orange-200",
  lokasi: "bg-violet-100 text-violet-700 border-violet-200",
  harga: "bg-pink-100 text-pink-700 border-pink-200",
  suasana: "bg-teal-100 text-teal-700 border-teal-200",
  lainnya: "bg-gray-100 text-gray-600 border-gray-200",
};

export function ManualAnalysis({ onResult, onError }: Props) {
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analyzedReview, setAnalyzedReview] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!review.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyzeSentiment(review.trim());
      setResult(res);
      setAnalyzedReview(review.trim());
      onResult(review.trim(), res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Terjadi kesalahan";
      setError(msg);
      onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const scoreColor =
    result?.sentimen === "POSITIF"
      ? "text-emerald-600"
      : result?.sentimen === "NEGATIF"
      ? "text-red-500"
      : "text-amber-500";

  const scoreBarColor =
    result?.sentimen === "POSITIF"
      ? "bg-emerald-500"
      : result?.sentimen === "NEGATIF"
      ? "bg-red-500"
      : "bg-amber-400";

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Masukkan Ulasan Villa
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Ketik atau tempel ulasan pengunjung villa di sini... (Bahasa Indonesia)"
          rows={6}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent resize-none transition placeholder-gray-400"
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-400">{review.length} karakter</span>
        </div>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={!review.trim() || loading}
        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Search className="w-5 h-5" />
        )}
        {loading ? "Menganalisis..." : "Analisis Sentimen"}
      </button>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {result && !error && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div
            className={`px-6 py-4 border-b ${
              result.sentimen === "POSITIF"
                ? "bg-emerald-50 border-emerald-100"
                : result.sentimen === "NEGATIF"
                ? "bg-red-50 border-red-100"
                : "bg-amber-50 border-amber-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-base">Hasil Analisis</h3>
              <SentimentBadge sentiment={result.sentimen} size="lg" />
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600 italic border border-gray-100">
              "{analyzedReview}"
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Skor Kepercayaan
                </span>
                <span className={`text-2xl font-bold ${scoreColor}`}>{result.skor}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${scoreBarColor}`}
                  style={{ width: `${result.skor}%` }}
                />
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                Aspek yang Terdeteksi
              </span>
              <div className="flex flex-wrap gap-2">
                {result.aspek.length > 0 ? (
                  result.aspek.map((a) => (
                    <span
                      key={a}
                      className={`text-xs px-3 py-1 rounded-lg border font-medium ${
                        aspectColors[a] ?? "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {aspectLabels[a] ?? a}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">Tidak ada aspek spesifik terdeteksi</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                Alasan Klasifikasi
              </span>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                {result.alasan}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

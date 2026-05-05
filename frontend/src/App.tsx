import { useState, useCallback } from "react";
import {
  Search,
  Upload,
  BarChart2,
  Home,
  Leaf,
} from "lucide-react";
import { ManualAnalysis } from "./components/ManualAnalysis";
import { BatchUpload } from "./components/BatchUpload";
import { Dashboard } from "./components/Dashboard";
import { Toast, ToastMessage } from "./components/Toast";
import { ReviewRow, AnalysisResult } from "./types";

type Tab = "manual" | "batch" | "dashboard";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "manual", label: "Analisis Manual", icon: <Search className="w-4 h-4" /> },
  { id: "batch", label: "Upload CSV", icon: <Upload className="w-4 h-4" /> },
  { id: "dashboard", label: "Dashboard", icon: <BarChart2 className="w-4 h-4" /> },
];

let toastCounter = 0;

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("manual");
  const [allRows, setAllRows] = useState<ReviewRow[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: "success" | "error", message: string) => {
    const id = String(++toastCounter);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleManualResult = useCallback((_review: string, result: AnalysisResult) => {
    const row: ReviewRow = {
      id: Date.now(),
      ulasan: _review,
      result,
    };
    setAllRows((prev) => [row, ...prev]);
    addToast("success", `Analisis selesai: ${result.sentimen} (${result.skor}%)`);
  }, [addToast]);

  const handleBatchComplete = useCallback((rows: ReviewRow[]) => {
    setAllRows((prev) => {
      const existingTexts = new Set(prev.map((r) => r.ulasan));
      const newRows = rows.filter((r) => !existingTexts.has(r.ulasan));
      return [...newRows, ...prev];
    });
  }, []);

  const analyzedCount = allRows.filter((r) => r.result).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header / Hero */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="py-6 sm:py-8 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-md">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                  Villa Sentiment Analyzer
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Sistem Analisis Sentimen Ulasan Pengunjung Villa
                </p>
              </div>
            </div>
            <div className="sm:ml-auto flex items-center gap-2">
              {analyzedCount > 0 && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-200">
                  {analyzedCount} ulasan dianalisis
                </span>
              )}
              <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-emerald-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-emerald-50">
                <Home className="w-3.5 h-3.5" />
                Beranda
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 pb-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-t-xl transition-all duration-200 border-b-2 ${
                  activeTab === tab.id
                    ? "text-emerald-700 border-emerald-600 bg-emerald-50"
                    : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-200"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">
                  {tab.id === "manual" ? "Manual" : tab.id === "batch" ? "CSV" : "Dashboard"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === "manual" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">Analisis Ulasan Manual</h2>
              <p className="text-sm text-gray-500 mt-1">
                Masukkan satu ulasan villa untuk dianalisis sentimennya secara langsung
              </p>
            </div>
            <ManualAnalysis onResult={handleManualResult} onError={(msg) => addToast("error", msg)} />
          </div>
        )}

        {activeTab === "batch" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">Upload & Analisis Massal</h2>
              <p className="text-sm text-gray-500 mt-1">
                Unggah file CSV atau Excel berisi banyak ulasan untuk dianalisis sekaligus
              </p>
            </div>
            <BatchUpload onBatchComplete={handleBatchComplete} onToast={addToast} />
          </div>
        )}

        {activeTab === "dashboard" && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">Dashboard Visualisasi</h2>
              <p className="text-sm text-gray-500 mt-1">
                Ringkasan dan visualisasi dari semua ulasan yang telah dianalisis
              </p>
            </div>
            <Dashboard rows={allRows} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 pb-8 text-center text-xs text-gray-400">
        <p>Villa Sentiment Analyzer &mdash; Sistem Analisis Sentimen Berbasis AI</p>
        <p className="mt-1">Dikembangkan untuk keperluan penelitian Skripsi</p>
      </footer>

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.25s ease-out forwards; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

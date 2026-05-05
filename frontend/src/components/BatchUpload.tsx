import { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Upload,
  FileText,
  Play,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { analyzeSentimentBatch } from "../api";
import { ReviewRow } from "../types";
import { SentimentBadge } from "./SentimentBadge";

interface Props {
  onBatchComplete: (rows: ReviewRow[]) => void;
  onToast: (type: "success" | "error", msg: string) => void;
}

export function BatchUpload({ onBatchComplete, onToast }: Props) {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => handleParsed(res.data as Record<string, string>[], file.name),
        error: () => onToast("error", "Gagal membaca file CSV"),
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target?.result, { type: "binary" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(ws) as Record<string, string>[];
          handleParsed(data, file.name);
        } catch {
          onToast("error", "Gagal membaca file Excel");
        }
      };
      reader.readAsBinaryString(file);
    } else {
      onToast("error", "Format file tidak didukung. Gunakan .csv atau .xlsx");
    }
  };

  const handleParsed = (data: Record<string, string>[], name: string) => {
    const key = Object.keys(data[0] ?? {}).find(
      (k) => k.toLowerCase() === "ulasan" || k.toLowerCase() === "review" || k.toLowerCase() === "text"
    );
    if (!key) {
      onToast("error", "Kolom 'ulasan' tidak ditemukan dalam file");
      return;
    }
    const parsed: ReviewRow[] = data
      .filter((r) => r[key]?.trim())
      .map((r, i) => ({
        id: i + 1,
        ulasan: String(r[key]).trim(),
        tanggal: r["tanggal"] ?? r["date"] ?? r["Tanggal"] ?? r["Date"] ?? undefined,
      }));
    setRows(parsed);
    setFileName(name);
    setProgress(0);
    onToast("success", `${parsed.length} ulasan berhasil dimuat dari ${name}`);
  };

  const handleFile = (file: File) => {
    setRows([]);
    setProgress(0);
    parseFile(file);
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    []
  );

  const handleAnalyzeAll = async () => {
    if (!rows.length) return;
    setLoading(true);
    setProgress(0);

    try {
      const reviews = rows.map((r) => r.ulasan);
      setProgress(10);

      const results = await analyzeSentimentBatch(reviews);
      setProgress(90);

      const updated = rows.map((r, i) => ({
        ...r,
        result: results[i],
        error: undefined,
      }));

      setRows(updated);
      setProgress(100);
      onBatchComplete(updated);
      onToast("success", `Analisis selesai: ${results.length} ulasan berhasil dianalisis`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal menganalisis batch";
      onToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const csvRows = [
      ["No", "Ulasan", "Sentimen", "Skor", "Aspek Utama", "Alasan"],
      ...rows.map((r) => [
        r.id,
        `"${r.ulasan.replace(/"/g, '""')}"`,
        r.result?.sentimen ?? "",
        r.result?.skor ?? "",
        `"${r.result?.aspek.join(", ") ?? ""}"`,
        `"${r.result?.alasan?.replace(/"/g, '""') ?? ""}"`,
      ]),
    ];
    const blob = new Blob([csvRows.map((r) => r.join(",")).join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hasil_analisis_sentimen.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasResults = rows.some((r) => r.result);
  const previewRows = rows.slice(0, 5);
  const analyzedCount = rows.filter((r) => r.result).length;

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-emerald-400 bg-emerald-50"
            : "border-gray-200 bg-gray-50 hover:border-emerald-300 hover:bg-emerald-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? "text-emerald-500" : "text-gray-400"}`} />
        <p className="font-semibold text-gray-700 text-sm">
          {fileName ? (
            <span className="text-emerald-600 flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              {fileName}
            </span>
          ) : (
            "Seret & letakkan file di sini, atau klik untuk memilih"
          )}
        </p>
        <p className="text-xs text-gray-400 mt-1">Format yang didukung: .csv, .xlsx, .xls</p>
        <p className="text-xs text-gray-400 mt-0.5">
          File harus memiliki kolom bernama <code className="bg-gray-200 px-1 rounded">ulasan</code>
        </p>
        {fileName && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRows([]);
              setFileName(null);
              setProgress(0);
            }}
            className="absolute top-3 right-3 p-1 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Pratinjau Data ({rows.length} ulasan)
          </h3>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">No</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ulasan</th>
                  {rows[0]?.tanggal && (
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Tanggal</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {previewRows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{r.id}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs">
                      <span className="line-clamp-2">{r.ulasan}</span>
                    </td>
                    {rows[0]?.tanggal && (
                      <td className="px-4 py-3 text-gray-500 text-xs">{r.tanggal}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 5 && (
              <div className="text-center py-2 text-xs text-gray-400 border-t border-gray-100 bg-gray-50">
                ... dan {rows.length - 5} ulasan lainnya
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {rows.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleAnalyzeAll}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            {loading ? `Menganalisis... (${analyzedCount}/${rows.length})` : "Analisis Semua"}
          </button>
          {hasResults && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold rounded-xl transition-all duration-200"
            >
              <Download className="w-5 h-5" />
              Ekspor CSV
            </button>
          )}
        </div>
      )}

      {/* Progress */}
      {loading && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-gray-600">Progres Analisis</span>
            <span className="text-xs text-emerald-600 font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Results table */}
      {hasResults && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Hasil Analisis ({analyzedCount}/{rows.length} selesai)
          </h3>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">No</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ulasan</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Sentimen</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Skor</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aspek Utama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{r.id}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs">
                      <span className="line-clamp-2 text-xs">{r.ulasan}</span>
                    </td>
                    <td className="px-4 py-3">
                      {r.result ? (
                        <SentimentBadge sentiment={r.result.sentimen} size="sm" />
                      ) : r.error ? (
                        <span className="flex items-center gap-1 text-xs text-red-500">
                          <AlertCircle className="w-3.5 h-3.5" /> Error
                        </span>
                      ) : (
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.result && (
                        <span className="font-semibold text-gray-700 text-xs">{r.result.skor}%</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.result && (
                        <div className="flex flex-wrap gap-1">
                          {r.result.aspek.slice(0, 3).map((a) => (
                            <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

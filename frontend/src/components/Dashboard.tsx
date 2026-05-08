import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import {
  MessageSquare,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import { ReviewRow, AspectSentimentData, TrendData } from "../types";

interface Props {
  rows: ReviewRow[];
}

const SENTIMENT_COLORS = {
  POSITIF: "#10b981",
  NEGATIF: "#ef4444",
};

const ASPECT_LABELS: Record<string, string> = {
  kebersihan: "Kebersihan",
  fasilitas: "Fasilitas",
  pelayanan: "Pelayanan",
  lokasi: "Lokasi",
  harga: "Harga",
  suasana: "Suasana",
  lainnya: "Lainnya",
};

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color.replace("text-", "bg-").replace("-600", "-100").replace("-500", "-100").replace("-400", "-100")}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}



export function Dashboard({ rows }: Props) {
  const analyzed = rows.filter((r) => r.result);

  if (analyzed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <BarChart3 className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg font-semibold">Belum ada data analisis</p>
        <p className="text-sm mt-1 text-center max-w-xs">
          Analisis ulasan secara manual atau unggah file CSV untuk melihat visualisasi di sini
        </p>
      </div>
    );
  }

  const total = analyzed.length;
  const positif = analyzed.filter((r) => r.result!.sentimen === "POSITIF").length;
  const negatif = analyzed.filter((r) => r.result!.sentimen === "NEGATIF").length;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  const pieData = [
    { name: "Positif", value: positif, color: SENTIMENT_COLORS.POSITIF },
    { name: "Negatif", value: negatif, color: SENTIMENT_COLORS.NEGATIF },
  ].filter((d) => d.value > 0);

  // Aspect data
  const aspectMap: Record<string, AspectSentimentData> = {};
  analyzed.forEach((r) => {
    r.result!.aspek.forEach((a) => {
      if (!aspectMap[a]) aspectMap[a] = { aspect: ASPECT_LABELS[a] ?? a, positif: 0, negatif: 0 };
      if (r.result!.sentimen === "POSITIF") aspectMap[a].positif++;
      else if (r.result!.sentimen === "NEGATIF") aspectMap[a].negatif++;
    });
  });
  const aspectData = Object.values(aspectMap).filter((a) => a.aspect !== "Lainnya");

  // Trend data
  const hasDates = analyzed.some((r) => r.tanggal);
  let trendData: TrendData[] = [];
  if (hasDates) {
    const dateMap: Record<string, { positif: number; negatif: number }> = {};
    analyzed.forEach((r) => {
      const d = r.tanggal ?? "Unknown";
      if (!dateMap[d]) dateMap[d] = { positif: 0, negatif: 0 };
      if (r.result!.sentimen === "POSITIF") dateMap[d].positif++;
      else if (r.result!.sentimen === "NEGATIF") dateMap[d].negatif++;
    });
    trendData = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));
  }



  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Ulasan"
          value={total}
          sub="ulasan dianalisis"
          icon={<MessageSquare className="w-5 h-5 text-blue-600" />}
          color="text-blue-600"
        />
        <StatCard
          label="Positif"
          value={`${pct(positif)}%`}
          sub={`${positif} ulasan`}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          color="text-emerald-600"
        />
        <StatCard
          label="Negatif"
          value={`${pct(negatif)}%`}
          sub={`${negatif} ulasan`}
          icon={<TrendingDown className="w-5 h-5 text-red-500" />}
          color="text-red-500"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 text-sm">Distribusi Sentimen</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={true}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v} ulasan`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-5 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>

        {/* Bar - aspects */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 text-sm">Sentimen per Aspek</h3>
          {aspectData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={aspectData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="aspect" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="positif" name="Positif" fill={SENTIMENT_COLORS.POSITIF} radius={[3, 3, 0, 0]} />
                <Bar dataKey="negatif" name="Negatif" fill={SENTIMENT_COLORS.NEGATIF} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-gray-400 text-sm">
              Tidak ada data aspek tersedia
            </div>
          )}
        </div>
      </div>

      {/* Trend chart */}
      {hasDates && trendData.length > 1 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 text-sm">Tren Sentimen dari Waktu ke Waktu</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="positif" name="Positif" stroke={SENTIMENT_COLORS.POSITIF} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="negatif" name="Negatif" stroke={SENTIMENT_COLORS.NEGATIF} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

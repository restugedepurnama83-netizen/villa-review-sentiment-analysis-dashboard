# 🏡 Villa Sentiment Analyzer

> **Sistem Analisis Sentimen Ulasan Pengunjung Villa Berbasis AI**
>
> Aplikasi web full-stack yang menganalisis sentimen ulasan pengunjung villa menggunakan model **LSTM (Long Short-Term Memory)** untuk mengklasifikasikan ulasan sebagai **Positif** atau **Negatif**, sekaligus mendeteksi aspek-aspek yang dibahas dalam ulasan.

---

## 📑 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Struktur Folder](#-struktur-folder)
- [Instalasi & Setup](#-instalasi--setup)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [API Reference](#-api-reference)
- [Screenshot](#-screenshot)

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| **Analisis Manual** | Masukkan satu ulasan secara langsung untuk dianalisis sentimennya |
| **Batch Upload (CSV/Excel)** | Unggah file `.csv` atau `.xlsx` berisi banyak ulasan untuk dianalisis sekaligus |
| **Dashboard Visualisasi** | Pie chart distribusi sentimen, bar chart sentimen per aspek, tren waktu, dan word cloud |
| **Deteksi Aspek** | Mendeteksi aspek yang dibahas: **Kebersihan, Fasilitas, Pelayanan, Lokasi, Harga, Suasana** |
| **Skor Kepercayaan** | Menampilkan skor confidence dari model dalam bentuk persentase |
| **Ekspor Hasil** | Download hasil analisis batch ke file CSV |
| **Toast Notification** | Notifikasi real-time untuk feedback pengguna |

---

## 🛠 Tech Stack

### Backend
| Teknologi | Versi | Fungsi |
|---|---|---|
| **Python** | 3.11+ | Bahasa pemrograman utama |
| **FastAPI** | 0.111.0 | Framework REST API |
| **TensorFlow/Keras** | 2.20.0 | Deep learning framework (LSTM model) |
| **Uvicorn** | 0.29.0 | ASGI server |
| **NumPy** | 1.26.4 | Operasi array/matrix |
| **scikit-learn** | 1.4.2 | Load tokenizer |
| **Pydantic** | 2.7.1 | Validasi schema request/response |

### Frontend
| Teknologi | Versi | Fungsi |
|---|---|---|
| **React** | 18.3.1 | UI library |
| **TypeScript** | 5.5.3 | Type-safe JavaScript |
| **Vite** | 5.4.2 | Build tool & dev server |
| **TailwindCSS** | 3.4.1 | Utility-first CSS framework |
| **Recharts** | 3.8.1 | Visualisasi data (chart) |
| **Lucide React** | 0.344.0 | Icon library |
| **PapaParse** | 5.5.3 | CSV parser |
| **SheetJS (xlsx)** | 0.18.5 | Excel file reader |

---

## 🏗 Arsitektur Sistem

```
┌─────────────────────┐         ┌─────────────────────────┐
│                     │  HTTP   │                         │
│   Frontend (React)  │ ──────► │   Backend (FastAPI)     │
│   Vite Dev Server   │  POST   │   Uvicorn ASGI Server   │
│   Port: 5173        │ /predict│   Port: 5000            │
│                     │ ◄────── │                         │
└─────────────────────┘  JSON   │  ┌───────────────────┐  │
                                │  │ LSTM Model (.keras)│  │
                                │  │ Tokenizer (.pkl)   │  │
                                │  └───────────────────┘  │
                                └─────────────────────────┘
```

**Alur Kerja:**
1. User memasukkan ulasan melalui frontend (manual atau batch upload)
2. Frontend mengirim request `POST /predict` ke backend
3. Backend melakukan preprocessing teks (regex cleaning)
4. Teks di-tokenize dan di-pad sesuai konfigurasi training
5. Model LSTM melakukan prediksi sentimen (sigmoid output)
6. Backend mendeteksi aspek berdasarkan keyword matching
7. Response dikembalikan dengan sentimen, skor, aspek, dan alasan
8. Frontend menampilkan hasil dalam bentuk card, tabel, dan chart

---

## 📂 Struktur Folder

```
villa-review-sentiment-analysis-dashboard/
│
├── backend/
│   ├── main.py                      # Entry point FastAPI (endpoint, preprocessing, prediksi)
│   ├── lstm_sentiment_model.keras   # Model LSTM yang sudah di-train
│   ├── tokenizer.pkl                # Tokenizer (pickle) dari proses training
│   ├── requirements.txt             # Dependensi Python
│   ├── Procfile                     # Konfigurasi deployment (Heroku/Railway)
│   └── .gitignore
│
├── frontend/
│   ├── index.html                   # HTML entry point
│   ├── package.json                 # Dependensi & scripts npm
│   ├── vite.config.ts               # Konfigurasi Vite
│   ├── tailwind.config.js           # Konfigurasi TailwindCSS
│   ├── postcss.config.js            # Konfigurasi PostCSS
│   ├── tsconfig.json                # Konfigurasi TypeScript
│   │
│   └── src/
│       ├── main.tsx                 # React entry point
│       ├── App.tsx                  # Komponen utama (tab navigation, state management)
│       ├── api.ts                   # API client (fetch ke backend /predict)
│       ├── types.ts                 # TypeScript type definitions
│       ├── index.css                # Global CSS
│       │
│       └── components/
│           ├── ManualAnalysis.tsx    # Form input & hasil analisis single review
│           ├── BatchUpload.tsx       # Upload CSV/Excel, analisis massal, ekspor hasil
│           ├── Dashboard.tsx         # Visualisasi: pie chart, bar chart, trend, keyword cloud
│           ├── SentimentBadge.tsx    # Badge label sentimen (Positif/Negatif/Netral)
│           └── Toast.tsx            # Komponen notifikasi toast
│
└── README.md
```

---

## 🚀 Instalasi & Setup

### Prasyarat

- **Python** 3.11 atau lebih baru
- **Node.js** 18+ dan **pnpm** (atau npm)
- **Git**

### 1. Clone Repository

```bash
git clone https://github.com/erstuu/villa-review-sentiment-analysis-dashboard.git
cd villa-review-sentiment-analysis-dashboard
```

### 2. Setup Backend

```bash
cd backend

# Buat virtual environment
python -m venv venv

# Aktifkan virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependensi
pip install -r requirements.txt
```

### 3. Setup Frontend

```bash
cd frontend

# Install dependensi
pnpm install
# atau
npm install
```

---

## ▶️ Menjalankan Aplikasi

### 1. Jalankan Backend (Terminal 1)

```bash
cd backend
python main.py
```

Backend akan berjalan di `http://localhost:5000`

> ℹ️ Pada startup, model LSTM dan tokenizer akan dimuat ke memory. Proses ini mungkin memakan waktu beberapa detik.

### 2. Jalankan Frontend (Terminal 2)

```bash
cd frontend
pnpm dev
# atau
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

### 3. Buka Aplikasi

Buka browser dan akses `http://localhost:5173`

---

## 📡 API Reference

### Health Check

```
GET /
```

**Response:**
```json
{
  "status": "ok",
  "message": "Villa Sentiment API berjalan ✅"
}
```

### Prediksi Sentimen

```
POST /predict
Content-Type: application/json
```

**Request Body:**
```json
{
  "review": "Villa nya bagus banget, kolam renangnya bersih dan pemandangannya indah"
}
```

**Response (200):**
```json
{
  "sentimen": "POSITIF",
  "skor": 92,
  "aspek": ["fasilitas", "kebersihan", "suasana"],
  "alasan": "Model mengklasifikasikan ulasan ini sebagai POSITIF dengan kepercayaan tinggi (92%). Aspek yang terdeteksi: fasilitas, kebersihan, suasana."
}
```

**Response Fields:**

| Field | Tipe | Deskripsi |
|---|---|---|
| `sentimen` | `string` | Hasil klasifikasi: `POSITIF` atau `NEGATIF` |
| `skor` | `integer` | Skor kepercayaan model (0–100%) |
| `aspek` | `string[]` | Aspek yang terdeteksi dari ulasan |
| `alasan` | `string` | Penjelasan hasil klasifikasi |

**Aspek yang Dideteksi:**

| Aspek | Kata Kunci |
|---|---|
| Kebersihan | bersih, kotor, jorok, rapi, debu, sanitasi |
| Fasilitas | fasilitas, kolam, wifi, ac, tv, dapur, kamar |
| Pelayanan | pelayanan, staff, ramah, cepat, lambat, respon, host |
| Lokasi | lokasi, tempat, akses, jalan, dekat, jauh, strategis |
| Harga | harga, murah, mahal, worth, sebanding, tarif, bayar |
| Suasana | suasana, tenang, nyaman, sejuk, asri, pemandangan, view |

---

## 📸 Screenshot

> _Coming soon — jalankan aplikasi untuk melihat tampilan dashboard secara langsung._

---

## 📄 Lisensi

Proyek ini dikembangkan untuk keperluan penelitian **Skripsi**.

---

<p align="center">
  Dibuat dengan ❤️ menggunakan <strong>FastAPI + TensorFlow + React</strong>
</p>

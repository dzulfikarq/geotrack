# GeoTrack

GeoTrack adalah aplikasi web untuk mengelola entitas berlokasi geografis—kendaraan, perangkat IoT, dan fasilitas—melalui daftar dan peta. Aplikasi menyimpan koordinat tetap; GeoTrack **bukan** pelacak GPS real-time.

## Fitur

- CRUD entitas melalui REST API Go dan penyimpanan SQLite.
- Peta OpenStreetMap dengan marker kategori, pemilihan entitas, popup, dan detail.
- Form create/edit dengan validasi di frontend dan backend.
- Pencarian berdasarkan kode/nama serta filter kategori dan status yang dapat digabung.
- Pemilih koordinat melalui klik peta; koordinat `(0, 0)` valid.
- Umpan balik pemuatan (loading), error, daftar kosong (empty), dan sukses (success) pada antarmuka.
- Seed data pengembangan yang dijalankan secara eksplisit, bukan otomatis.

> Pemeriksaan browser untuk tampilan, marker, tile peta, dan layout responsif belum dilakukan. Rincian ada di [batasan](docs/LIMITATIONS.md) dan [hasil pengujian](docs/TESTING.md).

## Teknologi

| Bagian | Teknologi aktual |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Data dan form | TanStack Query, React Hook Form, Zod |
| Peta | React Leaflet, Leaflet, tile OpenStreetMap |
| Backend | Go, Gin |
| Database | SQLite melalui `database/sql` dan `modernc.org/sqlite` (tanpa CGO) |
| Pengujian frontend | Vitest |

Antarmuka menggunakan elemen HTML native untuk dialog; shadcn/ui tidak dipakai.

## Persyaratan

- Go 1.23 atau lebih baru.
- Node.js 20 atau lebih baru dan npm.
- Akses internet untuk memuat tile OpenStreetMap.

Docker, API key peta, dan server database terpisah tidak diperlukan.

## Mulai cepat

> Jalankan backend dan frontend di dua terminal terpisah dari direktori repository.

### Windows — PowerShell

Terminal 1, backend:

```powershell
cd backend
go mod download
$env:PORT = "8080"
$env:DB_PATH = "./data/geotrack.db"
$env:CORS_ORIGIN = "http://localhost:5173"
go run ./cmd/api
```

Terminal 2, frontend:

```powershell
cd frontend
npm install
# Opsional: salin lalu edit VITE_API_BASE_URL bila API bukan URL default.
Copy-Item .env.example .env
npm run dev
```

### Linux / macOS

Terminal 1, backend:

```sh
cd backend
go mod download
export PORT=8080
export DB_PATH=./data/geotrack.db
export CORS_ORIGIN=http://localhost:5173
go run ./cmd/api
```

Terminal 2, frontend:

```sh
cd frontend
npm install
# Opsional: salin lalu edit VITE_API_BASE_URL bila API bukan URL default.
cp .env.example .env
npm run dev
```

Buka `http://localhost:5173`. API tersedia di `http://localhost:8080`; endpoint pemeriksaan proses ada di `http://localhost:8080/health`.

## Konfigurasi environment

| Variabel | Default | Komponen | Keterangan |
|---|---|---|---|
| `PORT` | `8080` | Backend | Port HTTP API. |
| `DB_PATH` | `./data/geotrack.db` | Backend dan seed | Path SQLite relatif ke working directory; jalankan command dari `backend/`. |
| `CORS_ORIGIN` | `http://localhost:5173` | Backend | Satu origin frontend yang diizinkan. |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Frontend | Base URL API sebelum suffix `/api/v1`. |

Backend membaca environment proses. `backend/.env.example` hanya contoh dan **tidak** dimuat otomatis. Vite memuat `.env` dari `frontend/`; file tersebut opsional bila memakai URL default. Detail konfigurasi: [Arsitektur — konfigurasi runtime](docs/ARCHITECTURE.md#konfigurasi-runtime).

## Data contoh pengembangan

Database baru kosong. Untuk mengisinya, dari direktori `backend/` jalankan:

```sh
go run ./cmd/seed
```

Perintah ini menambahkan `VEH-001`, `IOT-001`, dan `FAC-001`, satu per kategori. Kode yang sudah ada dilewati; seed tidak mengubah data yang sudah tersimpan. Jika memakai `DB_PATH` khusus, set nilai yang sama sebelum menjalankan seed. Detail: [DATABASE.md](docs/DATABASE.md#seed-data).

## Dokumentasi

| Dokumen | Isi |
|---|---|
| [PRD](docs/PRD.md) | Tujuan, lingkup, kebutuhan, dan status implementasi/verifikasi |
| [Arsitektur](docs/ARCHITECTURE.md) | Struktur aktual, stack, alur data, dan konfigurasi |
| [API](docs/API.md) | Endpoint, payload, validasi, status HTTP, dan contoh error |
| [Database](docs/DATABASE.md) | Skema SQLite, aturan persistensi, dan seed |
| [Panduan pengguna](docs/USER_GUIDE.md) | Alur memakai daftar, peta, form, filter, dan hapus |
| [Pengujian](docs/TESTING.md) | Perintah dan hasil passed, failed, serta not tested |
| [Batasan](docs/LIMITATIONS.md) | Fitur di luar lingkup, known issues, dan hal yang belum diverifikasi |
| [AGENT.md](AGENT.md) | Workflow Agentic AI dan catatan review/verifikasi |

Spesifikasi PRD dan Architecture yang semula berada di root sudah direkonsiliasi ke [`docs/PRD.md`](docs/PRD.md) dan [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). File sumber root dihapus atas permintaan agar tidak ada dokumentasi duplikat.

## Pengujian

Jalankan dari direktori masing-masing:

```sh
# backend/
go test ./...
go vet ./...

# frontend/
npm test
npm run typecheck
npm run build
npm audit
```

Semua command di atas berhasil pada pemeriksaan terakhir; `npm audit` melaporkan 0 vulnerability. Build Vite memberi dua warning Rollup non-fatal dari komentar anotasi dependency Zod. Smoke test API juga berhasil untuk health, create `(0, 0)`, list, update, baca ulang data, dan delete. **Alur antarmuka belum diuji di browser.** Hasil lengkap, kegagalan percobaan awal, dan hal yang belum diuji: [TESTING.md](docs/TESTING.md).

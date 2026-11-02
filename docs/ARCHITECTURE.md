# Arsitektur GeoTrack

Dokumen ini menggabungkan referensi arsitektur sumber dengan struktur yang ada di repository; rincian yang belum diimplementasikan tidak disajikan sebagai kemampuan aktual.

## Gambaran alur

```text
Browser
  React App + TanStack Query
  ├─ daftar/detail/form entitas (React Hook Form + Zod)
  └─ peta/marker/pemilih koordinat (React Leaflet)
              │ HTTP JSON
              ▼
       Go + Gin HTTP server
       logger, recovery, CORS
              │
       handler + validasi
              │
       repository (database/sql)
              │
       SQLite (modernc, no-CGO)
```

Frontend tidak mengakses database. Server mengembalikan data; frontend memperbarui cache setelah write berhasil. Daftar dan marker berasal dari respons query entitas yang sama. Query list memakai filter `q`, `category`, dan `status`; setelah create/update/delete cache entitas diinvalidate. Setelah save, filter dibersihkan agar entitas yang baru disimpan terlihat.

## Stack aktual

| Area | Pilihan aktual | Alasan/kondisi |
|---|---|---|
| Frontend | React 18, TypeScript, Vite | Stack frontend yang diminta; Vite menyediakan dev server dan build. |
| Styling | Tailwind CSS + stylesheet lokal | Utility terbatas dipakai bersama CSS dashboard khusus. |
| UI dan ikon | Elemen native, `<dialog>`, Lucide React | Dialog native cukup untuk form/konfirmasi; shadcn/ui/Radix tidak dipasang. |
| Peta | React Leaflet, Leaflet, tile OpenStreetMap | Peta tanpa API key berbayar; tile publik memerlukan internet dan tidak ditujukan untuk skala produksi. |
| Data/form client | TanStack Query, React Hook Form, Zod | Cache API dan invalidasi write; validasi client bersandingan dengan validasi backend. |
| Backend | Go `1.23.0`, Gin | REST API, logger, recovery, dan middleware CORS. |
| Database | `database/sql`, `modernc.org/sqlite` | SQLite lokal tanpa server DB tambahan dan tanpa CGO. |
| Test frontend | Vitest | Test unit schema. |

Repository langsung dipanggil handler; belum ada service layer terpisah. Tidak ada router client, state store global, autentikasi, atau WebSocket.

Versi dependency rinci tercatat di `backend/go.mod` dan `frontend/package.json` / lockfile.

## Struktur repository aktual

```text
geotrack/
├── .gitignore
├── README.md
├── AGENT.md
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── USER_GUIDE.md
│   ├── TESTING.md
│   ├── LIMITATIONS.md
│   └── DECISION.md
├── backend/
│   ├── .env.example
│   ├── go.mod
│   ├── go.sum
│   ├── cmd/api/main.go
│   ├── cmd/seed/main.go
│   └── internal/
│       ├── database/database.go
│       ├── database/schema.sql
│       ├── entity/handler.go
│       ├── entity/handler_test.go
│       ├── entity/model.go
│       ├── entity/repository.go
│       ├── entity/validation.go
│       └── httpserver/server.go
└── frontend/
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── tsconfig.json
    └── src/
        ├── App.tsx
        ├── components/Modal.tsx
        ├── features/entities/EntityForm.tsx
        ├── features/entities/api.ts
        ├── features/entities/schema.ts
        ├── features/entities/schema.test.ts
        ├── features/entities/types.ts
        ├── features/map/EntityMap.tsx
        ├── main.tsx
        ├── styles.css
        └── vite-env.d.ts
```

## Alur frontend

1. `App.tsx` meminta daftar melalui `features/entities/api.ts`, memakai query key `['entities', filters]`.
2. Respons yang sama dirender sebagai baris dan marker. Pilihan baris/marker menyimpan ID secara lokal, memfokuskan peta, dan menampilkan detail. `selectedId`, status form, ID edit, dan mode picker disimpan di React state lokal; tidak ada duplikasi entity state di global store.
3. Create/update mengirim JSON ke API. Cache diinvalidate setelah API sukses; kegagalan ditampilkan tanpa menganggap operasi berhasil.
4. Pemilih koordinat hanya aktif setelah diaktifkan dari form. Dialog form ditutup sementara agar peta dapat diklik; klik peta mengisi koordinat dan membuka form kembali. Tombol cancel membatalkan mode picker.
5. Delete memakai dialog konfirmasi. Selection dibersihkan setelah API mengembalikan sukses.

Jika query GET gagal, panel menyediakan pesan error dan tombol retry. Setelah save sukses, filter dibersihkan agar entitas create/update tidak tersembunyi oleh filter lama.

Kode UI sudah disusun untuk layout responsif, tetapi layout dan interaksi belum diperiksa di browser; lihat [TESTING.md](TESTING.md).

## Alur backend

- `cmd/api` membaca environment, membuka database, membuat router, lalu menjalankan HTTP server.
- `httpserver.New` memasang Gin logger/recovery, CORS dengan satu origin yang dikonfigurasi, `/health`, dan route `/api/v1/entities`.
- Handler membaca satu JSON object (maksimum 1 MiB, unknown field ditolak), menjalankan `entity.Validate`, lalu memanggil repository.
- Repository menjalankan SQL berparameter dan menerima request context dari handler. Error dikonversi handler ke respons API stabil; detail SQL tidak dikirim ke client.
- `database.Open` membuat direktori untuk path biasa, menyetel satu koneksi dan `busy_timeout=5000`, lalu mengeksekusi schema embedded.

## Peta dan koordinat

- Titik awal peta adalah Indonesia pada koordinat `[-2.5, 118]`, zoom `5`. Jika ada satu entity, peta menuju lokasi tersebut; jika lebih dari satu, bounds marker di-fit. Jika tidak ada data, peta tetap dapat di-pan/zoom di titik awal.
- Marker dibuat sebagai `CircleMarker`: oranye untuk vehicle, teal untuk IoT device, ungu untuk facility. Inactive dibuat lebih transparan, maintenance memakai garis putus-putus, dan pilihan diberi outline lebih tebal.
- Klik marker membuka pilihan/popup; klik baris memilih entity dan memindahkan peta (`flyTo`). Detail UI tidak menampilkan UUID internal.
- Tile layer mencantumkan attribution OpenStreetMap. CSS Leaflet dimuat dari `main.tsx`; penggunaan `CircleMarker` tidak memerlukan file ikon marker PNG bawaan.
- Picker diaktifkan eksplisit dari form. Mode tersebut menutup sementara dialog agar map event bisa diterima; klik koordinat mengisi latitude/longitude memakai `setValue` dengan validasi Zod, lalu form dibuka kembali. Klik map biasa tidak mengubah form.

Endpoint dan kontrak lengkap: [API.md](API.md). Persistensi dan schema: [DATABASE.md](DATABASE.md).

## Konfigurasi runtime

| Variabel | Default | Dibaca oleh | Catatan |
|---|---|---|---|
| `PORT` | `8080` | Backend | Port HTTP. |
| `DB_PATH` | `./data/geotrack.db` | Backend dan seed | Relatif terhadap working directory proses; jalankan dari `backend/` agar default konsisten. Direktori dibuat otomatis. |
| `CORS_ORIGIN` | `http://localhost:5173` | Backend | Satu origin yang dicocokkan secara exact. |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Vite/frontend | Base URL sebelum suffix `/api/v1`. `.env` dibaca oleh Vite; Go tidak memuat file `.env`. |

## Keputusan dan konsekuensi

- Rekonstruksi keputusan historis dan kebijakan pencatatan berikutnya ada di [DECISION.md](DECISION.md). Dokumen arsitektur ini menggambarkan baseline yang telah di-commit sebelum perubahan kategori/typography yang masih in progress.
- Penyimpanan lokal SQLite menjaga setup sederhana, tetapi bukan desain high-availability.
- Pool DB dibatasi satu koneksi agar operasi SQLite terserialisasi. Ini membatasi throughput baca; belum diukur.
- Schema menggunakan `CREATE TABLE/INDEX IF NOT EXISTS` yang di-embed; belum ada migration versioning framework.
- `/health` mengembalikan status proses tanpa ping DB. Lihat [LIMITATIONS.md](LIMITATIONS.md).

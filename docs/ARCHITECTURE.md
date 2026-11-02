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

Frontend tidak mengakses database. Server mengembalikan data; frontend memperbarui cache setelah write berhasil. Query kategori memasok form entity, filter, halaman manajemen, dan legend; respons entity menyertakan metadata kategori untuk row, detail, dan marker. Entity list mendukung filter `q`, `category_id`, legacy `category`, dan `status`. Save kategori menginvalidation query kategori dan entity agar visual map tersinkron.

## Stack aktual

| Area | Pilihan aktual | Alasan/kondisi |
|---|---|---|
| Frontend | React 18, TypeScript, Vite | Stack frontend yang diminta; Vite menyediakan dev server dan build. |
| Styling | Tailwind CSS + stylesheet lokal | Theme Tailwind kosong; style aktual didominasi CSS khusus. Detail visual ada di [DESIGN.md](DESIGN.md). |
| UI dan ikon | Elemen native, `<dialog>`, Lucide React | Dialog native cukup untuk form/konfirmasi; shadcn/ui/Radix tidak dipasang. |
| Peta | React Leaflet, Leaflet, tile OpenStreetMap | Peta tanpa API key berbayar; tile publik memerlukan internet dan tidak ditujukan untuk skala produksi. |
| Data/form client | TanStack Query, React Hook Form, Zod | Cache API dan invalidasi write; validasi client bersandingan dengan validasi backend. |
| Backend | Go `1.23.0`, Gin | REST API, logger, recovery, dan middleware CORS. |
| Database | `database/sql`, `modernc.org/sqlite` | SQLite lokal tanpa server DB tambahan dan tanpa CGO. |
| Test frontend | Vitest | Unit schema entity/kategori dan render markup marker allowlisted. |

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
│   ├── DECISION.md
│   └── DESIGN.md
├── backend/
│   ├── .env.example
│   ├── go.mod
│   ├── go.sum
│   ├── cmd/api/main.go
│   ├── cmd/seed/main.go
│   └── internal/
│       ├── category/{handler,model,repository}.go
│       ├── database/{database.go,schema.sql}
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
        ├── features/categories/{CategoryManagement,api,icons,schema,types}
        ├── features/entities/EntityForm.tsx
        ├── features/entities/api.ts
        ├── features/entities/schema.ts
        ├── features/entities/schema.test.ts
        ├── features/entities/types.ts
        ├── features/map/{EntityMap.tsx,marker.ts}
        ├── main.tsx
        ├── styles.css
        └── vite-env.d.ts
```

## Alur frontend

1. `App.tsx` meminta kategori melalui `features/categories/api.ts` (`['categories']`) dan daftar melalui `features/entities/api.ts` (`['entities', filters]`).
2. Kategori yang sama memasok dropdown/filter/legend. Respons entity beserta metadata kategori dirender sebagai baris, detail, dan marker.
3. Halaman `CategoryManagement` memakai native dialog dan TanStack Query untuk CRUD kategori; sesudah save/delete, cache kategori dan entity diinvalidate.
4. Pilihan baris/marker menyimpan ID secara lokal, memfokuskan peta, dan menampilkan detail. State UI tetap lokal; tidak ada duplikasi entity state di global store.
5. Create/update mengirim JSON ke API. Cache diinvalidate setelah API sukses; kegagalan ditampilkan tanpa menganggap operasi berhasil.
6. Pemilih koordinat hanya aktif setelah diaktifkan dari form. Dialog form ditutup sementara agar peta dapat diklik; klik peta mengisi koordinat dan membuka form kembali.
7. Delete entity/kategori memakai dialog konfirmasi. Selection dibersihkan setelah API mengembalikan sukses.

Jika query GET gagal, panel menyediakan pesan error dan tombol retry. Setelah save sukses, filter dibersihkan agar entitas create/update tidak tersembunyi oleh filter lama.

Kode UI sudah disusun untuk layout responsif, tetapi layout dan interaksi belum diperiksa di browser; lihat [TESTING.md](TESTING.md).

## Alur backend

- `cmd/api` membaca environment, membuka database, membuat router, lalu menjalankan HTTP server.
- `httpserver.New` memasang Gin logger/recovery, CORS dengan satu origin yang dikonfigurasi, `/health`, serta route `/api/v1/entities` dan `/api/v1/categories`.
- Handler membaca satu JSON object (maksimum 1 MiB, unknown field ditolak), menjalankan `entity.Validate`, lalu memanggil repository.
- Repository menjalankan SQL berparameter dan menerima request context dari handler. Error dikonversi handler ke respons API stabil; detail SQL tidak dikirim ke client.
- Entity menyimpan `category_id` sebagai foreign key ke kategori. Delete kategori ditolak DB saat masih direferensikan; repository juga menjaga tiga kategori bawaan.
- `database.Open` membuat direktori untuk path biasa, menyetel satu koneksi dan `busy_timeout=5000`, menjalankan schema embedded, lalu migrasi SQLite idempotent yang memverifikasi jumlah entity sebelum mengganti tabel lama.

## Peta dan koordinat

- Titik awal peta adalah Indonesia pada koordinat `[-2.5, 118]`, zoom `5`. Jika ada satu entity, peta menuju lokasi tersebut; jika lebih dari satu, bounds marker di-fit. Jika tidak ada data, peta tetap dapat di-pan/zoom di titik awal.
- Marker dibuat sebagai Leaflet `DivIcon` dari allowlist Lucide dan metadata kategori: 24 icon key, 8 warna preset, serta Pin/Circle/Rounded square. Inactive dibuat lebih transparan, maintenance memakai border dashed, dan pilihan diberi ring/scale.
- Klik marker membuka pilihan/popup; klik baris memilih entity dan memindahkan peta (`flyTo`). Detail UI tidak menampilkan UUID internal.
- Tile layer mencantumkan attribution OpenStreetMap. CSS Leaflet dimuat dari `main.tsx`; marker SVG dirender dari komponen Lucide terkurasi ke markup statis. API tidak menerima SVG/HTML arbitrer.
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

- Rekonstruksi keputusan historis dan kebijakan pencatatan ada di [DECISION.md](DECISION.md). Category CRUD/marker customization serta Plus Jakarta Sans menggambarkan source saat ini; status verifikasi ada di [TESTING.md](TESTING.md).
- Penyimpanan lokal SQLite menjaga setup sederhana, tetapi bukan desain high-availability.
- Pool DB dibatasi satu koneksi agar operasi SQLite terserialisasi. Ini membatasi throughput baca; belum diukur.
- Schema SQL di-embed dan `schema_migrations` mencatat migrasi versi 2–3; belum ada migration framework eksternal.
- `/health` mengembalikan status proses tanpa ping DB. Lihat [LIMITATIONS.md](LIMITATIONS.md).

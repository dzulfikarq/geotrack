# Database dan persistensi

## Teknologi dan lokasi

Backend memakai `database/sql` dengan driver pure-Go `modernc.org/sqlite`, sehingga tidak memerlukan CGO atau server database terpisah.

- Default `DB_PATH`: `./data/geotrack.db` relatif ke working directory proses.
- Jalankan API dari direktori `backend/` untuk memakai lokasi `backend/data/geotrack.db`.
- Direktori parent dibuat otomatis untuk path biasa.
- Database lokal dan file SQLite diabaikan oleh `.gitignore`; tidak ada data database yang perlu di-commit.
- `backend/.env.example` adalah contoh saja. Proses Go membaca environment, bukan file `.env`.

Saat `database.Open` dipanggil, schema SQL embedded dijalankan lalu migrasi idempotent di dalam transaksi. `schema_migrations` mencatat versi 2 (relasi kategori) dan 3 (visual metadata kategori); tidak ada migration framework eksternal. Migrasi versi lama membuat kategori bawaan ber-ID tetap, menyalin setiap entity dari kolom `category` ke `category_id`, memverifikasi jumlah baris salinan, mengganti tabel, lalu membangun ulang index status dan kategori. Kegagalan menolak commit sehingga tabel entity lama tetap utuh.

## Skema aktual

```sql
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  legacy_key TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE CHECK (length(trim(name)) BETWEEN 1 AND 60),
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'truck' CHECK (icon IN ('truck', 'cpu', 'building-2', 'package', 'radio', 'map-pin')),
  icon_key TEXT NOT NULL DEFAULT 'truck' CHECK (icon_key IN (
    'truck', 'car-front', 'bus-front', 'bike', 'ship', 'train-front',
    'cpu', 'radio', 'router', 'wifi', 'satellite-dish', 'thermometer',
    'building-2', 'warehouse', 'factory', 'hospital', 'school', 'landmark',
    'map-pin', 'map-pinned', 'package', 'box', 'briefcase', 'database'
  )),
  color TEXT NOT NULL CHECK (color IN ('orange', 'teal', 'violet', 'blue', 'green', 'rose', 'slate', 'amber')),
  marker_style TEXT NOT NULL DEFAULT 'pin' CHECK (marker_style IN ('pin', 'circle', 'rounded-square')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL COLLATE NOCASE UNIQUE,
  name TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'maintenance')),
  latitude REAL NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude REAL NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_entities_category_id ON entities(category_id);
CREATE INDEX IF NOT EXISTS idx_entities_status ON entities(status);
```

| Kolom | Penyimpanan dan aturan |
|---|---|
| `id` | `TEXT PRIMARY KEY`; server menghasilkan UUID v4 berbentuk string. Tidak ada constraint SQL yang memvalidasi format UUID. |
| `code` | Wajib, unique dengan collation `NOCASE`; aplikasi menormalisasi menjadi uppercase dan memvalidasi format. |
| `name` | Wajib; aturan panjang/trim ditegakkan aplikasi. |
| `category_id` | Wajib; UUID kategori, foreign key `ON DELETE RESTRICT`. `category` lama hanya alias API dan tidak disimpan lagi. |
| `status` | Wajib; dibatasi `CHECK` ke status yang didukung. |
| `latitude` | `REAL NOT NULL`, `CHECK -90..90` inklusif; nol valid. |
| `longitude` | `REAL NOT NULL`, `CHECK -180..180` inklusif; nol valid. |
| `description` | `TEXT NOT NULL DEFAULT ''`; batas panjang ditegakkan aplikasi. |
| `created_at`, `updated_at` | `TEXT NOT NULL`; dibuat server sebagai waktu UTC RFC3339Nano. `updated_at` diganti saat update. |

`categories.id` adalah UUID stabil; rename tidak mengubah relasi. `legacy_key` menyimpan alias tiga kategori bawaan (`vehicle`, `iot_device`, `facility`); kategori custom memakai UUID sebagai legacy key. Tiga kategori bawaan tidak dapat dihapus melalui repository API. Nama unik case-insensitive. Kolom lama `icon` dapat tetap ada pada database upgrade untuk kompatibilitas; aplikasi membaca `icon_key`.

Constraint SQL adalah perlindungan tambahan. Validasi format kode, panjang string, enum allowlist visual, nilai finite koordinat, dan required fields dijalankan di aplikasi. Rincian: [API.md](API.md#validasi).

## Akses database

Semua operasi memakai parameter SQL, bukan menyisipkan input pengguna ke query. Kode membatasi pool ke satu koneksi dan menetapkan `PRAGMA busy_timeout = 5000`; ini menyederhanakan penulisan SQLite, tetapi membatasi throughput. Tidak ada pagination atau strategi multi-database.

## Seed data

Seed bersifat opt-in. Dari `backend/`, jalankan `go run ./cmd/seed` dengan environment `DB_PATH` yang sama seperti API. Command menyiapkan 25 entity demo tersebar di delapan kategori:

| Kategori | Tipe | Jumlah entity | Icon | Warna | Marker |
|---|---|---|---|---|---|
| Vehicle | Bawaan | 5 | `truck` | orange | pin |
| IoT Device | Bawaan | 5 | `cpu` | teal | circle |
| Facility | Bawaan | 4 | `building-2` | violet | rounded-square |
| Warehouse | Custom | 3 | `warehouse` | blue | rounded-square |
| Medical Center | Custom | 2 | `hospital` | green | circle |
| Port Terminal | Custom | 2 | `ship` | teal | pin |
| Retail Outlet | Custom | 2 | `building-2` | slate | rounded-square |
| Utility Site | Custom | 2 | `factory` | rose | circle |

Contoh entity: `VEH-001` Service Vehicle, `IOT-001` Temperature Sensor, `FAC-001` Operations Center, `WH-001` Malang Distribution Hub, dan `PORT-001` Tanjung Perak Terminal. Koordinat tersebar di kota-kota Indonesia; variasi status mencakup active, inactive, dan maintenance.

Seed membuat kategori custom jika belum ada; kategori dengan nama sama dan kode entity yang sudah ada dipakai/dilewati tanpa memperbarui record. Seed tidak berjalan otomatis saat API start dan insert kategori/entity dilakukan satu per satu, bukan dalam satu transaksi. Lihat [batasan](LIMITATIONS.md#isu-yang-diketahui).

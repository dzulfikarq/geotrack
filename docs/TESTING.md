# Pengujian dan verifikasi

Dokumen ini hanya mencatat pemeriksaan yang benar-benar dijalankan pada sesi implementasi. Status terbaru ditulis sebagai **passed**, **failed**, atau **not tested**. Test otomatis bukan pengganti acceptance test browser.

## Passed

Pemeriksaan terakhir dijalankan di Windows dengan Go `1.26.10`, Node `22.22.1`, dan Chrome. Command berjalan dari direktori yang disebutkan.

| Direktori | Command / pemeriksaan | Hasil aktual |
|---|---|---|
| `backend/` | `go test ./...` | Passed untuk seluruh package. Cakupan mencakup CRUD/filter entity, kategori/allowlist, proteksi delete, dan migrasi database. |
| `backend/` | `go vet ./...` | Passed tanpa diagnostic. |
| `backend/` | `go run golang.org/x/vuln/cmd/govulncheck@latest ./...` | 0 vulnerability dengan jalur symbol yang terjangkau. Scanner juga melaporkan 2 vulnerability pada package dan 1 pada module yang dipakai, tetapi tidak menemukan pemanggilan yang terjangkau. |
| `frontend/` | `npm run lint` | Passed tanpa error atau warning. |
| `frontend/` | `npm test` | Passed: 5 file, 10 test Vitest. |
| `frontend/` | `npm run typecheck` | Passed (`tsc --noEmit`). |
| `frontend/` | `npm run build` | Passed; 1.786 module ditransformasi. Chunk utama 223.86 kB, React vendor 214.18 kB, map vendor 154.92 kB, dan Category Management 14.61 kB. Tidak ada warning ukuran chunk; dua warning Rollup non-fatal dari komentar di Zod v4 masih ada. |
| `frontend/` | `npm audit` | Passed: 0 vulnerability. |
| HTTP lokal | API acceptance dengan SQLite seed terisolasi | Passed: health; list/create/update/delete category dan entity; validasi category/entity; koordinat `(0,0)`; duplikasi `409`; kategori terpakai tidak bisa dihapus; persistensi entity/category setelah API restart; delete memberi `204`, GET entity terhapus memberi `404`. |
| Chrome headless + Vite/API lokal | Acceptance UI otomatis, 1440×1000 dan 390×844 | Passed: 44 assertion untuk loading/error/retry kategori, 25 marker dan 16 tile OSM tampil, detail marker/list, entity/category CRUD, validasi client/server, picker koordinat, search/filter gabungan, empty state, pagination entity, derived `entity_count`, persistensi entity sesudah reload, mobile view toggle, dan no horizontal overflow. Simulasi API kategori `503` pulih melalui retry. Tidak ada browser exception. Screenshot: [Map Explorer](assets/map-explorer.png), [Category Management](assets/category-management.png). |
| Root dan `frontend/` | `npm ci`; `predev` dengan Go `1.26.10` | Clean install dari lockfile dan pemeriksaan prasyarat startup passed. |

## Not tested — belum diuji

- Acceptance UI memakai otomasi Chrome, bukan pemeriksaan manual/review manusia. Navigasi keyboard, urutan/focus dialog, screen reader, dan audit kontras belum diperiksa; tidak ada klaim WCAG compliance.
- Perintah quick start Linux/macOS belum dijalankan; runtime smoke dilakukan di Windows.
- Database rusak/terkunci, beban concurrency, penggunaan tile OSM jangka panjang, dan proses recovery jaringan umum belum diuji. Kegagalan kategori `503` dan retry sudah diuji melalui browser.
- Screenshot browser diambil dengan Chrome headless; belum ada review visual manusia.

## Reproduksi pemeriksaan otomatis

Test backend/frontend:

```powershell
cd backend
go test ./...
go vet ./...
go run golang.org/x/vuln/cmd/govulncheck@latest ./...

cd ../frontend
npm ci
npm run lint
npm test
npm run typecheck
npm run build
npm audit
```

API acceptance dan browser automation menggunakan service/database lokal terisolasi serta script PowerShell/CDP sementara di direktori temp; script tersebut tidak disertakan sebagai project test. Screenshot hasil acceptance disimpan di repository. Quick start dan command pengujian lain tercantum di [README](../README.md#pengujian).

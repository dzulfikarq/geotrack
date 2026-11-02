# Pengujian dan verifikasi

Dokumen ini hanya mencatat pemeriksaan yang benar-benar dijalankan pada sesi implementasi. Status terbaru ditulis sebagai **passed**, **failed**, atau **not tested**. Test otomatis bukan pengganti acceptance test browser.

## Passed

Command dijalankan dari direktori yang disebutkan.

| Direktori | Command / pemeriksaan | Hasil aktual |
|---|---|---|
| `backend/` | `go test ./...` | Passed. Paket `internal/entity` lulus; paket lain tidak mempunyai file test. `TestCreateZeroCoordinatesDuplicateAndPersistence`, `TestValidationRejectsBadInputs`, dan `TestUpdateDeleteAndCombinedFilters` mencakup create koordinat nol, persistensi setelah reopen DB, duplikasi kode, sejumlah input invalid/malformed, update, filter gabungan, delete, dan pemeriksaan panjang ID 36 karakter. |
| `backend/` | `go vet ./...` | Passed, tanpa diagnostic. |
| `frontend/` | `npm test` | Passed: 1 file, 3 test Vitest. Memeriksa koordinat nol, rentang koordinat, kode invalid, dan nilai latitude non-finite. |
| `frontend/` | `npm run typecheck` | Passed (`tsc --noEmit`). |
| `frontend/` | `npm run build` | Passed. Vite mentransformasi 1.771 module dan menghasilkan build. Ada dua warning Rollup non-fatal tentang posisi komentar anotasi di file dependency Zod v4. |
| `frontend/` | `npm audit` | Passed pada pemeriksaan terakhir: 0 vulnerability. |
| Lokal, PowerShell | Smoke API melalui `Invoke-RestMethod` dengan SQLite sementara | Passed: `GET /health`; create `SMK-003` dengan `(0,0)`; list; update latitude; baca ulang; delete; GET sesudah delete memberi `404`. Ringkasan output: `health=ok create=ok zero=accepted list=1 update=-7.2 persistence=1 delete=404-confirmed`. |
| `frontend/` | `npm run dev -- --host 127.0.0.1 --port 5174`, lalu GET `http://127.0.0.1:5174` | Passed: server mengirim HTML yang memuat `GeoTrack` dan `/src/main.tsx`. Ini hanya smoke server/HTML, bukan render browser. |

## Failed — percobaan awal yang diperbaiki

Tidak ada test suite akhir yang gagal. Beberapa percobaan awal gagal sebelum verifikasi berhasil:

- `npm audit` saat versi dependency sebelumnya digunakan menemukan vulnerability (termasuk laporan awal 1 high; setelah Vitest 3 ditambahkan, audit melaporkan 1 moderate dan 2 critical). Dependency kemudian diperbarui; `npm audit` terakhir menghasilkan 0 vulnerability. Lihat [LIMITATIONS.md](LIMITATIONS.md#isu-yang-diketahui) untuk warning build yang masih ada.
- Percobaan awal smoke API di PowerShell gagal karena `Invoke-WebRequest` meminta interaksi saat menangani respons `204`, lalu percobaan berikutnya membentuk URI query secara keliru (`$base?q`). Test dijalankan ulang memakai `Invoke-RestMethod` dan `${base}?q=...`; smoke API final lulus seperti dicatat di atas. Ini kegagalan pemanggilan test, bukan kegagalan API yang terkonfirmasi.

## Not tested — belum diuji

- Tidak ada browser automation atau pemeriksaan manual browser.
- Render peta/marker, ketersediaan tile OSM, popup, map picker, form/dialog, dan alur UI CRUD belum diuji end-to-end.
- Layout responsive, navigasi keyboard, focus behavior, dan screen reader belum diverifikasi di browser.
- Perintah quick start Linux/macOS belum dijalankan; runtime smoke dilakukan di Windows.
- CORS antar-origin, kondisi database rusak/terkunci, beban konkurensi, dan pemulihan kegagalan jaringan belum diuji secara khusus.
- Tidak ada frontend lint command/script di `package.json`; `go vet` dan TypeScript typecheck dijalankan.

## Reproduksi smoke API

Di terminal PowerShell pada `backend/`, server smoke dijalankan dengan port dan database sementara:

```powershell
$env:DB_PATH = Join-Path $env:TEMP 'geotrack-smoke.db'
$env:PORT = '18080'
go run ./cmd/api
```

Di terminal lain, pemeriksaan HTTP memakai `Invoke-RestMethod` dengan urutan `GET /health`, `POST /api/v1/entities`, `GET /api/v1/entities?q=SMK-003`, `PUT /api/v1/entities/:id`, baca ulang query, `DELETE /api/v1/entities/:id`, lalu pastikan GET ID terhapus menghasilkan `404`. Database smoke berada di direktori temp dan tidak termasuk repository. Untuk mengulang, gunakan path database temp baru atau kode entitas berbeda. Untuk unit test dan command lainnya, lihat [README](../README.md#pengujian).

Script PowerShell yang dipakai untuk request dan assertion:

```powershell
$base = 'http://localhost:18080/api/v1/entities'
$health = Invoke-RestMethod -Uri 'http://localhost:18080/health'
$body = '{"code":"SMK-003","name":"Smoke Sensor","category":"iot_device","status":"active","latitude":0,"longitude":0,"description":"runtime smoke"}'
$created = Invoke-RestMethod -Uri $base -Method Post -ContentType 'application/json' -Body $body
$list = Invoke-RestMethod -Uri "${base}?q=SMK-003"
$updateBody = '{"code":"SMK-003","name":"Smoke Sensor","category":"iot_device","status":"active","latitude":-7.2,"longitude":112.6,"description":"runtime smoke"}'
$updated = Invoke-RestMethod -Uri "$base/$($created.data.id)" -Method Put -ContentType 'application/json' -Body $updateBody
$reloaded = Invoke-RestMethod -Uri "${base}?q=SMK-003"
Invoke-RestMethod -Uri "$base/$($created.data.id)" -Method Delete | Out-Null
$notFound = $false
try { Invoke-RestMethod -Uri "$base/$($created.data.id)" } catch { $notFound = $_.Exception.Response.StatusCode.value__ -eq 404 }
if ($health.status -ne 'ok' -or $created.data.latitude -ne 0 -or $created.data.longitude -ne 0 -or $list.data.Count -ne 1 -or $updated.data.latitude -ne -7.2 -or $reloaded.data.Count -ne 1 -or -not $notFound) { throw 'API smoke assertions failed' }
Write-Output "health=$($health.status) create=ok zero=accepted list=$($list.data.Count) update=$($updated.data.latitude) persistence=$($reloaded.data.Count) delete=404-confirmed"
```

Smoke server Vite dijalankan dari `frontend/` memakai `npm run dev -- --host 127.0.0.1 --port 5174`. Request/assertion yang dipakai:

```powershell
$page = Invoke-RestMethod -Uri 'http://127.0.0.1:5174'
if ($page -notmatch 'GeoTrack' -or $page -notmatch '/src/main.tsx') { throw 'Vite dev server smoke failed' }
Write-Output 'Vite dev server served GeoTrack HTML successfully.'
```

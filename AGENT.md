# Alur kerja Agentic AI dan status tinjauan

Dokumen ini mencatat pekerjaan yang benar-benar dilakukan dalam sesi implementasi GeoTrack. Hasil pengujian lengkap ada di [docs/TESTING.md](docs/TESTING.md).

## Workflow

1. Membaca prompt master yang dilampirkan pengguna dan dua spesifikasi sumber: PRD serta Architecture.
2. Memeriksa repository. Saat pekerjaan dimulai, repository belum berisi aplikasi; dua spesifikasi sumber berada di root sebagai file untracked. Pada tahap konsolidasi, informasinya dipindahkan ke `docs/PRD.md` dan `docs/ARCHITECTURE.md`, lalu file root dihapus atas permintaan pengguna.
3. Membuat backend Go/Gin dengan SQLite, frontend React/TypeScript, test, konfigurasi ignore, dan dokumentasi.
4. Menjalankan test, typecheck, build, audit dependency, smoke test API melalui HTTP, serta smoke test server Vite.
5. Setelah permintaan dokumentasi, membaca ulang implementasi aktual dan menulis ulang README serta menambahkan dokumen rinci berbahasa Indonesia. Perubahan pada sesi dokumentasi ini terbatas pada Markdown; source aplikasi tidak diubah.

Alat yang digunakan: pembacaan/pencarian file, patch file, shell PowerShell, Go toolchain, npm, dan HTTP lokal. Tidak ada subagent, browser automation, deployment, push, atau commit.

## Kontribusi AI

- AI menyusun source aplikasi, test, konfigurasi, README, dokumen `docs/`, dan catatan ini berdasarkan prompt dan spesifikasi yang diberikan.
- Dependency diunduh melalui Go modules dan npm sesuai manifest repository.
- Tidak ada kode yang disalin dari repository eksternal.
- Spesifikasi awal menjadi sumber kebutuhan, bukan bukti implementasi atau hasil verifikasi. Salinan root sudah dihapus setelah konten penting digabung ke dokumentasi `docs/`.

## Review manusia

Tidak ada tinjauan atau pengujian manusia yang tercatat dalam sesi ini. Tinjauan manusia dan acceptance test browser masih diperlukan. Jangan menganggap UI, aksesibilitas di browser, marker, tile peta, atau layout responsif telah disetujui manusia.

## Ringkasan hasil verifikasi

- `go test ./...` — passed.
- `go vet ./...` — passed.
- `npm test` — passed, 3 test skema dalam 1 file.
- `npm run typecheck` — passed.
- `npm run build` — passed; Vite mengeluarkan dua peringatan Rollup non-fatal tentang posisi komentar anotasi di dependency Zod v4.
- `npm audit` — passed, 0 vulnerability pada pemeriksaan terakhir.
- Smoke test API lokal — passed untuk health, create koordinat `(0, 0)`, list, update koordinat, baca ulang data, delete, dan `404` setelah delete.
- Smoke test Vite — passed untuk penyajian HTML entry yang memuat identitas GeoTrack dan `/src/main.tsx`; ini bukan test render browser.

Kegagalan percobaan awal dan hal yang belum dites dicatat terpisah di [docs/TESTING.md](docs/TESTING.md). Tidak ada klaim bahwa seluruh acceptance criteria telah lulus.

## Kebijakan pencatatan keputusan

- Sebelum mengambil atau mengusulkan keputusan teknis signifikan, periksa [docs/DECISION.md](docs/DECISION.md) untuk keputusan dan constraint yang sudah ada.
- Tambahkan record baru ke akhir dokumen dengan ID berurutan. Jangan menghapus atau menulis ulang narasi historis.
- Jika keputusan berubah, buat record baru yang menyebut ID keputusan lama dan alasan perubahan. Tambahkan supersession/correction note append-only yang menetapkan status efektif keputusan lama sebagai **Superseded**.
- Untuk setiap record, catat konteks, alternatif yang benar-benar tercatat, keputusan, alasan, dampak, status, tanggal jika terverifikasi, owner (`Human`, `AI-assisted`, atau `Unknown`), evidence, dan evidence level (`Confirmed` atau `Inferred`).
- Bedakan kebutuhan/keputusan Human dari pilihan teknis Agentic AI. Jangan mengarang alasan, tanggal, alternatif, atau reasoning internal; tulis **Tidak terverifikasi** bila bukti tidak tersedia.
- Catat keputusan yang berdampak pada arsitektur, data, kontrak API, keamanan, dependensi utama, atau UX produk. Jangan catat aktivitas rutin dan detail implementasi kecil.
- Perbarui tautan README bila lokasi dokumen berubah. Pastikan perubahan source/docs konsisten dengan [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), lalu verifikasi referensi commit/file sebelum commit.

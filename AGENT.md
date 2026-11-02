# Alur kerja Agentic AI dan status tinjauan

Dokumen ini mencatat pekerjaan yang benar-benar dilakukan dalam sesi implementasi GeoTrack. Hasil pengujian lengkap ada di [docs/TESTING.md](docs/TESTING.md).

## Workflow

1. Membaca prompt master yang dilampirkan pengguna dan dua spesifikasi sumber: PRD serta Architecture.
2. Memeriksa repository. Saat pekerjaan dimulai, repository belum berisi aplikasi; dua spesifikasi sumber berada di root sebagai file untracked. Pada tahap konsolidasi, informasinya dipindahkan ke `docs/PRD.md` dan `docs/ARCHITECTURE.md`, lalu file root dihapus atas permintaan pengguna.
3. Membuat backend Go/Gin dengan SQLite, frontend React/TypeScript, test, konfigurasi ignore, dan dokumentasi.
4. Menjalankan test/vet Go, lint/test/typecheck/build/audit frontend, HTTP API acceptance, dan acceptance UI otomatis di Chrome desktop/mobile.
5. Memperbaiki feedback/retry/loading dan cache invalidation UI; menambah lint, lazy-load halaman kategori, serta pemisahan vendor chunks.
6. Memperbarui toolchain Go dan dependency terkait setelah `govulncheck` menemukan jalur kerentanan yang terjangkau.
7. Menyelaraskan dokumentasi dan menyimpan screenshot browser asli di `docs/assets/`.

Alat yang digunakan: pembacaan/pencarian file, patch file, shell PowerShell, Go toolchain, npm, HTTP lokal, serta Chrome headless melalui Chrome DevTools Protocol. Tidak ada subagent, deployment, push, atau review manusia. Perubahan sesi ini dicatat dalam commit lokal; tidak ada push.

## Kontribusi AI

- AI menyusun source aplikasi, test, konfigurasi, README, dokumen `docs/`, dan catatan ini berdasarkan prompt dan spesifikasi yang diberikan.
- Dependency diunduh melalui Go modules dan npm sesuai manifest repository.
- Tidak ada kode yang disalin dari repository eksternal.
- Spesifikasi awal menjadi sumber kebutuhan, bukan bukti implementasi atau hasil verifikasi. Salinan root sudah dihapus setelah konten penting digabung ke dokumentasi `docs/`.

## Review manusia

Tidak ada tinjauan atau pengujian manusia yang tercatat. Acceptance UI otomatis di Chrome lulus pada cakupan yang dirinci dalam [docs/TESTING.md](docs/TESTING.md), tetapi bukan persetujuan manusia. Keyboard/screen reader, kontras, dan perilaku aksesibilitas belum diverifikasi; jangan klaim compliance.

## Ringkasan hasil verifikasi

- Go `1.26.10`; `go test ./...` dan `go vet ./...` — passed.
- `govulncheck` — 0 vulnerability dengan symbol path yang terjangkau; scanner masih melaporkan 2 package dan 1 module yang tidak terjangkau.
- Frontend ESLint — passed tanpa warning; Vitest 10 test/5 file; typecheck dan production build — passed.
- `npm audit` — 0 vulnerability.
- HTTP API acceptance — entity/category CRUD, validasi/duplikasi, proteksi kategori terpakai, serta persistensi setelah restart — passed.
- Chrome acceptance desktop 1440×1000 dan mobile 390×844 — alur utama lulus; screenshot di `docs/assets/`. Detail cakupan dan batasnya ada di [docs/TESTING.md](docs/TESTING.md).

Warning build Zod dan hal yang belum diuji dicatat di [docs/TESTING.md](docs/TESTING.md). Acceptance test tidak mencakup semua requirement atau menggantikan review manusia.

## Kebijakan pencatatan keputusan

- Sebelum mengambil atau mengusulkan keputusan teknis signifikan, periksa [docs/DECISION.md](docs/DECISION.md) untuk keputusan dan constraint yang sudah ada.
- Tambahkan record baru ke akhir dokumen dengan ID berurutan. Jangan menghapus atau menulis ulang narasi historis.
- Jika keputusan berubah, buat record baru yang menyebut ID keputusan lama dan alasan perubahan. Tambahkan supersession/correction note append-only yang menetapkan status efektif keputusan lama sebagai **Superseded**.
- Untuk setiap record, catat konteks, alternatif yang benar-benar tercatat, keputusan, alasan, dampak, status, tanggal jika terverifikasi, owner (`Human`, `AI-assisted`, atau `Unknown`), evidence, dan evidence level (`Confirmed` atau `Inferred`).
- Bedakan kebutuhan/keputusan Human dari pilihan teknis Agentic AI. Jangan mengarang alasan, tanggal, alternatif, atau reasoning internal; tulis **Tidak terverifikasi** bila bukti tidak tersedia.
- Catat keputusan yang berdampak pada arsitektur, data, kontrak API, keamanan, dependensi utama, atau UX produk. Jangan catat aktivitas rutin dan detail implementasi kecil.
- Perbarui tautan README bila lokasi dokumen berubah. Pastikan perubahan source/docs konsisten dengan [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), lalu verifikasi referensi commit/file sebelum commit.

## Design system UI/UX

- Sebelum mengubah UI/UX, baca [docs/DESIGN.md](docs/DESIGN.md) dan periksa implementasi aktual di `frontend/src/`.
- Jika perubahan UI mengubah token, typography, komponen, layout, responsive behavior, map visual, atau accessibility pattern, perbarui `docs/DESIGN.md` dalam perubahan yang sama.
- Bedakan implementasi saat ini dari rekomendasi/improvement opportunity. Jangan klaim browser behavior, contrast, atau accessibility telah diverifikasi tanpa test; rujuk [docs/TESTING.md](docs/TESTING.md).
- Hindari duplikasi: stack/alur teknis ada di [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), decision history di [docs/DECISION.md](docs/DECISION.md), dan visual contract di `docs/DESIGN.md`.

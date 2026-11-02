# Riwayat keputusan pengembangan GeoTrack

Dokumen ini merekonstruksi keputusan teknis dan produk dari bukti repository yang tersedia. Ini bukan transkrip lengkap percakapan dan tidak mengklaim mengetahui alasan yang tidak tercatat.

## Metode dan batas bukti

- Riwayat Git yang tersedia saat rekonstruksi berisi empat commit sampai `38f01d6`; commit pertama adalah root commit. `git log`, metadata/isi `git show`, dan perubahan antar-commit diperiksa.
- Sumber lain: `README.md`, `AGENT.md`, seluruh dokumen di `docs/`, manifest/config frontend dan backend, schema SQLite, implementasi, serta test.
- `AGENT.md` menyatakan spesifikasi PRD dan Architecture awal diberikan sebelum implementasi, lalu dikonsolidasikan ke `docs/`. File sumber spesifikasi awal dan ekspor log Agentic AI tidak ada di repository.
- Konteks percakapan sesi ini tersedia sebagai ringkasan/checkpoint, bukan arsip yang dapat dicari atau dikutip sebagai file. Karena itu tanggal/alasan yang tidak muncul eksplisit ditandai **Tidak terverifikasi**.
- Tanggal commit membuktikan kapan perubahan pertama kali tercatat, bukan selalu kapan keputusan dibuat.
- **Confirmed**: pilihan atau persyaratan terlihat langsung pada spesifikasi, commit, test, atau dokumentasi. **Inferred**: implementasi menunjukkan pilihan, tetapi proses pemilihan atau alasannya tidak tercatat langsung.

## Timeline dan decision records

### 1. Kebutuhan awal dan lingkup

#### DEC-001 — GeoTrack mengelola lokasi tersimpan, bukan pelacakan langsung

- **Tanggal keputusan:** Tidak terverifikasi; spesifikasi awal mendahului commit implementasi pertama.
- **Konteks:** Produk perlu mengelola aset/lokasi geografis. Batas antara lokasi tersimpan dan posisi bergerak penting agar scope tidak mengimplikasikan GPS real-time.
- **Alternatif yang tercatat:** Live GPS, telemetry, WebSocket, dan riwayat perjalanan secara eksplisit diletakkan di luar lingkup; perbandingan atau evaluasi teknis alternatif tidak tercatat.
- **Keputusan:** Batasi produk pada CRUD entitas dengan koordinat tetap dan tampilan peta.
- **Alasan:** Sesuai tujuan PRD; aplikasi menyimpan koordinat, bukan mengumpulkan posisi bergerak.
- **Dampak:** API, database, dan marker merepresentasikan posisi tersimpan. Tidak ada pipeline telemetry atau update lokasi real-time.
- **Status:** Accepted.
- **Pemilik keputusan:** Human.
- **Bukti:** `docs/PRD.md` bagian Tujuan dan Di luar lingkup; `docs/LIMITATIONS.md`; `AGENT.md` bagian Workflow.
- **Tingkat bukti:** Confirmed.

### 2–7. Implementasi awal: stack, model data, API, peta, dan antarmuka

Keputusan berikut pertama terlihat pada commit root `32fe06a` (`2026-11-02 18:04:14 +07:00`). Tanggal keputusan persis tidak terpisah dari waktu implementasi.

#### DEC-002 — Stack aplikasi lokal Go, React, dan SQLite

- **Tanggal keputusan:** Tidak terverifikasi; stack sudah ada pada commit `32fe06a` tanggal `2026-11-02`.
- **Konteks:** Aplikasi memerlukan UI interaktif, API backend, dan persistensi lokal untuk satu domain.
- **Alternatif yang tercatat:** Tidak tercatat. Docker, API key peta, dan server database terpisah dinyatakan tidak diperlukan, tetapi tidak ada evaluasi komparatif.
- **Keputusan:** Gunakan React 18, TypeScript, Vite, Go/Gin, dan SQLite melalui `database/sql` dengan driver `modernc.org/sqlite` tanpa CGO.
- **Alasan:** Architecture menyebut stack frontend berasal dari spesifikasi; SQLite/driver pure-Go menghindari server DB terpisah dan kebutuhan CGO.
- **Dampak:** Sistem dapat dijalankan lokal dengan proses frontend/backend dan file SQLite; versi dependency dikunci pada manifest.
- **Status:** Accepted.
- **Pemilik keputusan:** Human untuk stack yang berasal dari spesifikasi; implementasi dibantu AI.
- **Bukti:** `32fe06a`; `backend/go.mod`; `frontend/package.json`; `docs/ARCHITECTURE.md` bagian Stack aktual dan Konfigurasi runtime.
- **Tingkat bukti:** Confirmed.

#### DEC-003 — Entity menggunakan UUID dan constraint SQLite

- **Tanggal keputusan:** Tidak terverifikasi; implementasi pertama terlihat pada `32fe06a` tanggal `2026-11-02`.
- **Konteks:** Entity memerlukan identitas stabil, kode unik, status terkendali, koordinat geografis valid, dan timestamp server.
- **Alternatif yang tercatat:** Format ID selain UUID dan penyimpanan selain SQLite tidak tercatat.
- **Keputusan:** Buat UUID v4 di backend; simpan kode dengan unique `NOCASE`, status dengan `CHECK`, koordinat dengan rentang `-90..90` dan `-180..180`, serta timestamp UTC RFC3339Nano.
- **Alasan:** Constraint DB menjadi perlindungan tambahan terhadap data invalid; UUID dibuat server sehingga client tidak memasok ID. Alasan historis memilih UUID tidak tercatat.
- **Dampak:** Entity CRUD memakai ID server-generated; koordinat `(0, 0)` tetap valid.
- **Status:** Accepted.
- **Pemilik keputusan:** AI-assisted.
- **Bukti:** `32fe06a`; `backend/internal/entity/model.go`; `backend/internal/database/schema.sql`; `docs/DATABASE.md` bagian Skema aktual.
- **Tingkat bukti:** Confirmed.

#### DEC-004 — Kategori awal dibatasi ke tiga string tetap

- **Tanggal keputusan:** Tidak terverifikasi; schema awal tercatat pada `32fe06a` tanggal `2026-11-02`.
- **Konteks:** Versi awal mendukung Vehicle, IoT Device, dan Facility tanpa tabel kategori tersendiri.
- **Alternatif yang tercatat:** Entitas kategori relasional tidak tercatat di keputusan awal.
- **Keputusan:** Simpan `category` langsung pada entity dan batasi dengan `CHECK`/validasi ke `vehicle`, `iot_device`, dan `facility`.
- **Alasan:** Sesuai tiga kategori pada scope awal dan menjaga model awal tetap kecil; alasan eksplisit untuk memilih enum dibanding tabel kategori tidak tercatat.
- **Dampak:** Nama kategori bukan data terkelola dan penambahan kategori memerlukan perubahan schema/API/client. Pilihan ini kemudian diganti oleh DEC-015.
- **Status:** Superseded oleh DEC-015.
- **Pemilik keputusan:** AI-assisted.
- **Bukti:** `32fe06a`; `backend/internal/database/schema.sql`; `backend/internal/entity/validation.go`; `frontend/src/features/entities/types.ts`; `docs/PRD.md` bagian Lingkup data.
- **Tingkat bukti:** Confirmed.

#### DEC-005 — Backend menyediakan REST JSON CRUD dengan handler dan repository

- **Tanggal keputusan:** Tidak terverifikasi; implementasi pertama terlihat pada `32fe06a` tanggal `2026-11-02`.
- **Konteks:** UI memerlukan operasi persist CRUD yang konsisten dan dapat diuji terpisah dari browser.
- **Alternatif yang tercatat:** GraphQL, RPC, dan lapisan service tambahan tidak tercatat sebagai alternatif yang dievaluasi.
- **Keputusan:** Gunakan endpoint REST JSON `/api/v1/entities`, handler Gin, repository `database/sql`, envelope `data`/`error`, dan status HTTP yang sesuai operasi.
- **Alasan:** Kontrak menyediakan CRUD/filter; PRD secara eksplisit memilih struktur kecil dengan handler yang memanggil repository langsung tanpa service layer. Alasan historis memilih REST dibanding protokol lain tidak tercatat.
- **Dampak:** Client menggunakan HTTP/JSON; error DB internal tidak dikirim sebagai detail ke client.
- **Status:** Accepted.
- **Pemilik keputusan:** AI-assisted.
- **Bukti:** `32fe06a`; `backend/internal/entity/handler.go`; `backend/internal/entity/repository.go`; `backend/internal/httpserver/server.go`; `docs/API.md`; `docs/PRD.md` bagian Kebutuhan non-fungsional.
- **Tingkat bukti:** Confirmed.

#### DEC-006 — Validasi backend otoritatif, validasi client membantu pengguna

- **Tanggal keputusan:** Tidak terverifikasi; implementasi pertama terlihat pada `32fe06a` tanggal `2026-11-02`.
- **Konteks:** Data dapat dikirim langsung ke API sehingga validasi UI saja tidak cukup. Koordinat nol tidak boleh dianggap kosong.
- **Alternatif yang tercatat:** Tidak tercatat.
- **Keputusan:** Validasi form dengan Zod dan validasi ulang di Go; backend menolak field asing/JSON malformed, menerapkan batas field, dan menerima koordinat nol.
- **Alasan:** Backend tetap menjadi trust boundary; batas koordinat geografis dan required fields harus terjaga meski client dilewati.
- **Dampak:** Error field dapat dikembalikan API dan dipetakan ke form; `(0, 0)` tetap sah.
- **Status:** Accepted.
- **Pemilik keputusan:** Human untuk persyaratan validasi dan koordinat; implementasi dibantu AI.
- **Bukti:** `32fe06a`; `backend/internal/entity/validation.go`; `backend/internal/entity/handler.go`; `frontend/src/features/entities/schema.ts`; `frontend/src/features/entities/schema.test.ts`; `backend/internal/entity/handler_test.go`; `docs/API.md` bagian Validasi.
- **Tingkat bukti:** Confirmed.

#### DEC-007 — Peta memakai React Leaflet dan tile OpenStreetMap

- **Tanggal keputusan:** Tidak terverifikasi; implementasi pertama terlihat pada `32fe06a` tanggal `2026-11-02`.
- **Konteks:** Entity berkoordinat perlu divisualisasikan dan dipilih pada peta.
- **Alternatif yang tercatat:** Paid map service disebut sebagai di luar lingkup; perbandingan provider atau evaluasi kebijakan tile tidak tercatat.
- **Keputusan:** Gunakan React Leaflet/Leaflet dengan tile publik OpenStreetMap, attribution, marker kategori/status, dan map picker eksplisit.
- **Alasan:** Peta dapat digunakan tanpa API key berbayar; picker hanya mengubah form setelah diaktifkan.
- **Dampak:** Penggunaan tile memerlukan internet dan endpoint publik tidak ditujukan untuk traffic produksi besar. Ketersediaan tile belum dibuktikan lewat browser.
- **Status:** Accepted.
- **Pemilik keputusan:** Human untuk kebutuhan peta; integrasi dibantu AI.
- **Bukti:** `32fe06a`; `frontend/src/features/map/EntityMap.tsx`; `frontend/src/App.tsx`; `docs/ARCHITECTURE.md` bagian Peta dan koordinat; `docs/LIMITATIONS.md`.
- **Tingkat bukti:** Confirmed.

#### DEC-008 — Data server dicache dengan TanStack Query; state interaksi tetap lokal

- **Tanggal keputusan:** Tidak terverifikasi; implementasi pertama terlihat pada `32fe06a` tanggal `2026-11-02`.
- **Konteks:** Daftar dan marker perlu mencerminkan query entity yang sama, sementara pilihan/edit/picker bersifat sementara.
- **Alternatif yang tercatat:** Store global dan router client tidak digunakan; catatan evaluasi alternatif tidak tersedia.
- **Keputusan:** Gunakan TanStack Query untuk API/cache dan invalidasi setelah write; React state lokal untuk selection/form/picker; React Hook Form dan Zod untuk form.
- **Alasan:** **Tidak terverifikasi.** Kode dan Architecture menunjukkan pemisahan cache server dari state UI, tetapi tidak tersedia catatan deliberasi atau perbandingan library.
- **Dampak:** Daftar dan marker memakai hasil filter yang sama; write sukses menginvalidasi cache. Tidak ada state store atau routing tambahan.
- **Status:** Accepted.
- **Pemilik keputusan:** AI-assisted.
- **Bukti:** `32fe06a`; `frontend/src/main.tsx`; `frontend/src/App.tsx`; `frontend/src/features/entities/api.ts`; `docs/ARCHITECTURE.md` bagian Stack aktual dan Alur frontend.
- **Tingkat bukti:** Inferred.

#### DEC-009 — Satu koneksi SQLite untuk serialisasi write

- **Tanggal keputusan:** Tidak terverifikasi; implementasi pertama terlihat pada `32fe06a` tanggal `2026-11-02`.
- **Konteks:** SQLite lokal perlu menangani operasi write tanpa menambah konfigurasi concurrency khusus.
- **Alternatif yang tercatat:** Menambah koneksi untuk throughput read disebut sebagai opsi bila kebutuhan throughput muncul; angka benchmark tidak tercatat.
- **Keputusan:** Batasi `database/sql` ke satu koneksi dan set `busy_timeout=5000`.
- **Alasan:** Komentar kode menyebut satu koneksi menyerialisasi write SQLite.
- **Dampak:** Model akses lebih sederhana, tetapi throughput read dibatasi dan belum diukur.
- **Status:** Accepted.
- **Pemilik keputusan:** AI-assisted.
- **Bukti:** `32fe06a`; `backend/internal/database/database.go`; `docs/DATABASE.md` bagian Akses database; `docs/ARCHITECTURE.md` bagian Keputusan dan konsekuensi.
- **Tingkat bukti:** Confirmed.

#### DEC-010 — Dokumen sumber dikonsolidasikan di `docs/`

- **Tanggal keputusan:** Tidak terverifikasi; struktur konsolidasi pertama terlihat pada `32fe06a` tanggal `2026-11-02`.
- **Konteks:** PRD dan Architecture awal ada sebagai file sumber di root; salinan ganda berisiko membingungkan.
- **Alternatif yang tercatat:** Menyimpan salinan di root sekaligus `docs/` ditolak sebagai duplikasi atas permintaan pengguna.
- **Keputusan:** Gabungkan spesifikasi ke `docs/PRD.md` dan `docs/ARCHITECTURE.md`, lalu hapus salinan root.
- **Alasan:** `AGENT.md` dan `README.md` secara eksplisit mencatat permintaan konsolidasi untuk menghindari dokumentasi ganda.
- **Dampak:** `docs/` menjadi lokasi dokumentasi proyek; PRD membedakan implementasi di source dari perilaku yang benar-benar diuji.
- **Status:** Accepted.
- **Pemilik keputusan:** Human.
- **Bukti:** `32fe06a`; `AGENT.md` bagian Workflow; `README.md` bagian Dokumentasi; `docs/PRD.md` paragraf pembuka; `docs/TESTING.md`.
- **Tingkat bukti:** Confirmed.

### 8–10. Pengembangan, UI, testing, dan dokumentasi lanjutan

#### DEC-011 — Root menyediakan satu command development dengan pemeriksaan prasyarat

- **Tanggal keputusan:** Tidak terverifikasi; implementasi tercatat pada commit `bc706af` tanggal `2026-11-02 18:16:14 +07:00`.
- **Konteks:** Menjalankan frontend dan backend lokal memerlukan dua proses beserta dependency masing-masing.
- **Alternatif yang tercatat:** Menjalankan command dari masing-masing subproject tetap tersedia; alasan alternatif itu tidak dijadikan alur utama tidak tercatat.
- **Keputusan:** Tambahkan `npm run dev` di root untuk menjalankan dua proses bersama dan `predev` untuk memeriksa prasyarat.
- **Alasan:** Commit memperkenalkan command development terpadu; `scripts/check-dev-prereqs.cjs` memberi pesan bila tool/dependency belum tersedia.
- **Dampak:** Setup lokal lebih mudah diulang, tetapi dependency root menjadi tambahan.
- **Status:** Accepted.
- **Pemilik keputusan:** AI-assisted.
- **Bukti:** `bc706af`; `package.json`; `scripts/check-dev-prereqs.cjs`; `README.md` bagian Mulai cepat.
- **Tingkat bukti:** Confirmed.

#### DEC-012 — Workspace dirancang ulang agar daftar dan peta tetap berdampingan

- **Tanggal keputusan:** Tidak terverifikasi; perubahan UI tercatat pada commit `64c3de8` tanggal `2026-11-02 18:59:54 +07:00`.
- **Konteks:** Pengguna perlu menelusuri list dan lokasi geografis dalam workspace yang sama.
- **Alternatif yang tercatat:** Commit menunjukkan perubahan layout sebelumnya, tetapi tidak ada catatan perbandingan layout atau alasan desain rinci.
- **Keputusan:** Pertahankan panel entity dan peta dalam split view desktop; gunakan kontrol view responsif di layar kecil dan detail panel terpilih.
- **Alasan:** **Tidak terverifikasi** untuk rincian redesign. Kebutuhan mempertahankan split-view tercantum pada instruksi pengguna; alasan detail layout tidak tercatat.
- **Dampak:** Selection list/marker dan tampilan detail disatukan dengan workspace peta; layout kecil menggunakan mode responsif.
- **Status:** Accepted.
- **Pemilik keputusan:** AI-assisted, berdasarkan kebutuhan UI yang diberikan Human.
- **Bukti:** `64c3de8`; `frontend/src/App.tsx`; `frontend/src/features/map/EntityMap.tsx`; `frontend/src/styles.css`; instruksi UI/UX pada konteks percakapan sesi.
- **Tingkat bukti:** Inferred.

#### DEC-013 — Form entity dan dialog diperbaiki tanpa UI framework tambahan

- **Tanggal keputusan:** Tidak terverifikasi; perubahan tercatat pada commit `38f01d6` tanggal `2026-11-02 19:00:06 +07:00`.
- **Konteks:** Form create/edit dan dialog delete perlu memberi feedback field, loading state, dan pemilihan koordinat yang jelas.
- **Alternatif yang tercatat:** Architecture menyatakan native `<dialog>` dipakai dan shadcn/ui/Radix tidak ditambahkan; tidak ada perbandingan library lain.
- **Keputusan:** Pertahankan native dialog, React Hook Form/Zod, validasi per-field, loading state, dan map picker yang diaktifkan eksplisit.
- **Alasan:** **Tidak terverifikasi** untuk detail perubahan pada commit; catatan Architecture menyebut native dialog cukup dan tidak ada UI library tambahan.
- **Dampak:** Dependency UI tetap kecil; struktur dialog/form harus menangani focus dan aksesibilitas native yang belum diuji browser.
- **Status:** Accepted.
- **Pemilik keputusan:** AI-assisted.
- **Bukti:** `38f01d6`; `frontend/src/components/Modal.tsx`; `frontend/src/features/entities/EntityForm.tsx`; `docs/ARCHITECTURE.md` bagian Stack aktual; `docs/TESTING.md`.
- **Tingkat bukti:** Inferred.

#### DEC-014 — Plus Jakarta Sans dan skala typography konsisten

- **Tanggal keputusan:** `2026-11-02` berdasarkan konteks percakapan sesi; waktu persis tidak terverifikasi.
- **Konteks:** Typography awal tidak konsisten dengan ukuran teks kecil; brief meminta keterbacaan konsisten di seluruh komponen.
- **Alternatif yang tercatat:** Tidak tercatat. Brief secara langsung menetapkan Plus Jakarta Sans.
- **Keputusan:** Gunakan Plus Jakarta Sans global; target ukuran page title 24px, section heading 18px, entity title 15px, body/input/button/sidebar 14px, secondary 13px, caption minimal 12px.
- **Alasan:** Persyaratan visual eksplisit dari pengguna, termasuk kontras, responsive, dan pencegahan overflow.
- **Dampak:** Font dimuat dari Google Fonts; token typography dipakai di stylesheet. Implementasi stylesheet masih merupakan perubahan working tree yang belum masuk commit saat dokumen ini disusun, sehingga hasil visual belum terverifikasi.
- **Status:** Accepted.
- **Pemilik keputusan:** Human.
- **Bukti:** Instruksi typography pada konteks percakapan sesi; working tree `frontend/index.html` dan `frontend/src/styles.css` (belum di-commit); commit UI awal `64c3de8` memakai stack font sebelumnya.
- **Tingkat bukti:** Confirmed.

#### DEC-015 — Kategori menjadi data terkelola dengan ID stabil dan migrasi kompatibel

- **Tanggal keputusan:** `2026-11-02` berdasarkan ringkasan checkpoint percakapan sesi; waktu persis tidak terverifikasi.
- **Konteks:** Kategori hardcoded menghambat CRUD kategori; rename tidak boleh memutus relasi entity existing.
- **Alternatif yang tercatat:** Menjadikan nama kategori sebagai identitas relasional secara eksplisit ditolak dalam instruksi pengguna. Tabel relasional dengan UUID dipilih; opsi relasi lain tidak tercatat.
- **Keputusan:** Gunakan UUID category ID dan `entities.category_id` foreign key dengan `ON DELETE RESTRICT`; pertahankan `category` lama sebagai alias API; jaga legacy key bawaan `vehicle`, `iot_device`, `facility`; migrasikan data lama tanpa kehilangan entity. Kategori menyediakan name, description opsional, icon allowlist Lucide, dan warna palette.
- **Alasan:** ID tetap tidak berubah saat rename; foreign key melindungi entity dari penghapusan kategori yang sedang dipakai; alias mengurangi risiko memutus client/API lama.
- **Dampak:** Membutuhkan migration SQLite, API kategori, validasi relasi, dan integrasi UI form/filter/map secara dinamis. **Implementasi belum selesai atau terverifikasi pada snapshot ini:** perubahan backend kategori/schema masih uncommitted, UI kategori dinamis belum terintegrasi, dan `go test ./...` pada working tree gagal (index `idx_entities_status` hilang setelah migrasi; filter legacy `category` menghasilkan `500`). Jangan anggap CRUD kategori sudah shipped.
- **Status:** Accepted; implementasi in progress.
- **Pemilik keputusan:** AI-assisted untuk rancangan UUID/FK dan kompatibilitas, berdasarkan persyaratan Human.
- **Bukti:** Instruksi Category Management dan ringkasan checkpoint percakapan sesi; working tree `backend/internal/category/`, `backend/internal/database/database.go`, `backend/internal/database/schema.sql`, `backend/internal/entity/`, dan `backend/internal/httpserver/server.go` (belum di-commit); kegagalan `go test ./...` tercatat pada sesi ini.
- **Tingkat bukti:** Confirmed untuk persyaratan dan pilihan desain; implementasi belum terkonfirmasi.

## Catatan konsistensi snapshot

`docs/ARCHITECTURE.md`, `docs/API.md`, dan `docs/DATABASE.md` menggambarkan baseline yang telah di-commit sebelum DEC-014 dan DEC-015. Saat dokumen ini ditulis, typography/category changes masih ada di working tree dan tidak termasuk commit dokumentasi ini. Setelah implementasi kategori selesai dan diverifikasi, update Architecture/API/Database/User Guide/Testing agar mencerminkan keadaan aktual; jangan dokumentasikan fitur sebagai selesai sebelum test lulus.

`AGENT.md` mencatat kontribusi AI dan batas verifikasi dari sesi implementasi terdahulu. Tidak ada ekspor riwayat Agentic AI di repository; konteks percakapan yang tersedia tidak membuktikan review manusia.

## Kebijakan pencatatan keputusan berikutnya


## 8. Penyelesaian kategori dan customization visual

#### DEC-016 — Icon kategori dan marker peta memakai allowlist terkurasi

- **Tanggal keputusan:** `2026-11-02`, berdasarkan konteks sesi implementasi.
- **Konteks:** DEC-015 menetapkan relasi kategori stabil, tetapi icon, warna, dan bentuk map marker perlu konsisten di picker, entity UI, legend, dan Leaflet. Catatan DEC-015 merekam implementasi masih in progress pada snapshot terdahulu.
- **Alternatif yang tercatat:** Pengguna meminta `lucide-react` diprioritaskan jika tersedia, melarang arbitrary SVG/HTML, dan meminta tidak menambah icon library tanpa kebutuhan. Evaluasi pustaka/format lain tidak tercatat.
- **Keputusan:** Pakai 24 key Lucide terkurasi dalam grup Vehicle/IoT/Facility/General, 8 key warna preset, dan marker style `pin`, `circle`, `rounded-square`. Simpan key stabil di DB/API. Render `DivIcon` dari komponen Lucide allowlisted; fallback metadata unknown ke icon/warna/bentuk aman. Pertahankan tiga kategori bawaan dan tolak delete bawaan maupun kategori yang masih dipakai entity.
- **Alasan:** Memenuhi kustomisasi tanpa dependency/icon markup dari user; key stabil menjaga rendering konsisten dan aman. Perlindungan kategori bawaan mempertahankan baseline produk.
- **Dampak:** Frontend registry dipakai picker/list/detail/marker/legend; backend memvalidasi allowlist terpisah sebagai trust boundary. Perubahan kategori menginvalidasi cache entity supaya marker ikut berubah. DEC-015 tetap catatan desain; implementasinya kini selesai untuk source yang diverifikasi.
- **Status:** Accepted.
- **Pemilik keputusan:** Human untuk kebutuhan produk dan batas aman; AI-assisted untuk susunan katalog, preset, fallback, dan integrasi.
- **Bukti:** Instruksi implementasi sesi `2026-11-02`; `frontend/src/features/categories/icons.tsx`; `frontend/src/features/map/marker.ts`; `backend/internal/category/model.go`; `backend/internal/category/handler_test.go`; `frontend/src/features/categories/icons.test.ts`; `docs/TESTING.md`.
- **Tingkat bukti:** Confirmed.

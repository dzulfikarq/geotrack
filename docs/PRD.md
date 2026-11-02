# PRD — GeoTrack

## Tujuan

GeoTrack adalah aplikasi lokal untuk mencatat, menemukan, dan mengelola entitas yang mempunyai lokasi geografis. Fokus produk adalah CRUD yang tersimpan di backend dan peta yang menampilkan koordinat tersimpan; aplikasi tidak menerima atau mensimulasikan GPS real-time.

Dokumen ini menggabungkan kebutuhan dari spesifikasi PRD sumber dengan kondisi kode repository. Spesifikasi sumber telah dipindahkan ke dokumen ini agar tidak ada salinan root yang membingungkan. Status implementasi dan cakupan acceptance Chrome otomatis tercatat di [TESTING.md](TESTING.md); acceptance otomatis bukan review manusia.

## Konteks take-home

Spesifikasi sumber menyebut take-home test Software Developer di PT Len Innovation Technology dan target pengumpulan Rabu, 4 November 2026 sebelum pukul 10.00 WIB. Undangan resmi menjadi acuan tenggat. Informasi ini adalah konteks tugas, bukan status atau kemampuan aplikasi.

## Pengguna dan kebutuhan

Pengguna sasaran adalah operator yang mengelola aset/lokasi. Pengguna perlu:

1. Melihat daftar dan marker dari data backend yang sama.
2. Menemukan entitas dengan pencarian dan filter kategori/status.
3. Membuka detail dari baris daftar atau marker.
4. Membuat, mengedit, dan menghapus entitas dengan validasi.
5. Menyimpan perubahan secara persisten di SQLite.

## Lingkup data

Entitas memiliki kode, nama, kategori, status, latitude, longitude, deskripsi opsional, ID, dan timestamp. Kategori: `vehicle`, `iot_device`, `facility`. Status: `active`, `inactive`, `maintenance`. Aturan lengkap ada di [API.md](API.md#validasi) dan [DATABASE.md](DATABASE.md#skema-aktual).

## Antarmuka dan perilaku yang diminta

Halaman utama adalah Map Explorer (`/`) dengan sidebar ringkas, panel daftar/filter, dan peta dominan. Arah visual sumber menggunakan latar terang hangat, border tipis, aksen oranye, jarak ringkas, dan teks terbaca. Sidebar hanya memuat navigasi Map Explorer yang berfungsi; tidak ada menu Live/History dekoratif. Header menampilkan jumlah hasil yang terlihat dan tombol **Add entity**.

Peta memakai OpenStreetMap dengan attribution, zoom/pan, marker berdasarkan kategori/status, popup dan seleksi yang tersinkron dengan baris daftar. Detail memuat data yang ditampilkan aplikasi serta aksi edit/delete; UUID tersedia melalui API tetapi saat ini tidak ditampilkan di panel detail. Form create/edit mendukung input angka dan map picker eksplisit. Klik peta tidak mengubah koordinat sebelum picker diaktifkan. Delete harus dikonfirmasi. Loading, error/retry, empty state, kesalahan field, dan pesan sukses tersedia dalam source. Semua tombol/menu yang ditampilkan ditujukan untuk aksi nyata; tidak ada menu Live/History palsu.

Layout desktop membagi sidebar, panel daftar, dan peta; CSS juga menyediakan susunan responsif. Acceptance Chrome memeriksa layout desktop dan lebar 390px. Screenshot acceptance tersedia di `assets/`; screenshot tersebut bukti tampilan implementasi, bukan referensi desain sumber. Keyboard, screen reader, dan kontras belum diaudit.

## Kebutuhan fungsional dan status

| ID | Kebutuhan | Status di source | Bukti / batas verifikasi |
|---|---|---|---|
| FR-01 | Muat data dari API dan tampilkan daftar serta marker dari hasil filter yang sama; peta tetap bisa dinavigasi tanpa data. | Diimplementasikan. | API, Leaflet markers, map interaction, dan OSM tiles tampil pada acceptance Chrome. |
| FR-02 | Form create, validasi client/server, simpan lalu tampilkan entitas. | Diimplementasikan. | Browser memeriksa client validation, server duplicate error, create, dan update; HTTP acceptance mencakup koordinat `(0,0)`. |
| FR-03 | Buka detail dari baris maupun marker. | Diimplementasikan; panel tidak menampilkan UUID internal. | Detail dibuka dari marker dan baris pada Chrome. Field yang terlihat tercantum di [panduan pengguna](USER_GUIDE.md#2-lihat-dan-temukan-entitas). |
| FR-04 | Edit atribut/koordinat dan simpan perubahan; data bertahan setelah reload. | Diimplementasikan. | Browser memeriksa picker, edit, dan reload entity; HTTP acceptance memeriksa persistensi entity/category setelah API restart. |
| FR-05 | Konfirmasi delete dan tampilkan hasil API dengan benar. | Diimplementasikan. | Browser memeriksa cancel dan confirm entity/category delete; HTTP acceptance memeriksa status `204/404` dan proteksi kategori terpakai. |
| FR-06 | Validasi field dan error API yang konsisten; koordinat nol sah. | Diimplementasikan di Zod dan Go. | Acceptance mencakup invalid form/API input, duplicate category/entity, kategori in-use, dan koordinat nol. Tidak setiap batas diuji. |
| FR-07 | Cari berdasarkan kode/nama dan gabungkan filter kategori/status; clear mengembalikan semua hasil. | Diimplementasikan di endpoint dan UI. | Backend dan Chrome memeriksa search, filter gabungan, clear, empty state, serta pagination entity. Pencarian case-insensitive mengikuti batas ASCII SQLite. |
| FR-08 | Feedback loading/error/empty/success dan layout responsif. | Diimplementasikan. | Chrome memeriksa loading, simulated `503`/retry, empty state, mutation feedback, serta layout 390px tanpa horizontal overflow. Aksesibilitas belum diaudit. |

Status tersebut menjelaskan implementasi dan bukti, bukan sertifikasi bahwa acceptance test produk telah tuntas.

## Kebutuhan non-fungsional

- Backend menjadi otoritas validasi, ID, timestamp, dan persistensi.
- SQL menggunakan parameter; tabel mempunyai constraint kategori, status, kode unik, dan rentang koordinat.
- Tidak memerlukan Docker atau API key peta untuk menjalankan lokal.
- Gunakan HTML berlabel/semantik, focus yang terlihat, dan form/dialog yang bisa dioperasikan keyboard; elemen ada di source, tetapi keyboard, screen reader, dan kontras belum diaudit.
- Struktur dijaga kecil untuk satu domain entitas; handler memanggil repository langsung, tanpa lapisan service tambahan.
- Tile publik OpenStreetMap dipakai dengan attribution; layanan tile publik bukan target produksi berskala besar.
- Konfigurasi rahasia/database lokal tidak dimasukkan ke repository melalui `.gitignore`.
- Brief pengumpulan juga mengharuskan instruksi setup, alasan pemilihan library, catatan penggunaan AI, unfinished features, serta source/config di Git. Dokumen tersedia; perubahan sesi ini di-commit lokal tanpa push. Submission tetap tanggung jawab pengguna.

## Prioritas dari spesifikasi sumber

- **P0:** backend/database, frontend, CRUD, peta/detail, validasi dua sisi, README, dan AGENT.md. Kode serta alur utama diverifikasi dengan test otomatis dan acceptance Chrome; review manusia belum tercatat.
- **P1:** pencarian/filter, picker, responsive refinement, feedback state, seed, dan test. Alur utama diuji; accessibility audit, platform Linux/macOS, concurrency, dan recovery khusus masih terbuka.
- **P2:** animasi/dekorasi tambahan; tidak menjadi target.

Status summary disebut sebagai pilihan tambahan di spesifikasi sumber, bukan kebutuhan wajib dan belum tersedia. Header saat ini hanya menunjukkan jumlah hasil query.

## Di luar lingkup

Autentikasi/otorisasi, user role/organisasi, live GPS, telemetry, WebSocket, marker bergerak, riwayat perjalanan, routing/dispatch, jadwal maintenance, geocoding/reverse geocoding, upload, analitik, paid map service, dan deployment tidak dibuat. Rincian status dan konsekuensi: [LIMITATIONS.md](LIMITATIONS.md).

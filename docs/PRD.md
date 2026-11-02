# PRD — GeoTrack

## Tujuan

GeoTrack adalah aplikasi lokal untuk mencatat, menemukan, dan mengelola entitas yang mempunyai lokasi geografis. Fokus produk adalah CRUD yang tersimpan di backend dan peta yang menampilkan koordinat tersimpan; aplikasi tidak menerima atau mensimulasikan GPS real-time.

Dokumen ini menggabungkan kebutuhan dari spesifikasi PRD sumber dengan kondisi kode repository. Spesifikasi sumber telah dipindahkan ke dokumen ini agar tidak ada salinan root yang membingungkan. Keberadaan fitur di source tidak berarti perilakunya sudah lolos pengujian browser. Lihat [TESTING.md](TESTING.md) untuk bukti yang benar-benar dijalankan.

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

Layout desktop membagi sidebar, panel daftar, dan peta; CSS juga menyediakan susunan responsif. Perilaku visual/aksesibilitas tidak dianggap terverifikasi karena belum ada pengujian browser. Screenshot referensi visual tidak terdapat di repository saat implementasi; acuan visual yang tersedia adalah deskripsi teks.

## Kebutuhan fungsional dan status

| ID | Kebutuhan | Status di source | Bukti / batas verifikasi |
|---|---|---|---|
| FR-01 | Muat data dari API dan tampilkan daftar serta marker dari hasil filter yang sama; peta tetap bisa dinavigasi tanpa data. | Diimplementasikan. | List API diuji; health diuji lewat smoke test. Render marker, tile, dan navigasi peta belum diuji di browser. |
| FR-02 | Form create, validasi client/server, simpan lalu tampilkan entitas. | Diimplementasikan. | API create dan skema client diuji terpisah; alur form browser belum diuji. |
| FR-03 | Buka detail dari baris maupun marker. | Alur tersedia; panel tidak menampilkan UUID internal. | Belum diuji melalui browser. Field yang terlihat tercantum di [panduan pengguna](USER_GUIDE.md#2-lihat-dan-temukan-entitas). |
| FR-04 | Edit atribut/koordinat dan simpan perubahan; data bertahan setelah reload. | Diimplementasikan. | API update dan baca ulang/persistensi DB diuji; reload browser dan perpindahan marker belum diuji. |
| FR-05 | Konfirmasi delete dan tampilkan hasil API dengan benar. | Dialog serta API diimplementasikan. | API delete diuji; cancel/confirm pada UI belum diuji browser. |
| FR-06 | Validasi field dan error API yang konsisten; koordinat nol sah. | Diimplementasikan di Zod dan Go. | Test mencakup subset aturan, termasuk nol, latitude invalid, enum/nama, duplikasi, dan malformed JSON. Tidak setiap batas diuji. |
| FR-07 | Cari berdasarkan kode/nama dan gabungkan filter kategori/status; clear mengembalikan semua hasil. | Diimplementasikan di endpoint dan UI. | Test backend mencakup gabungan query/filter; interaksi UI dan perilaku clear belum diuji browser. Pencarian case-insensitive mengikuti batas ASCII SQLite. |
| FR-08 | Feedback loading/error/empty/success dan layout responsif. | Komponen dan CSS tersedia. | Belum ada verifikasi visual/browser, termasuk breakpoint dan aksesibilitas aktual. |

Status tersebut menjelaskan implementasi dan bukti, bukan sertifikasi bahwa acceptance test produk telah tuntas.

## Kebutuhan non-fungsional

- Backend menjadi otoritas validasi, ID, timestamp, dan persistensi.
- SQL menggunakan parameter; tabel mempunyai constraint kategori, status, kode unik, dan rentang koordinat.
- Tidak memerlukan Docker atau API key peta untuk menjalankan lokal.
- Gunakan HTML berlabel/semantik, focus yang terlihat, dan form/dialog yang bisa dioperasikan keyboard; elemen tersedia di source, tetapi perilakunya belum diuji manual.
- Struktur dijaga kecil untuk satu domain entitas; handler memanggil repository langsung, tanpa lapisan service tambahan.
- Tile publik OpenStreetMap dipakai dengan attribution; layanan tile publik bukan target produksi berskala besar.
- Konfigurasi rahasia/database lokal tidak dimasukkan ke repository melalui `.gitignore`.
- Brief pengumpulan juga mengharuskan instruksi setup, alasan pemilihan library, catatan penggunaan AI, unfinished features, serta source/config lengkap di Git. Dokumen proyek tersedia; commit dan submission belum dilakukan dalam sesi ini.

## Prioritas dari spesifikasi sumber

- **P0:** backend/database, frontend, CRUD, peta/detail, validasi dua sisi, README, dan AGENT.md. Kode sumber tersedia; acceptance UI end-to-end belum diverifikasi.
- **P1:** pencarian/filter, picker, responsive refinement, feedback state, seed, dan test. Implementasi sumber tersedia; sebagian interaksi hanya diuji lewat test API/schema, bukan browser.
- **P2:** animasi/dekorasi tambahan; tidak menjadi target.

Status summary disebut sebagai pilihan tambahan di spesifikasi sumber, bukan kebutuhan wajib dan belum tersedia. Header saat ini hanya menunjukkan jumlah hasil query.

## Di luar lingkup

Autentikasi/otorisasi, user role/organisasi, live GPS, telemetry, WebSocket, marker bergerak, riwayat perjalanan, routing/dispatch, jadwal maintenance, geocoding/reverse geocoding, upload, analitik, paid map service, dan deployment tidak dibuat. Rincian status dan konsekuensi: [LIMITATIONS.md](LIMITATIONS.md).

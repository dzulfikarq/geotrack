# Batasan dan known issues

Dokumen ini membedakan fitur yang memang di luar lingkup, keterbatasan implementasi saat ini, dan hal yang belum diverifikasi. Status test terperinci: [TESTING.md](TESTING.md).

## Belum selesai atau belum diverifikasi

- **Acceptance test browser belum dilakukan.** Build/typecheck dan smoke server tidak membuktikan React berhasil dirender di browser. Peta/marker, popup, picker, CRUD UI, dialog, keyboard/focus, dan breakpoint responsive perlu diperiksa manual.
- **Tile peta belum diverifikasi.** Client memakai tile publik OpenStreetMap; perlu internet. Attribution ada di UI, tetapi ketersediaan tile aktual belum diuji. Endpoint publik tidak ditujukan untuk beban produksi.
- **Review manusia belum tercatat.** Source dan dokumentasi dibuat/diperiksa oleh AI; reviewer manusia perlu meninjau perilaku, keamanan, dan isi sebelum pengumpulan/deployment.
- **Linux/macOS quick start belum dijalankan.** Command didokumentasikan, tetapi smoke runtime dilakukan di Windows.
- **Lint frontend belum tersedia.** `package.json` tidak mempunyai lint script/dependency; typecheck dijalankan sebagai pemeriksaan statis.

## Isu yang diketahui

- `/health` hanya mengembalikan `{"status":"ok"}` dari handler. Ia tidak ping SQLite dan bukan indikator readiness database.
- List API mengembalikan semua hasil tanpa pagination. Sesuai demo lokal, bukan daftar besar.
- Panel detail tidak menampilkan UUID internal meski UUID ada di respons API. Header menampilkan jumlah hasil filter, bukan ringkasan agregat per status.
- Pencarian dibangun dengan pola `LIKE '%q%'` terparameterisasi. Input tidak dapat mengubah struktur SQL, tetapi `%` dan `_` diperlakukan sebagai wildcard, bukan karakter literal.
- Perbandingan `LIKE`/`NOCASE` SQLite tidak menjamin case folding Unicode penuh. Selain itu, Go menghitung panjang berdasarkan Unicode code point, sedangkan Zod/JavaScript menghitung unit UTF-16; batas karakter untuk emoji/surrogate pair dapat berbeda antara client dan server.
- SQLite pool dibatasi satu koneksi untuk menyerialisasi operasi. Throughput/concurrency tidak diukur; satu koneksi dapat membatasi pembacaan.
- Schema dijalankan dengan `CREATE IF NOT EXISTS`; belum ada nomor versi, migrasi perubahan skema, atau prosedur upgrade data.
- Seed memasukkan item satu per satu, bukan dalam transaksi. Kegagalan di tengah dapat meninggalkan sebagian seed; kode yang telah ada hanya dilewati dan tidak diperbarui.
- Backend membaca environment proses dan tidak memuat `.env`. Contoh `.env.example` bukan konfigurasi otomatis.
- Vite build sukses tetapi mengeluarkan dua warning Rollup tentang posisi komentar anotasi di dependency Zod v4. Warning tidak menghentikan build; belum ditangani di source dependency.
- API tidak memasang graceful shutdown khusus untuk `SIGINT`/`SIGTERM`.

## Di luar lingkup produk

Fitur berikut tidak diimplementasikan, bukan bug yang diklaim selesai:

- Login, autentikasi, role, dan otorisasi.
- Live GPS, telemetry IoT, WebSocket, marker bergerak, dan riwayat lokasi.
- Route planning, dispatch, geocoding/reverse geocoding, upload, dashboard analitik.
- Deployment, high availability, backup otomatis, dan layanan tile peta produksi.

## Verifikasi yang masih disarankan

1. Jalankan aplikasi di browser dengan API aktif dan seed opsional.
2. Uji create/detail dari row dan marker/edit koordinat/delete cancel-confirm/reload/filter.
3. Periksa tile/attribution, mobile layout, keyboard/focus, serta kegagalan API.
4. Review kebijakan deployment, CORS, backup, dan layanan tile sebelum penggunaan di luar demo lokal.

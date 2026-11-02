# Batasan dan known issues

Dokumen ini membedakan fitur yang memang di luar lingkup, keterbatasan implementasi saat ini, dan hal yang belum diverifikasi. Status test terperinci: [TESTING.md](TESTING.md).

## Belum selesai atau belum diverifikasi

- **Review manusia belum tercatat.** Acceptance UI otomatis Chrome lulus pada cakupan di [TESTING.md](TESTING.md), tetapi reviewer manusia masih perlu meninjau perilaku, keamanan, desain, dan dokumentasi sebelum submission/deployment.
- **Aksesibilitas belum diaudit.** Keyboard/focus order, screen reader, kontras, zoom teks, dan WCAG belum diverifikasi; jangan anggap interaksi visual/otomatis sebagai bukti compliance.
- **Linux/macOS quick start belum dijalankan.** Command didokumentasikan, tetapi smoke runtime dilakukan di Windows.

## Isu yang diketahui

- `/health` hanya mengembalikan `{"status":"ok"}` dari handler. Ia tidak ping SQLite dan bukan indikator readiness database.
- List API mengembalikan semua hasil tanpa pagination. Sesuai demo lokal, bukan daftar besar.
- Panel detail tidak menampilkan UUID internal meski UUID ada di respons API. Header menampilkan jumlah hasil filter, bukan ringkasan agregat per status.
- Pencarian dibangun dengan pola `LIKE '%q%'` terparameterisasi. Input tidak dapat mengubah struktur SQL, tetapi `%` dan `_` diperlakukan sebagai wildcard, bukan karakter literal.
- Perbandingan `LIKE`/`NOCASE` SQLite tidak menjamin case folding Unicode penuh. Selain itu, Go menghitung panjang berdasarkan Unicode code point, sedangkan Zod/JavaScript menghitung unit UTF-16; batas karakter untuk emoji/surrogate pair dapat berbeda antara client dan server.
- SQLite pool dibatasi satu koneksi untuk menyerialisasi operasi. Throughput/concurrency tidak diukur; satu koneksi dapat membatasi pembacaan.
- Migrasi kategori memiliki versi 2–3 dan memigrasikan schema entity legacy secara idempotent. Belum ada migration framework eksternal atau prosedur backup/restore database otomatis.
- Seed memasukkan kategori dan entity satu per satu, bukan dalam transaksi. Kegagalan di tengah dapat meninggalkan sebagian seed; kategori dengan nama sama dan kode entity yang telah ada dilewati, tidak diperbarui.
- Backend membaca environment proses dan tidak memuat `.env`. Contoh `.env.example` bukan konfigurasi otomatis.
- Vite build sukses; dua warning Rollup non-fatal terkait komentar anotasi di dependency Zod v4 masih muncul. Warning ukuran chunk sudah hilang setelah pemisahan vendor chunk dan lazy-load Category Management.
- `govulncheck` menemukan 0 jalur vulnerability yang terjangkau. Scanner tetap melaporkan 2 vulnerability package-level dan 1 module-level pada dependency yang tidak dipanggil oleh code path terjangkau; toolchain Go dinaikkan ke 1.26.10 dan `golang.org/x/net` ke 0.60.0.
- API tidak memasang graceful shutdown khusus untuk `SIGINT`/`SIGTERM`.

## Di luar lingkup produk

Fitur berikut tidak diimplementasikan, bukan bug yang diklaim selesai:

- Login, autentikasi, role, dan otorisasi.
- Live GPS, telemetry IoT, WebSocket, marker bergerak, dan riwayat lokasi.
- Route planning, dispatch, geocoding/reverse geocoding, upload, dashboard analitik.
- Deployment, high availability, backup otomatis, dan layanan tile peta produksi.

## Verifikasi yang masih disarankan

1. Minta reviewer manusia meninjau screenshot dan alur utama, lalu periksa keyboard/focus, screen reader, dan kontras.
2. Jalankan quick start pada Linux/macOS jika platform tersebut termasuk target.
3. Uji database rusak/terkunci, concurrency, dan recovery jaringan sebelum deployment.
4. Review kebijakan deployment, CORS, backup, dan layanan tile sebelum penggunaan di luar demo lokal.

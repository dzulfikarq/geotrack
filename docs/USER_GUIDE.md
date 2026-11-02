# Panduan pengguna

Panduan ini menjelaskan antarmuka yang tersedia di kode aktual. Alur UI belum diuji manual di browser; lihat [status pengujian](TESTING.md).

## 1. Jalankan aplikasi

Ikuti bagian [Mulai cepat di README](../README.md#mulai-cepat). Jika database baru kosong, daftar akan menampilkan empty state. Seed opsional tersedia melalui [DATABASE.md](DATABASE.md#seed-data).

## 2. Lihat dan temukan entitas

- Panel **Entities** menampilkan kode, nama, kategori, dan status untuk data dari API.
- Ketik kode atau nama di kolom pencarian. Pilih kategori dan/atau status; filter dapat digabung.
- Gunakan **Clear filters** untuk kembali menampilkan semua data.
- Marker dan daftar memakai hasil filter yang sama. Warna marker membedakan kategori; status inactive ditampilkan lebih redup dan maintenance memakai garis marker putus-putus.
- Klik baris atau marker untuk memilih entitas. Panel detail menampilkan kode, nama, kategori, status, koordinat, deskripsi, waktu dibuat, dan waktu terakhir diperbarui. UUID internal tersedia di API, tetapi tidak ditampilkan di panel.

## 3. Tambah entitas

1. Pilih **Add entity**.
2. Isi kode, nama, kategori, status, latitude, dan longitude. Deskripsi opsional.
3. Form baru mengisi koordinat awal `-7.9666, 112.6326`; ubah sesuai lokasi yang diinginkan. Angka nol sah.
4. Pilih **Create entity**. Jika kode duplikat atau data tidak valid, form menampilkan error dari client/server.
5. Setelah sukses, data disimpan lewat API dan panel detail dibuka. Filter dibersihkan agar record terlihat.

Teks tombol UI saat ini berbahasa Inggris seperti **Add entity**, **Create entity**, **Save changes**, dan **Delete entity**.

## 4. Pilih koordinat dari peta

1. Di form, pilih **Pick coordinates from map**.
2. Form ditutup sementara; mode picker aktif dan peta menampilkan petunjuk.
3. Klik lokasi pada peta. Latitude/longitude terisi dan form dibuka kembali.
4. Pilih **Cancel** pada petunjuk peta untuk keluar dari mode picker tanpa mengganti koordinat.

Klik peta biasa tidak mengubah form jika mode picker tidak aktif. Picker mengambil koordinat klik, bukan hasil geocoding; lokasi perlu dipilih manual.

## 5. Edit dan hapus

- Pilih entitas dari baris atau marker, lalu **Edit**. Form memuat nilai tersimpan. Simpan perubahan dengan **Save changes**.
- Untuk menghapus, pilih **Delete**, lalu **Delete entity** pada dialog konfirmasi. **Cancel** menutup dialog tanpa mengirim permintaan delete.
- Daftar/marker diperbarui setelah API berhasil. Jika API gagal, error ditampilkan dan aplikasi tidak mengklaim perubahan berhasil.

## 6. Status aplikasi

Panel menampilkan loading, error dengan tombol retry, empty state, hasil pencarian kosong, dan pesan sukses setelah perubahan. Label API pada sidebar mencerminkan status query awal/terakhir; itu bukan health monitoring berkelanjutan. Timestamp detail diformat mengikuti locale browser.

Peta menggunakan tile publik OpenStreetMap dan membutuhkan internet. Attribution tersedia pada peta. Aplikasi mengelola lokasi tersimpan, bukan posisi bergerak.

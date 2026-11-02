# Design system GeoTrack

> Dokumen ini mencatat UI aktual. Acceptance Chrome otomatis memeriksa tampilan desktop/mobile dan menyimpan [screenshot Map Explorer](assets/map-explorer.png) serta [screenshot Category Management](assets/category-management.png); bukan review visual manusia. Keyboard, screen reader, kontras, dan WCAG belum diaudit. Arsitektur dan sejarah keputusan ada di [ARCHITECTURE.md](ARCHITECTURE.md) dan [DECISION.md](DECISION.md).

## Cakupan dan sumber

Audit mencakup `frontend/src/styles.css`, `frontend/src/tailwind.config.js`, `frontend/src/App.tsx`, `frontend/src/components/Modal.tsx`, `frontend/src/features/categories/CategoryManagement.tsx`, `frontend/src/features/categories/icons.tsx`, `frontend/src/features/entities/EntityForm.tsx`, `frontend/src/features/map/EntityMap.tsx`, dan `frontend/index.html`. Perilaku UI utama diperiksa melalui Chrome pada 1440×1000 dan 390×844; screenshot menunjukkan acceptance state dengan data seed. Ini bukan usability atau aksesibilitas review manusia.

## Prinsip dan identitas visual

- **Workspace geografis, bukan live tracking.** List dan peta menampilkan lokasi entity tersimpan; panel footer menyatakan data bukan pelacakan langsung.
- **List dan map saling terhubung.** Filter list diterapkan pada marker; memilih baris atau marker memusatkan peta dan membuka detail.
- **Hierarki tenang, aksen hangat.** Canvas sage pucat, permukaan putih, teks hijau gelap, garis tipis, dan oranye untuk aksi/selection. Warna kategori membedakan jenis entity.
- **Informasi padat, tetap responsif.** Desktop memakai list paginated (10 entity per halaman) dan map berdampingan; layar kecil beralih antara tampilan Entities dan Map.

Ini prinsip yang disimpulkan dari implementasi, bukan aturan formal yang diterapkan melalui token atau komponen terpusat.

## Warna

### Semantic tokens yang didefinisikan dan digunakan

Token berada di `:root` pada `styles.css`. Hex diseragamkan ke enam digit untuk keterbacaan.

| Token | HEX | Pemakaian aktual |
|---|---|---|
| `--ink` | `#243129` | Teks utama dan foreground map/dialog. |
| `--ink-soft` | `#46554B` | Teks sekunder yang masih menonjol. |
| `--muted` | `#7C8980` | Deskripsi dan teks state. |
| `--line` | `#E6EBE6` | Batas panel, sidebar, dan caption map. |
| `--line-strong` | `#DCE3DC` | Batas input dan kontrol filter. |
| `--surface` | `#FFFFFF` | Panel/list dan permukaan terang. |
| `--page` | `#F4F6F3` | Latar halaman. |
| `--accent` | `#ED7B3B` | Aksi primer, selection, dan marker picker. |
| `--accent-dark` | `#D7652D` | Teks/ikon aksen dan hover aksi primer. |
| `--accent-soft` | `#FFF2E9` | Latar state/hover aksen. |
| `--danger` | `#C54B45` | Ikon error state; tombol destructive memakai warna hardcoded lain. |

Token efek yang digunakan: `--shadow-soft: 0 12px 34px rgb(36 49 41 / 8%)` untuk note peta kosong.

### Warna kategori dan status yang benar-benar dirender

Warna kategori entity dan marker berasal dari preset `COLOR_PALETTE` di `features/categories/icons.tsx`; renderer memakai key allowlisted dan tidak memakai hex input pengguna.

| Makna | Foreground/marker | Latar atau perlakuan |
|---|---|---|
| Orange | `#ED7B3B` | `#FFF2E9` |
| Teal | `#14858A` | `#E8F5F3` |
| Violet | `#7562B7` | `#F0EDFA` |
| Blue | `#3978B7` | `#EDF3FB` |
| Green | `#18815C` | `#E6F4EC` |
| Rose | `#C54B68` | `#FBECEF` |
| Slate | `#526056` | `#EDF0ED` |
| Amber | `#9A6C1D` | `#FFF4DF` |
| Active | `#287950` | `#E9F5ED` |
| Inactive | `#737E76` | `#EEF1EE` |
| Maintenance | `#9A6C1D` | `#FFF4DF`; marker bergaris putus-putus |
| Error toast/icon/button | `#C9534D` / `#C94E48` | Latar/border error memakai beberapa merah hardcoded |

Status API juga dibedakan dengan indikator: checking `#D89935`, online `#36A374`, offline `#D25950`.

### Inconsistency warna

`--muted-light` (`#9DA79F`), `--surface-soft` (`#FAFBF9`), `--green` (`#18815C`), `--teal` (`#16878D`), dan `--violet` (`#7562B7`) didefinisikan tetapi tidak direferensikan sebagai token. Beberapa nilai serupa tetap muncul sebagai literal di komponen. Tombol danger dan toast error juga tidak memakai satu semantic token. Sentralisasi warna adalah improvement opportunity, bukan kondisi saat ini.

## Typography

`index.html` memuat Plus Jakarta Sans dari Google Fonts untuk weight 400, 500, 600, 700, 800. `styles.css` menetapkannya sebagai font global dengan fallback system sans, smoothing, dan root size 14px. Hierarki aktual:

| Peran | Ukuran | Weight CSS | Line-height aktual |
|---|---:|---:|---|
| Page title | 24px | 700 | 1.25 |
| Section/detail/form heading | 18px | 700 | Umumnya 1.3; tidak semua selector menetapkan line-height. |
| Nama entity | 15px | 650 | Mewarisi 1.5 kecuali komponen Leaflet/native override. |
| Body, input, button | 14px | 450–650 sesuai elemen | Body 1.5; button 1.2; input mewarisi 1.5 kecuali override. |
| Secondary | 13px | Bervariasi, umumnya 450–700 | 1.45–1.65 pada elemen dengan aturan eksplisit. |
| Caption/badge | 12px | Bervariasi, umumnya 550–750 | Badge 1.2; teks lain sering inherited. |
| Brand | 19px desktop; 17px mobile | 750 | Mewarisi 1.5. |

Line-height tidak seragam secara global: deskripsi form 1.5, helper 1.45, error 1.4, deskripsi panjang 1.6, dan tombol 1.2. Angka di tabel adalah aturan CSS, bukan hasil pengukuran browser.

**Improvement opportunity:** beberapa weight yang diminta CSS—450, 550, 560, 650, 680, 750—tidak tercantum pada URL font yang hanya meminta 400/500/600/700/800. Hasil pemilihan face di browser belum diverifikasi. Skala juga memiliki ukuran literal 12/13/14/17/19px di luar enam token utama.

## Spacing dan layout

Tidak ada spacing/radius scale terpusat. CSS memakai jarak literal berulang sekitar 4–28px, radius sekitar 7–20px (serta bentuk lingkaran), dan padding yang diatur per komponen. Ukuran berikut adalah spesifikasi layout aktual.

| Viewport | Struktur |
|---|---|
| >1100px | Sidebar sticky 226px; main padding horizontal 28px; workspace list/map `39% / 61%` (list minimum 330px), tinggi `calc(100dvh - 151px)`, minimum 540px. Topbar minimum 126px. |
| 821–1100px | Sidebar menyusut ke 70px dengan label tersembunyi; main padding 20px; workspace `43% / 57%`, list minimum 300px. Toast berpindah ke kiri bawah. |
| 761–820px | Workspace `46% / 54%`, list minimum 280px; filter kategori/status bertumpuk; legend menyembunyikan judul. Topbar minimum 116px. |
| ≤760px | Sidebar menjadi header horizontal 58px. Toggle Entities/Map menampilkan salah satu panel; workspace tinggi `calc(100dvh - 230px)`, minimum 420px. Drawer menjadi panel bawah. |
| ≤480px | Main padding 9px; form utama satu kolom; workspace `calc(100dvh - 216px)`, minimum 390px; koordinat tetap berdampingan. |

Entity panel menggunakan kolom flex: heading dan filter di atas, list scrollable di tengah, status footer di bawah. Map mengisi kolom tersisa dan memiliki caption bawah. Lebar sidebar, rasio panel, serta tinggi workspace menggunakan aturan breakpoint; tidak memakai CSS Grid utility/token Tailwind.

## Komponen UI

Styling memakai class CSS, bukan design-system component library. `Modal`, `CategoryGlyph`, dan `CategoryMarker` reusable; `EntityForm`, `EntityMap`, dan `CategoryManagement` komponen fitur. Drawer, toast, badge, row, card, serta pola button/input/select didefinisikan lokal di fitur/CSS.

| Elemen | Implementasi dan ukuran aktual |
|---|---|
| Buttons | Class `.button`: tinggi minimum 42px, radius 9px, font 14px/650. Variasi primary oranye, secondary putih bergaris, danger merah, delete-outline. Icon button 36×36px. |
| Inputs | Native input/textarea; field form tinggi minimum 44px, padding 9×11px, radius 8px. Search tinggi 40px; filter select 42px. Label berada di atas field. |
| Selects | Native `<select>` dengan chevron CSS; filter kategori/status dua kolom, bertumpuk pada 761–820px. |
| Category table/form | Tabel kategori full-width menampilkan icon, nama/deskripsi, jumlah entity, marker preview, jenis kategori, search, filter jenis/marker/warna, pagination, dan aksi **View on map**/edit/delete. Dialog create/edit memuat grid 24 icon terkurasi dalam 4 grup, 8 swatch warna, 3 bentuk marker, serta preview live. |
| Badges | Status pill dengan dot, teks + latar berbeda; category tag memakai ikon dan warna kategori. |
| Cards | Bukan komponen reusable. Entity count, identifier, koordinat, dan deskripsi memakai permukaan, border, dan radius masing-masing. |
| Dialogs | Komponen `Modal` membungkus native `<dialog>`, `showModal()`, judul ber-`aria-labelledby`, tombol close, dan dismiss melalui Escape/backdrop. Lebar default maksimum 580px, varian form maksimum 680px. |
| Drawer | Detail entity dibuat inline di `App.tsx`; overlay kanan desktop (maksimum 354px), bawah pada mobile (maksimum tinggi 58%). Bukan dialog/modal reusable. |
| Toasts | Inline di `App.tsx`; success/error dengan ikon, dismiss button, hilang otomatis setelah 4,2 detik. Maksimum 420px; posisi berubah menurut breakpoint/mode map. |
| Tooltips | Hanya tooltip marker Leaflet yang menampilkan kode dan nama. Tidak ada komponen tooltip umum; map control memakai `title`/`aria-label`. |

Ukuran/radius di atas tidak distandardisasi melalui token. Perbedaan tinggi kontrol adalah kondisi aktual.

## Peta

- Leaflet memakai tile `tile.openstreetmap.fr/osmfr`, attribution OpenStreetMap/OSM France, dan font UI yang diwariskan. Titik awal Indonesia `[-2.5, 118]`, zoom 5.
- Marker memakai Leaflet `DivIcon` 56×56px dengan glyph Lucide dari allowlist 24 key terkurasi (Vehicle, IoT, Facility, General). Body 40px memakai warna kategori, border putih 2px, dan shadow. Bentuk tersedia: Pin (`border-radius` tear drop + rotasi), Circle, Rounded square. Anchor popup menyesuaikan bentuk.
- Inactive marker opacity 0.58 dan desaturasi; maintenance memakai border dashed. Selected marker membesar dan mendapat ring oranye transparan; hover juga memperbesar marker.
- Popup berisi ikon/nama kategori aktual, nama/kode entity, status, koordinat, dan tombol ke detail. Tooltip marker berisi kode + nama. Marker clickable; config icon/color/shape berasal dari respons entity dan diperbarui setelah invalidasi query.
- Kontrol map custom berada di kiri atas: zoom in/out dan fit all atau center selected. Legend kiri bawah berasal dari daftar kategori backend, menampilkan glyph/warna/bentuk, dan dapat scroll saat kategori banyak; judul disembunyikan pada breakpoint ≤820px.
- Picker koordinat hanya aktif dari form; hint status dengan tombol Cancel muncul di map. Map kosong menampilkan note, bukan legend yang dihilangkan.

Kategori dropdown, filter, list/detail, marker, dan legend memakai data kategori API. Icon renderer memakai allowlist lokal bersama picker; backend memvalidasi key, warna, dan bentuk dengan allowlist yang sama. Tidak ada SVG/HTML arbitrary dari input. Frontend default unknown key ke MapPin/orange/pin agar metadata lama/tidak dikenal tidak membuat marker rusak.

## Interaction states

- **Hover:** tombol berubah warna/shadow; row berubah latar; marker membesar; link teks bergaris bawah.
- **Active/selected:** tombol menekan 1px; row mendapat latar hangat dan inset orange bar; marker mendapat ring/scale; toggle mobile memakai `aria-pressed` dan latar putih.
- **Focus:** `:focus-visible` global memberi outline oranye 3px dengan offset 2px. Search/select/form field memakai border + glow oranye; beberapa field menetapkan `outline: 0`, jadi konsistensi ring keyboard perlu diuji.
- **Loading:** lima skeleton row entity; kartu kategori skeleton; jumlah memakai em dash; tombol save/delete disable dan menampilkan spinner. Category Management menampilkan fallback saat chunk lazy-load.
- **Disabled:** tombol cursor `not-allowed`, opacity `.62`; fieldset form disabled saat submit.
- **Empty:** state berbeda untuk workspace kosong, filter tanpa hasil, daftar kategori kosong, dan pencarian kategori tanpa hasil. Map mempertahankan note kosong.
- **Error:** list/kategori menampilkan error + retry; field/server validation error memakai teks merah; toast error role alert. Kegagalan fetch kategori dan retry diuji di browser; delete kategori in-use menjelaskan kegagalan dan mempertahankan dialog.
- **Success:** toast entity dan notice kategori untuk create/update/delete; toast koordinat untuk copy. Pesan dapat ditutup/hilang otomatis sesuai komponen.
- **Reduced motion:** animasi/transisi dipangkas lewat `prefers-reduced-motion`.

## Accessibility

**Yang sudah tampak di source:** native button/input/select/dialog; label field; nama aksesibel untuk tombol icon dan map controls; heading dialog terhubung via `aria-labelledby`; `aria-invalid`/`aria-describedby` dan `role="alert"` untuk error field; live status untuk jumlah/list/toast; state toggle lewat `aria-pressed`; ikon dekoratif disembunyikan dari accessibility tree; ada `.sr-only` dan reduced-motion rule.

**Pedoman untuk perubahan berikutnya:** pertahankan teks minimum 12px (body 14px); jangan menyampaikan kategori/status dengan warna saja; pertahankan fokus keyboard yang jelas pada semua kontrol, termasuk kontrol map; pastikan label, nama tombol, urutan tab, dialog focus/close, dan zoom teks tetap berfungsi. Ukur kontras teks kecil dan state disabled terhadap WCAG sebelum menyatakan compliant.

Kontras belum dihitung; keyboard dan screen reader belum diuji. Warna muted pada caption kecil serta outline kontrol form yang diganti glow perlu ditinjau; browser automation bukan klaim compliance.

## Keputusan dan improvement opportunities

- Split workspace dan adaptasi mobile terlihat pada source; konteks keputusan UI ada di [DEC-012](DECISION.md#dec-012--workspace-dirancang-ulang-agar-daftar-dan-peta-tetap-berdampingan). Form/dialog native dirujuk ke [DEC-013](DECISION.md#dec-013--form-entity-dan-dialog-diperbaiki-tanpa-ui-framework-tambahan).
- Plus Jakarta Sans dan skala tipografi diminta dalam konteks produk; rekonstruksi dicatat di [DEC-014](DECISION.md#dec-014--plus-jakarta-sans-dan-skala-typography-konsisten). Riwayat teknis/alternatif tetap di `DECISION.md`, bukan diulang di sini.
- Styling aktual berpusat di `styles.css`; `tailwind.config.js` memiliki `theme.extend: {}` dan plugin kosong. Tailwind directives ada, tetapi komponen menggunakan class CSS khusus. Utility/theme Tailwind bukan sumber token saat ini.
- Semantic color token belum mencakup seluruh literal; sebagian token root tidak dipakai. Tidak ada spacing/radius scale. Registry icon/palette merupakan satu sumber frontend; backend mempertahankan allowlist validasi terpisah untuk trust boundary.
- Prioritas berikutnya: review manusia, contrast/focus, khususnya bentuk Pin, ukuran legend saat banyak kategori, shortcut map dari category row, dialog, dan navigasi keyboard. Jangan menyatakan accessibility compliance tanpa audit khusus.
- Keputusan kategori dan customization dirujuk ke [DEC-015](DECISION.md#dec-015--kategori-menjadi-data-terkelola-dengan-id-stabil-dan-migrasi-kompatibel) dan [DEC-016](DECISION.md#dec-016--icon-kategori-dan-marker-peta-memakai-allowlist-terkurasi). Rincian API/data tetap di [ARCHITECTURE.md](ARCHITECTURE.md), [API.md](API.md), dan [DATABASE.md](DATABASE.md).

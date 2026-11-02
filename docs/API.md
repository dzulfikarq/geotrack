# Kontrak API

API memakai JSON. Base path entity adalah `/api/v1`; health endpoint berada di `/health`. Default host lokal: `http://localhost:8080`.

## Endpoint

| Method | Path | Sukses | Keterangan |
|---|---|---:|---|
| `GET` | `/health` | `200` | Mengembalikan `{"status":"ok"}`; bukan pemeriksaan readiness database. |
| `GET` | `/api/v1/entities` | `200` | List semua entitas. |
| `GET` | `/api/v1/entities/:id` | `200` | Membaca satu entitas. |
| `POST` | `/api/v1/entities` | `201` | Membuat entitas. |
| `PUT` | `/api/v1/entities/:id` | `200` | Mengganti field input entitas secara penuh. |
| `DELETE` | `/api/v1/entities/:id` | `204` | Menghapus entitas; body kosong. |

### List dan filter

Contoh:

```http
GET /api/v1/entities?q=sensor&category=iot_device&status=active
```

- `q` opsional: pencarian substring pada `code` atau `name`; case-insensitive untuk karakter ASCII mengikuti perilaku SQLite `LIKE`/`NOCASE`.
- `category` opsional: `vehicle`, `iot_device`, atau `facility`.
- `status` opsional: `active`, `inactive`, atau `maintenance`.
- Filter dapat digabung. Parameter kategori/status invalid menghasilkan `400 VALIDATION_ERROR`.
- Hasil diurutkan berdasarkan kode lalu ID. Tidak ada pagination.
- Implementasi membentuk pola SQL `LIKE '%q%'`; karakter `%` dan `_` pada `q` berfungsi sebagai wildcard. Detail: [batasan](LIMITATIONS.md#isu-yang-diketahui).

Respons list kosong tetap berupa array kosong:

```json
{"data": []}
```

## Request create/update

`POST` dan `PUT` menerima field berikut. `PUT` adalah full update, bukan partial `PATCH`.

```json
{
  "code": "IOT-001",
  "name": "Sensor Suhu A",
  "category": "iot_device",
  "status": "active",
  "latitude": -7.9666,
  "longitude": 112.6326,
  "description": "Sensor di kantor A"
}
```

`description` boleh dihilangkan dan akan menjadi string kosong. Pada `PUT`, menghilangkannya juga mengosongkan deskripsi lama. `latitude` dan `longitude` wajib berupa angka JSON; `0` sah. Detail tipe dan batas ada di bagian [validasi](#validasi).

## Respons sukses

Create, read, dan update mengembalikan satu entity dalam `data`:

```json
{
  "data": {
    "id": "e946f102-b70d-4f12-9053-a27628e4c6c1",
    "code": "IOT-001",
    "name": "Sensor Suhu A",
    "category": "iot_device",
    "status": "active",
    "latitude": -7.9666,
    "longitude": 112.6326,
    "description": "Sensor di kantor A",
    "created_at": "2026-11-02T08:00:00Z",
    "updated_at": "2026-11-02T08:00:00Z"
  }
}
```

ID dan timestamp dibuat server. Timestamp UTC dalam format RFC3339Nano. `DELETE` sukses mengembalikan `204 No Content` tanpa JSON.

## Validasi

| Field | Aturan server aktual |
|---|---|
| `code` | Setelah trim dan uppercase: 3–32 karakter ASCII `A-Z`, angka, atau `-`; unik case-insensitive. |
| `name` | Setelah trim: 2–100 Unicode code point. |
| `category` | Salah satu dari tiga kategori yang tercantum di atas. |
| `status` | Salah satu dari tiga status yang tercantum di atas. |
| `latitude` | Wajib hadir dan bukan `null`; angka finite dalam rentang inklusif `-90..90`. |
| `longitude` | Wajib hadir dan bukan `null`; angka finite dalam rentang inklusif `-180..180`. |
| `description` | Opsional; setelah trim maksimum 500 Unicode code point. Default string kosong. |

Koordinat `(0, 0)` valid. Frontend mempunyai validasi Zod untuk form; backend tetap validator otoritatif. JSON dengan field yang tidak dikenal, tipe field yang tidak dapat di-decode, JSON malformed, nilai JSON tambahan setelah object, atau body di atas 1 MiB ditolak sebagai `MALFORMED_JSON`. Field hilang/null yang lolos decoding ditolak sebagai `VALIDATION_ERROR`.

## Error dan HTTP status

Format umum:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid entity data",
    "fields": {"latitude": "Must be between -90 and 90"}
  }
}
```

`fields` hanya disertakan bila ada error field.

| HTTP | `error.code` | Kondisi |
|---:|---|---|
| `400` | `VALIDATION_ERROR` | Field entity atau filter kategori/status tidak valid. |
| `400` | `MALFORMED_JSON` | JSON malformed/terlalu besar, field asing, tipe JSON tidak sesuai, atau ada nilai JSON tambahan setelah object. |
| `404` | `NOT_FOUND` | ID tidak ditemukan untuk GET, PUT, atau DELETE. |
| `409` | `DUPLICATE_CODE` | Kode entitas sudah digunakan; detail field ada di `fields.code`. |
| `500` | `INTERNAL_ERROR` | Kegagalan server/database; detail internal tidak dikirim. |

Contoh duplikasi:

```json
{
  "error": {
    "code": "DUPLICATE_CODE",
    "message": "Code already exists",
    "fields": {"code": "This code is already in use"}
  }
}
```

Contoh entity tidak ditemukan:

```json
{"error":{"code":"NOT_FOUND","message":"Entity not found"}}
```

## CORS

Backend mengizinkan origin yang sama persis dengan `CORS_ORIGIN` dan menangani preflight `OPTIONS`. Default hanya `http://localhost:5173`; ini konfigurasi demo lokal, bukan kebijakan deployment.

# Peta Sawit dan Kebakaran Riau (Frontend)

Frontend WebGIS untuk Provinsi Riau: peta interaktif persebaran sawit
rakyat 2024 dan lahan terbakar 2026, per kabupaten/kota.

Backend-nya terpisah di repo `api-hono-gis-riau` (Hono + PostGIS).
Repo ini hanya frontend: React + Vite + Leaflet.

## Yang ditampilkan

- Basemap OpenStreetMap, di atasnya poligon 12 kabupaten/kota Riau.
- Choropleth: sawit rakyat 2024, terbakar BPBD (s/d 14 Okt 2026),
  atau luas poligon kebakaran (Jan-Jul 2026). Ketiga angka itu
  beda sumber dan beda periode, jadi jangan dijumlahkan.
- Titik panas VIIRS (NASA FIRMS, Jan-Okt 2026), bisa difilter
  per kabupaten dan per tanggal. Titik panas BUKAN luas terbakar.
- Poligon areal kebakaran Kemenhut (Jan-Jul 2026, 1.814 poligon),
  dimuat hanya saat layer-nya diaktifkan.
- Klik kabupaten untuk profilnya, klik baris statistik untuk
  memilih kabupaten di peta.
- Halaman Tentang Data berisi sumber dan periode setiap dataset
  secara jujur, termasuk catatan bahwa sawit di sini hanya
  perkebunan rakyat, dan angka SiPongi per kabupaten belum ada
  di database.

## Menjalankan lokal

Jalankan dulu API-nya (repo `api-hono-gis-riau`):

```sh
bun run dev
```

API jalan di `http://localhost:3000`.

Lalu di repo ini:

```sh
bun install
bun run dev
```

Buka `http://localhost:5173`.

Kalau API tidak di `localhost:3000`, salin `.env.example` menjadi
`.env` dan isi `VITE_API_URL` dengan alamat API-nya, lalu restart
server Vite.

## Build

```sh
bun run build
```

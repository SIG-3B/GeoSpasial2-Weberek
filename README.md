# Peta Geospasial Weberek

Peta web yang menyatukan lima kelompok data geospasial Weberek, Dotik, Manufahi:

1. Citra Sentinel-2 true color (11 Oktober 2026).
2. Menara dan data sel LTE.
3. Pemodelan sinyal satelit SES-12.
4. Jaringan optik nasional Timor-Leste.
5. Titik pusat dan radius area studi 20 km.

Peta vektor, pan/zoom, popup, dan pembacaan GeoJSON menggunakan [Croot.js](https://croot.js.org/).
Karena berkas Sentinel-2 berupa GeoTIFF dan Croot.js tidak merender raster, citra telah
disiapkan sebagai WebP web dengan area tanpa data transparan. WebP digunakan sebagai overlay yang mengikuti
pan dan zoom peta; GeoTIFF asli tetap disimpan di folder **Citra Foto Satelit**.

## Menjalankan

Jalankan server HTTP statis dari direktori ini, misalnya:

```bash
python -m http.server 8000
```

Buka `http://localhost:8000`. Halaman menggunakan ES modules dan tidak dapat dijalankan
dengan membuka `index.html` langsung melalui `file://`.

## Deploy ke GitHub Pages

Workflow `.github/workflows/pages.yml` men-deploy situs secara otomatis dari branch `main`.
Aktifkan sekali melalui **Settings → Pages → Build and deployment → Source → GitHub Actions**.
Setelah itu, setiap push ke `main` akan memicu deploy. Workflow menerbitkan berkas situs dan
data yang dipakai peta, serta mengecualikan TIFF asli dan metadata raster yang tidak diperlukan
oleh browser.

## Catatan data

- Jaringan seluler menggabungkan data `weberek-80km.geojson`, `weberek1.geojson`, dan
  `weberek2.geojson`; fitur ber-ID sama ditampilkan sekali. File BTS 20 km yang ada
  memiliki nol fitur.
- Data sinyal SES-12 adalah pemodelan link budget, bukan hasil pengukuran lapangan.
- Dataset jaringan optik dan BTS belum diverifikasi secara independen.
- Folder kontur hanya berisi titik pusat dan properti radius. Layer tersebut ditampilkan
  sebagai batas area studi 20 km, bukan sebagai kontur ketinggian.
- Raster citra mencakup area yang lebih luas dari lingkaran studi. GeoTIFF asli tetap
  menjadi sumber data; WebP untuk web berada di `Citra Foto Satelit/sentinel-2-true-color.webp`.

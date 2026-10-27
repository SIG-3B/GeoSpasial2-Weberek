# Data Geospasial Area Weberek, Dotik, Timor-Leste (Radius 20 km)

Dokumentasi data GIS kelompok. Isi: asal data, cara pembuatan, isi setiap file, dan cara menggunakannya.

- **Kelompok / Anggota:** 
1. Abdullah Averouse Ibnu Sina (714240027)
2. Mochamad Andika Rizkia (714240055)
3. Haikal Aditama Turah (714240022)
- **Kelas:** D4 Teknik Informatika 3B
- **Tanggal pengerjaan:** 27 Oktober 2026

---

## 1. Ringkasan

Proyek ini mengumpulkan data geospasial untuk area di sekitar **Weberek**, sebuah desa di Suco Dotik, Posto Administrativo Alas, Munisipio Manufahi, Timor-Leste. Area kajian adalah **radius 20 km** dari titik pusat.

---

## 2. Area Kajian

| Item | Nilai |
|------|-------|
| Titik pusat (perkiraan) | Lat **-9.0825**, Lon **125.9111** |
| Radius | 20 km |
| Sistem koordinat | WGS 84 (EPSG:4326) |
| Bounding box (kotak) | Barat **125.728952**, Selatan **-9.262364**, Timur **126.093248**, Utara **-8.902636** |
| Ukuran kotak | sekitar 40 x 40 km |

**Catatan penting tentang titik pusat:** koordinat pusat diambil dari catatan lokasi "Dotik, Alas" pada basis data spesimen herbarium (Australia's Virtual Herbarium). Titik itu mewakili Suco Dotik, belum tentu persis di Weberek. Jika koordinat Weberek yang tepat sudah diketahui, batas area perlu dibuat ulang (lihat bagian 6).

Sekitar sepertiga bagian selatan area adalah **laut** (Laut Timor), sehingga tidak ada informasi daratan di sana.

---

## 3. Asal Data

| Item | Keterangan |
|------|------------|
| Satelit / produk | Sentinel-2, level **L2A** (reflektansi permukaan, sudah dikoreksi atmosfer) |
| Penyedia | Copernicus Data Space Ecosystem, lewat **Copernicus Browser** (browser.dataspace.copernicus.eu) |
| Tanggal akuisisi | **11 Oktober 2026** |
| Layer visualisasi | True color (band B04 merah, B03 hijau, B02 biru) |
| Resolusi asli sensor | 10 m (band visual) |
| Lisensi | Data Copernicus Sentinel bebas digunakan, wajib mencantumkan atribusi |

**Atribusi yang wajib dicantumkan:**
> Contains modified Copernicus Sentinel data 2026, processed with Copernicus Browser.

---

## 4. Cara Data Dibuat

### 4.1 Batas area kajian
1. Titik pusat ditentukan (lihat bagian 2).
2. **Lingkaran 20 km**: 73 titik sudut dihitung dengan rumus jarak pada bola bumi (jari-jari bumi 6371,0088 km), setiap titik berjarak 20 km dari pusat dengan sudut 5 derajat. Disimpan sebagai GeoJSON poligon.
3. **Kotak 40 x 40 km**: diambil dari batas luar lingkaran (barat, selatan, timur, utara) dan disimpan sebagai GeoJSON poligon.

### 4.2 Citra satelit
1. Area kajian diunggah ke Copernicus Browser sebagai Area of Interest (AOI).
2. Tanggal dipilih sampai tampilan True color bersih dari awan di atas daratan.
3. Gambar diunduh lewat menu **Image download → Analytical** dengan pengaturan:
   - Format: **TIFF (32-bit float)**
   - Sistem koordinat: **WGS 84 (EPSG:4326)**
   - Layer: **True color**
   - Hasil: 2500 x 2500 piksel
4. File mentah hasil unduhan diberi nama `2026-10-11-00_00_2026-10-11-23_59_Sentinel-2_L2A_True_color.tiff`.

### 4.3 Pemrosesan lanjutan (Python, `rasterio`)
1. **Clip lingkaran** (`..._clipped.tif`): piksel di luar lingkaran 20 km diberi nilai 0 dan ditandai `nodata = 0`.
2. **Versi bersih lingkaran** (`..._lingkaran_bersih.tif`): nilai diubah ke 8-bit (0-255), lalu ditambahkan **alpha band** agar bagian luar lingkaran transparan tanpa harus mengatur nodata.
3. **Versi bersih kotak** (`..._kotak_bersih.tif` dan `.jpg`): nilai diubah ke 8-bit tanpa clip, sehingga tidak ada piksel hitam.

Masalah yang sempat muncul: piksel hitam di luar lingkaran saat file asli dibuka di QGIS. Penyebabnya, file asli tidak menandai nilai 0 sebagai nodata.

---

## 5. Detail Raster

- Ukuran piksel sekitar 0,000146 derajat, atau sekitar **16 m** di lapangan (2500 piksel untuk 20 km).
- Band 1 = merah, band 2 = hijau, band 3 = biru.
- Pada file float32, nilai sudah berupa tampilan True color (0 sampai 1), bukan reflektansi mentah per band. Jangan dipakai untuk menghitung indeks seperti NDVI.
- Pada file uint8, nilai 0 sampai 255 hasil skala dari nilai float.

---

## 6. Cara Menggunakan

### 6.1 Di QGIS
1. Buka QGIS, lalu **Layer → Add Layer → Add Raster Layer**, pilih file `.tif`.
2. Pasang basemap OpenStreetMap lewat **Browser → XYZ Tiles → OpenStreetMap** supaya posisi bisa dicek.
3. Batas area: **Layer → Add Layer → Add Vector Layer**, pilih file `.geojson`.
4. Proyek di QGIS boleh memakai EPSG:3857 atau lainnya. QGIS otomatis memproyeksikan ulang saat ditampilkan, data asli tetap EPSG:4326.

### 6.2 Di Copernicus Browser
1. Klik ikon **pentagon** (Area of Interest). Jangan ikon garis (Line of Interest), karena tool garis menolak poligon.
2. Pilih opsi upload, lalu pilih `weberek_radius20km.geojson`.

### 6.3 Di Python
```python
import rasterio
import numpy as np

with rasterio.open("weberek_20km_kotak_bersih.tif") as src:
    print(src.crs, src.bounds, src.count, src.width, src.height)
    rgb = src.read([1, 2, 3])          # bentuk: (3, tinggi, lebar)
    rgb = np.moveaxis(rgb, 0, -1)      # bentuk: (tinggi, lebar, 3), siap untuk plt.imshow
```

### 6.4 Membuat ulang batas dengan titik pusat yang benar
Jika koordinat Weberek yang tepat sudah diketahui, ganti `lat0` dan `lon0` pada skrip berikut, lalu unggah hasilnya ke Copernicus Browser dan unduh ulang citranya.

```python
import math, json

lat0, lon0, r_km = -9.0825, 125.9111, 20.0   # ganti dengan koordinat Weberek
R = 6371.0088
pts = []
for i in range(73):
    b = math.radians(i * 5)
    la1, lo1, d = math.radians(lat0), math.radians(lon0), r_km / R
    la2 = math.asin(math.sin(la1)*math.cos(d) + math.cos(la1)*math.sin(d)*math.cos(b))
    lo2 = lo1 + math.atan2(math.sin(b)*math.sin(d)*math.cos(la1),
                           math.cos(d) - math.sin(la1)*math.sin(la2))
    pts.append([round(math.degrees(lo2), 6), round(math.degrees(la2), 6)])
pts[-1] = pts[0]
gj = {"type": "FeatureCollection", "features": [{"type": "Feature",
      "properties": {"name": "radius 20 km"},
      "geometry": {"type": "Polygon", "coordinates": [pts]}}]}
json.dump(gj, open("radius20km.geojson", "w"))
```

---

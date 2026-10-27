# Heatmap Sinyal Satelit (Internet/Telepon) — Weberek, Dotik, Timor Leste

Layer 5 dari tugas **SIG Data Geospasial 2** (Sistem Informasi Geografis): data heatmap sinyal satelit internet/telepon dalam radius 20 km dari Weberek, Dotik, Timor Leste. Layer ini nantinya digabung dengan empat layer lain (heatmap BTS, kontur permukaan, citra satelit, jaringan optik nasional) dalam satu peta di GitHub Pages.

## Anggota

1. Ugi Sugiman Rahmatullah
2. Zahra Sabila
3. Yonaldi Ernanda Putro

## Ringkasan hasil

- Seluruh area studi (radius 20 km) **tercakup** oleh satelit geostasioner yang dianalisis dan oleh layanan Starlink.
- File utama: **`satelit_ses12.geojson`** — 1.266 titik grid (jarak sekitar 1 km), WGS84, siap dimuat ke Leaflet atau pustaka peta lain.
- Kekuatan sinyal terima (RSL) berkisar **-91,30 sampai -90,48 dBm** (selisih hanya 0,82 dB), jadi area ini praktis tercakup merata.

## Area studi

| Item                   | Nilai                                                                  |
| ---------------------- | ---------------------------------------------------------------------- |
| Lokasi                 | Weberek, Desa Dotik, Timor Leste                                       |
| Titik pusat            | -9.0704143, 125.8667663 (Google Earth; Google Maps plus code WWH8+MJG) |
| Radius                 | 20 km                                                                  |
| Batas kira-kira        | lat -9.2506 s/d -8.8902, lon 125.6843 s/d 126.0492                     |
| Ketinggian titik pusat | 161,2 m (Google Earth)                                                 |

## Sumber data

| Sumber                                                             | Data yang diambil                                                                  | Peran         |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ------------- |
| SatBeams, footprint **SES-12** (95° BT), beam SEAsia, Ku-band      | EIRP 49 dBW, antena 65 cm, elevasi 52,6°, azimut 284,7°, jarak 36.916 km           | Layer utama   |
| SatBeams, footprint **Telkom 4** (108° BT), beam Indonesia, C-band | EIRP 39 dBW, antena 170 cm, elevasi 66,6°, azimut 296,0° (diakses 27 Oktober 2026) | Pembanding    |
| Peta cakupan Starlink (starlink.com/map)                           | Status **Available Now** di Weberek, Dotik (screenshot 27 Oktober 2026)            | Bukti cakupan |

## Metode

1. Menentukan titik pusat dari Google Earth dan memverifikasinya di Google Maps.
2. Membaca EIRP, elevasi, dan azimut dari footprint satelit di SatBeams.
3. Membuat grid titik sekitar 1 km di dalam lingkaran 20 km (1.266 titik).
4. Menghitung RSL dan rasio C/N di tiap titik dengan perhitungan link budget (EIRP dikurangi redaman ruang bebas, ditambah gain antena penerima), dengan asumsi langit cerah.
5. Menormalisasi RSL secara min-max menjadi properti `kekuatan` (0 sampai 1).
6. Mengekspor hasilnya ke GeoJSON.

**Verifikasi:** perhitungan manual (redaman ruang bebas 205,4 dB pada 12 GHz dan jarak 36.916 km, gain antena 65 cm sekitar 36 dBi) memberi RSL teoritis sekitar -90,4 dBm, selaras dengan nilai di file (-91 dBm). Elevasi dan azimut satelit juga cocok dengan rumus geometri satelit geostasioner dan dengan angka yang ditampilkan SatBeams.

## Isi file `satelit_ses12.geojson`

FeatureCollection dengan 1.266 fitur bertipe `Point`, koordinat `[lon, lat]`, ditambah bagian `metadata` di tingkat atas (satelit, beam, band, rentang RSL, sumber, catatan).

| Properti                             | Arti                                                                                   |
| ------------------------------------ | -------------------------------------------------------------------------------------- |
| `kekuatan`                           | RSL dinormalisasi min-max di dalam area (0 sampai 1). **Skala relatif**, bukan absolut |
| `signal_strength_rsl_dbm`            | Kekuatan sinyal terima (dBm)                                                           |
| `cn_ratio_db`                        | Rasio carrier-to-noise (dB)                                                            |
| `link_quality`                       | Kelas kualitas link (`Optimal / Clear Sky` atau `Good (Margin > 3 dB)`)                |
| `eirp_dbw`                           | EIRP beam di area ini (konstan, 49 dBW)                                                |
| `altitude_m`                         | Ketinggian titik (m)                                                                   |
| `distance_km`                        | Jarak titik dari pusat (km)                                                            |
| `elevation_angle_deg`, `azimuth_deg` | Sudut pandang satelit dari titik tersebut                                              |

Ringkasan nilai: C/N 11,6 sampai 12,2 dB; 258 titik berstatus _Optimal / Clear Sky_ dan 1.008 titik _Good (Margin > 3 dB)_.

## Keterbatasan (penting untuk dibaca)

- **EIRP hanya satu nilai** per beam dari SatBeams (tidak ada file kontur yang bisa diunduh), sehingga tidak ada gradasi EIRP di dalam 20 km.
- **Gradasi RSL di file mengikuti jarak dari titik pusat** (hasil pemodelan), bukan pengukuran lapangan. Secara fisik, selisih jarak ke satelit di dalam 20 km hanya sekitar 0,005 dB, sehingga area dianggap seragam. Legenda peta sebaiknya menampilkan angka dBm aslinya, bukan hanya "lemah / kuat".
- **Belum ada uji penghalang medan** (viewshed) pada file SES-12. Satelit berada tinggi di langit, jadi penghalangan hanya mungkin di lembah sempit atau lereng curam.
- Nilai berlaku untuk **kondisi langit cerah**; redaman hujan tidak dihitung.
- Ini data teoritis hasil pemodelan, bukan hasil pengukuran sinyal di lapangan.

## Cara memakai di peta

```js
fetch("data/satelit_ses12.geojson")
  .then((r) => r.json())
  .then((g) => {
    const m = g.metadata; // satelit, beam, rsl_rentang_dbm, dll.
    g.features.forEach((f) => {
      const [lon, lat] = f.geometry.coordinates;
      // gunakan f.properties.kekuatan (0-1) untuk warna atau bobot heatmap
    });
  });
```

Saran tampilan: lingkaran berwarna per titik (radius sekitar 700 m), atau Leaflet.heat dengan `kekuatan` sebagai bobot (grid yang rapat bisa membuat heatmap tampak merah rata atau pucat, jadi atur `radius`, `blur`, dan `max`).

## Struktur berkas

```
satelit_ses12.geojson        data utama layer 5 (SES-12, 1.266 titik)
konversi_satelit_rekan.py    script mengubah GeoJSON mentah menjadi format seragam (hanya Python bawaan)
buat_data_satelit.py         script pembanding: grid dan skor sinyal Telkom 4, opsi DEM (butuh numpy, pyproj, rasterio)
README.md                    dokumen ini
```

## Mereproduksi

```bash
# mengubah GeoJSON mentah menjadi format seragam
python konversi_satelit_rekan.py file_mentah.geojson --out data/satelit_ses12.geojson

# data pembanding Telkom 4 (opsional: tambah --dem dem.tif untuk uji penghalang medan)
pip install numpy pyproj rasterio
python buat_data_satelit.py
```

## Catatan yang perlu dilengkapi

- Isi `tgl_akses` pada `metadata` di `satelit_ses12.geojson` (saat ini `null`) dengan tanggal akses SatBeams untuk SES-12.

## Referensi

- SatBeams, direktori satelit dan footprint: https://satbeams.com
- Peta cakupan Starlink: https://starlink.com/map
- Peluncuran Starlink di Timor Leste oleh Vorakai: https://en.tatoli.tl/2025/04/02/vorakai-launches-world-class-high-speed-starlink-internet-services-in-timor-leste/23/
- Rencana penyambungan 450 kantor desa dengan Starlink: https://www.telecomreviewasia.com/news/network-news/29183-timor-leste-expands-rural-connectivity-with-starlink-rollout-across-450-villages/

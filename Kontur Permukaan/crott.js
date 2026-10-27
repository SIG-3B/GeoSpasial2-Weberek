const map = L.map("map", { zoomControl: false }).setView([-9.07051, 125.91691], 11);

L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
}).addTo(map);
L.control.zoom({ position: "bottomright" }).addTo(map);

const status = document.getElementById("status");
const error = document.getElementById("error");

fetch("./geo.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`geo.json tidak dapat dimuat (HTTP ${response.status}).`);
    }
    return response.json();
  })
  .then((geojson) => {
    const centerFeature = geojson.features.find(
      (feature) => feature.geometry.type === "Point"
        && Number.isFinite(feature.properties.radius_m)
    );
    if (!centerFeature) {
      throw new Error("geo.json harus memiliki titik pusat dengan properti radius_m.");
    }

    const [longitude, latitude] = centerFeature.geometry.coordinates;
    const center = [latitude, longitude];
    const radius = centerFeature.properties.radius_m;
    const circle = L.circle(center, {
      radius,
      color: "#62836c",
      weight: 2,
      fillColor: "#709d75",
      fillOpacity: 0.16
    }).addTo(map);
    const marker = L.marker(center).addTo(map);

    marker.bindPopup(
      `<div class="popup-title">${centerFeature.properties.name}</div><div class="popup-detail">${centerFeature.properties.location}</div><div class="popup-detail">Radius: ${radius / 1000} km</div>`
    );

    map.fitBounds(circle.getBounds(), { padding: [28, 28] });
    status.textContent = `${geojson.features.length} fitur dimuat`;
    status.classList.add("ready");
  })
  .catch((loadError) => {
    status.textContent = "Data gagal dimuat";
    error.textContent = `${loadError.message} Jalankan halaman melalui server lokal, bukan dengan membuka file langsung.`;
    error.classList.add("visible");
  });

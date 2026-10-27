import {
  addGeoJSON,
  createMap,
  fitMap,
  mapToPoint,
  onMapMove,
  parseGeoJSON
} from "https://cdn.jsdelivr.net/gh/crootjs/lib@0.0.16/map.js";

const mapId = "map";
const studyBounds = [125.728952, -9.262364, 126.093248, -8.902636];
const rasterBounds = studyBounds;
const layerState = new Map();
const layerErrors = new Map();
const mapStatus = document.getElementById("map-status");
const summary = document.getElementById("feature-summary");
const rasterImage = document.createElement("img");

createMap(mapId, {
  center: [125.9111, -9.0825],
  zoom: 11,
  maxZoom: 18,
  attribution:
    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

const mapRoot = document.querySelector(`#${mapId} .crootjs-map`);
const vectorPane = mapRoot?.querySelector(".crootjs-map-vectors");

if (!mapRoot || !vectorPane) {
  throw new Error("Elemen peta Croot.js tidak ditemukan setelah inisialisasi.");
}

rasterImage.className = "satellite-raster";
rasterImage.alt = "";
rasterImage.setAttribute("aria-hidden", "true");
rasterImage.src = "./Citra%20Foto%20Satelit/sentinel-2-true-color.webp";
mapRoot.insertBefore(rasterImage, vectorPane);

function updateRasterPosition() {
  const topLeft = mapToPoint(mapId, [rasterBounds[0], rasterBounds[3]]);
  const bottomRight = mapToPoint(mapId, [rasterBounds[2], rasterBounds[1]]);

  if (!topLeft || !bottomRight) return;
  rasterImage.style.left = `${topLeft[0]}px`;
  rasterImage.style.top = `${topLeft[1]}px`;
  rasterImage.style.width = `${bottomRight[0] - topLeft[0]}px`;
  rasterImage.style.height = `${bottomRight[1] - topLeft[1]}px`;
}

onMapMove(mapId, updateRasterPosition);
updateRasterPosition();

function setMapStatus(message, state) {
  mapStatus.classList.toggle("ready", state === "ready");
  mapStatus.classList.toggle("error", state === "error");
  const text = mapStatus.querySelector("span:last-child");
  if (text) text.textContent = message;
}

function setLayerStatus(layerId, message, state) {
  const element = document.getElementById(`status-${layerId}`);
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("loaded", state === "loaded");
  element.classList.toggle("failed", state === "failed");
}

async function loadGeoJSON(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`${path} gagal dimuat (HTTP ${response.status}).`);
  }

  let input;
  try {
    input = await response.json();
  } catch (error) {
    throw new Error(`${path} bukan JSON yang valid: ${error.message}`);
  }

  const collection = parseGeoJSON(input);
  if (!collection) {
    throw new Error(`${path} tidak berisi GeoJSON yang valid.`);
  }
  return collection;
}

function featureKey(feature) {
  const properties = feature.properties || {};
  const id = feature.id ?? properties["@id"] ?? properties.node_id;
  return id === undefined ? JSON.stringify(feature.geometry) : String(id);
}

function mergeUnique(collections) {
  const seen = new Set();
  const features = [];

  for (const collection of collections) {
    for (const feature of collection.features) {
      const key = featureKey(feature);
      if (seen.has(key)) continue;
      seen.add(key);
      features.push(feature);
    }
  }
  return { type: "FeatureCollection", features };
}

function makeStudyArea(collection) {
  const centerFeature = collection.features.find(
    (feature) =>
      feature.geometry?.type === "Point" &&
      Number.isFinite(feature.properties?.radius_m)
  );
  if (!centerFeature) {
    throw new Error("geo.json tidak memiliki titik dengan properti radius_m.");
  }

  const [longitude, latitude] = centerFeature.geometry.coordinates;
  const radius = centerFeature.properties.radius_m;
  const earthRadius = 6371008.8;
  const angularDistance = radius / earthRadius;
  const latitudeRadians = (latitude * Math.PI) / 180;
  const longitudeRadians = (longitude * Math.PI) / 180;
  const ring = [];

  for (let step = 0; step <= 72; step += 1) {
    const bearing = (2 * Math.PI * step) / 72;
    const pointLatitude = Math.asin(
      Math.sin(latitudeRadians) * Math.cos(angularDistance) +
        Math.cos(latitudeRadians) * Math.sin(angularDistance) * Math.cos(bearing)
    );
    const pointLongitude =
      longitudeRadians +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitudeRadians),
        Math.cos(angularDistance) - Math.sin(latitudeRadians) * Math.sin(pointLatitude)
      );
    ring.push([(pointLongitude * 180) / Math.PI, (pointLatitude * 180) / Math.PI]);
  }

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          name: centerFeature.properties.name || "Area studi",
          location: centerFeature.properties.location || "Weberek, Timor-Leste",
          radius_km: radius / 1000,
          feature_type: "Batas area studi"
        },
        geometry: { type: "Polygon", coordinates: [ring] }
      },
      centerFeature
    ]
  };
}

function popupFor(feature) {
  const properties = feature.properties || {};
  const title =
    properties.name ||
    properties.operator ||
    properties.feature_type ||
    properties.network_role ||
    properties.link_quality ||
    "Fitur peta";
  const content = document.createElement("div");
  const heading = document.createElement("p");
  heading.className = "popup-title";
  heading.textContent = String(title);
  content.appendChild(heading);

  const details = Object.entries(properties)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .slice(0, 8);
  if (details.length === 0) return content;

  const list = document.createElement("dl");
  list.className = "popup-list";
  for (const [key, value] of details) {
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = key.replaceAll("_", " ");
    description.textContent =
      typeof value === "number" ? String(Number(value.toFixed?.(3) ?? value)) : String(value);
    list.append(term, description);
  }
  content.appendChild(list);
  return content;
}

function styleForCellular(feature) {
  if (feature.geometry.type === "Point") {
    return {
      stroke: "#fff",
      strokeWidth: 1.5,
      fill: "#3285aa",
      fillOpacity: 0.94,
      radius: 6
    };
  }
  return {
    stroke: "#7ca6b7",
    strokeWidth: 1,
    strokeOpacity: 0.8,
    fill: "#6da8bd",
    fillOpacity: 0.13
  };
}

function styleForSignal(feature) {
  const strength = Number(feature.properties?.kekuatan);
  const normalized = Number.isFinite(strength) ? Math.min(1, Math.max(0, strength)) : 0.5;
  const hue = 215 - normalized * 190;
  return {
    stroke: "#fff",
    strokeWidth: 0.8,
    fill: `hsl(${hue} 72% 53%)`,
    fillOpacity: 0.76,
    radius: 4
  };
}

function styleForOptical(feature) {
  if (feature.geometry.type === "Point") {
    return {
      stroke: "#fff",
      strokeWidth: 1.5,
      fill: "#bd7951",
      fillOpacity: 0.95,
      radius: 6
    };
  }
  return {
    stroke: "#b76e43",
    strokeWidth: 3,
    strokeOpacity: 0.95,
    fill: "none",
    fillOpacity: 0
  };
}

function styleForArea(feature) {
  if (feature.geometry.type === "Point") {
    return {
      stroke: "#fff",
      strokeWidth: 2,
      fill: "#557a54",
      fillOpacity: 1,
      radius: 7
    };
  }
  return {
    stroke: "#718b58",
    strokeWidth: 2,
    fill: "#91a96f",
    fillOpacity: 0.13
  };
}

function registerGeoJSONLayer(layerId, collection, style) {
  const checkbox = document.getElementById(`layer-${layerId}`);
  const remove = checkbox?.checked
    ? addGeoJSON(mapId, collection, { style, popup: popupFor })
    : () => {};
  const state = { remove, count: collection.features.length, collection, style };
  layerState.set(layerId, state);

  if (checkbox) {
    checkbox.addEventListener("change", () => {
      const current = layerState.get(layerId);
      if (!current) return;
      current.remove();
      current.remove = checkbox.checked
        ? addGeoJSON(mapId, current.collection, { style: current.style, popup: popupFor })
        : () => {};
    });
  }
  setLayerStatus(layerId, `${collection.features.length} fitur`, "loaded");
}

function updateSummary() {
  const featureCount = [...layerState.values()].reduce(
    (total, layer) => total + layer.count,
    0
  );
  const readyCount = layerState.size + (rasterImage.complete && rasterImage.naturalWidth > 0 ? 1 : 0);
  const failureCount = layerErrors.size;
  summary.textContent = `${readyCount} dari 5 layer siap · ${featureCount.toLocaleString("id-ID")} fitur vektor`;
  if (failureCount > 0) {
    setMapStatus(`${failureCount} layer gagal dimuat`, "error");
  } else if (readyCount === 5) {
    setMapStatus("Semua layer siap", "ready");
  } else {
    setMapStatus(`${readyCount} dari 5 layer siap`, "");
  }
}

function handleLayerError(layerId, error) {
  console.error(`Gagal memuat layer ${layerId}:`, error);
  layerErrors.set(layerId, error);
  setLayerStatus(layerId, "Gagal dimuat", "failed");
  summary.textContent = `Layer ${layerId} gagal dimuat: ${error.message}`;
}

const rasterToggle = document.getElementById("layer-satellite");
rasterToggle.addEventListener("change", () => {
  rasterImage.classList.toggle("hidden", !rasterToggle.checked);
});
rasterImage.addEventListener("load", () => {
  setLayerStatus("satellite", "2.500 × 2.500 px", "loaded");
  updateSummary();
});
rasterImage.addEventListener("error", () => {
  handleLayerError("satellite", new Error("Citra web tidak dapat dimuat."));
});

const layerJobs = [
  {
    id: "cellular",
    load: async () => {
      const collections = await Promise.all([
        loadGeoJSON("./Heatmap%20Jaringan%20Seluler%20(BTS)/weberek-80km.geojson"),
        loadGeoJSON("./Heatmap%20Jaringan%20Seluler%20(BTS)/weberek1.geojson"),
        loadGeoJSON("./Heatmap%20Jaringan%20Seluler%20(BTS)/weberek2.geojson")
      ]);
      return mergeUnique(collections);
    },
    style: styleForCellular
  },
  {
    id: "signal",
    load: () => loadGeoJSON("./Heatmap%20Sinyal%20Satelit/satelit_ses12.geojson"),
    style: styleForSignal
  },
  {
    id: "optical",
    load: () =>
      loadGeoJSON("./Jaringan%20Optik%20Nasional/jaringan-optik-nasional-timor-leste.geojson"),
    style: styleForOptical
  },
  {
    id: "area",
    load: async () => makeStudyArea(await loadGeoJSON("./Kontur%20Permukaan/geo.json")),
    style: styleForArea
  }
];

document.getElementById("toggle-layers").addEventListener("click", (event) => {
  const checkboxes = [...document.querySelectorAll(".layer-option input")];
  const turnOn = checkboxes.some((checkbox) => !checkbox.checked);
  for (const checkbox of checkboxes) {
    if (checkbox.checked !== turnOn) {
      checkbox.checked = turnOn;
      checkbox.dispatchEvent(new Event("change"));
    }
  }
  event.currentTarget.textContent = turnOn ? "Matikan semua" : "Nyalakan semua";
});

document.getElementById("reset-view").addEventListener("click", () => {
  fitMap(mapId, rasterBounds, 32);
});

fitMap(mapId, rasterBounds, 32);

for (const job of layerJobs) {
  job
    .load()
    .then((collection) => registerGeoJSONLayer(job.id, collection, job.style))
    .catch((error) => handleLayerError(job.id, error))
    .finally(updateSummary);
}

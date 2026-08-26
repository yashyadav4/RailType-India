import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";

// Linear interpolation between two coordinates
function interpolateCoords(start, end, progress) {
  if (!start || !end) return start || [0, 0];
  const lat = start[0] + (end[0] - start[0]) * progress;
  const lng = start[1] + (end[1] - start[1]) * progress;
  return [lat, lng];
}

// Camera Follower — must live inside MapContainer
function CameraController({ trainCoordinates }) {
  const map = useMap();
  useEffect(() => {
    if (trainCoordinates) {
      map.panTo(trainCoordinates, { animate: true, duration: 0.4 });
    }
  }, [trainCoordinates, map]);
  return null;
}

// Station Pin Factory — called at render time (not a hook, totally fine)
function createStationIcon(isCompleted) {
  const color = isCompleted ? "#16a34a" : "#334155";
  const shadow = isCompleted ? "rgba(22,163,74,0.6)" : "rgba(0,0,0,0.4)";
  return L.divIcon({
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px ${shadow}"><div style="width:4px;height:4px;border-radius:50%;background:#fff"></div></div>`,
    className: "custom-station-pin",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// Train icon singleton — created once outside the component so it's stable
const TRAIN_ICON = L.divIcon({
  html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 0 10px #16a34a);display:flex;align-items:center;justify-content:center;">🚂</div>`,
  className: "custom-train-pin",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

export default function MapView({
  stations = [],
  activeIndex = 1,
  userInputLength = 0,
  targetLength = 1,
}) {
  // ── ALL HOOKS MUST BE CALLED FIRST, BEFORE ANY CONDITIONAL RETURN ──

  const safeTargetLength = Math.max(targetLength, 1);
  const progressFraction = Math.min(userInputLength / safeTargetLength, 1);
  const startStationIndex = Math.max(0, activeIndex - 1);

  const startCoords = useMemo(
    () => stations[startStationIndex]?.coordinates || stations[0]?.coordinates,
    [stations, startStationIndex]
  );

  const targetCoords = useMemo(
    () => stations[activeIndex]?.coordinates || stations[0]?.coordinates,
    [stations, activeIndex]
  );

  const trainCoords = useMemo(
    () => interpolateCoords(startCoords, targetCoords, progressFraction),
    [startCoords, targetCoords, progressFraction]
  );

  const completedPath = useMemo(() => {
    const passed = stations.slice(0, startStationIndex + 1).map((s) => s.coordinates);
    return [...passed, trainCoords];
  }, [stations, startStationIndex, trainCoords]);

  const remainingPath = useMemo(() => {
    const upcoming = stations.slice(activeIndex).map((s) => s.coordinates);
    return [trainCoords, ...upcoming];
  }, [stations, activeIndex, trainCoords]);

  // ── SAFE TO RETURN EARLY AFTER ALL HOOKS ──
  if (!stations || stations.length === 0) return null;
  if (!startCoords || !trainCoords || !Array.isArray(trainCoords)) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
      }}
    >
      <style>{`
        .custom-station-pin, .custom-train-pin {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-marker-icon.custom-train-pin {
          transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1) !important;
        }
        .leaflet-control-zoom {
          border: 1px solid var(--border) !important;
          border-radius: 8px !important;
          overflow: hidden;
          box-shadow: var(--shadow-sm) !important;
        }
        .leaflet-control-zoom a {
          background-color: var(--panel) !important;
          color: var(--ink) !important;
          border-bottom: 1px solid var(--border) !important;
        }
        .leaflet-control-zoom a:hover {
          background-color: var(--panel-raised) !important;
          color: var(--marigold) !important;
        }
      `}</style>

      <MapContainer
        center={trainCoords}
        zoom={15}
        minZoom={12}
        maxZoom={18}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* Completed Path: Emerald Green */}
        <Polyline positions={completedPath} color="#16a34a" weight={6} opacity={0.95} />

        {/* Remaining Path: Muted Gray */}
        <Polyline positions={remainingPath} color="#475569" weight={5} opacity={0.75} />

        {/* Station Markers */}
        {stations.map((station, index) => (
          <Marker
            key={station.id}
            position={station.coordinates}
            icon={createStationIcon(index < activeIndex)}
          />
        ))}

        {/* Train Marker */}
        <Marker position={trainCoords} icon={TRAIN_ICON} zIndexOffset={1000} />

        {/* Camera Follower */}
        <CameraController trainCoordinates={trainCoords} />
      </MapContainer>
    </div>
  );
}

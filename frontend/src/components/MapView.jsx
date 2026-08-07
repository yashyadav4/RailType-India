import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";

// Custom Map Camera Controller to handle "Fly To" animations
function CameraController({ activeCoordinates }) {
  const map = useMap();

  useEffect(() => {
    if (activeCoordinates) {
      // Smoothly pan camera to current target station
      map.flyTo(activeCoordinates, 14, { duration: 1.5 });
    }
  }, [activeCoordinates, map]);

  return null;
}

// 1. Added default fallback values = [] and = 0 to prevent undefined errors
export default function MapView({ stations = [], activeIndex = 0 }) {
  // 2. Safe check: Guard against empty or non-existent stations array
  if (!stations || stations.length === 0) {
    return (
      <div
        style={{
          height: "350px",
          width: "100%",
          borderRadius: "12px",
          backgroundColor: "#0f172a",
          border: "1px solid #1e293b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
        }}
      >
        Loading station map...
      </div>
    );
  }

  // Safe extraction now that we know 'stations' exists and has items
  const linePolyline = stations.map((s) => s.coordinates);
  const activeStation = stations[activeIndex] || stations[0];

  return (
    <div
      style={{
        height: "350px",
        width: "100%",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid #1e293b",
      }}
    >
      <MapContainer
        center={activeStation ? activeStation.coordinates : [22.6908, 75.8672]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        {/* Dark Mode Tile Layer (CartoDB Dark Matter) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* Draw the track path line */}
        <Polyline
          positions={linePolyline}
          color="#38bdf8"
          weight={4}
          opacity={0.8}
        />

        {/* Place markers for each station */}
        {stations.map((station) => (
          <Marker key={station.id} position={station.coordinates} />
        ))}

        {/* Animate Camera on station change */}
        <CameraController activeCoordinates={activeStation?.coordinates} />
      </MapContainer>
    </div>
  );
}

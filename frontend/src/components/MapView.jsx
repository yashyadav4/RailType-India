import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";

function CameraController({ activeCoordinates }) {
  const map = useMap();

  useEffect(() => {
    if (activeCoordinates) {
      map.flyTo(activeCoordinates, 14, { duration: 1.5 });
    }
  }, [activeCoordinates, map]);

  return null;
}

export default function MapView({ stations = [], activeIndex = 0 }) {
  if (!stations || stations.length === 0) return null;

  const linePolyline = stations
    .slice(0, activeIndex + 1)
    .map((s) => s.coordinates);
  const activeStation = stations[activeIndex] || stations[0];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        height: "100vh",
        width: "100vw",
      }}
    >
      <MapContainer
        center={activeStation ? activeStation.coordinates : [22.6908, 75.8672]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <Polyline
          positions={linePolyline}
          color="#f97316"
          weight={5}
          opacity={0.85}
        />

        <CameraController activeCoordinates={activeStation?.coordinates} />
      </MapContainer>
    </div>
  );
}

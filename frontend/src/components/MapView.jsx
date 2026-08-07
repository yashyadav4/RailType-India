import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";

// Custom Camera Controller
function CameraController({ activeCoordinates }) {
  const map = useMap();

  useEffect(() => {
    if (activeCoordinates) {
      map.flyTo(activeCoordinates, 14, { duration: 1.5 });
    }
  }, [activeCoordinates, map]);

  return null;
}

// Marker Factory
const createStationIcon = (status) => {
  let iconHtml = "";

  if (status === "completed") {
    iconHtml = `
      <div style="
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: #16a34a;
        border: 2px solid #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 10px rgba(22, 163, 74, 0.7);
      ">
        <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #ffffff;"></div>
      </div>
    `;
  } else if (status === "active") {
    iconHtml = `
      <div class="active-pin-pulse" style="
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background-color: #f97316;
        border: 3px solid #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 15px #f97316, 0 0 25px rgba(249, 115, 22, 0.6);
      ">
        <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #ffffff;"></div>
      </div>
    `;
  } else {
    iconHtml = `
      <div style="
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: #0b0f19;
        border: 2px solid #475569;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.8;
      ">
        <div style="width: 4px; height: 4px; border-radius: 50%; background-color: #475569;"></div>
      </div>
    `;
  }

  return L.divIcon({
    html: iconHtml,
    className: "custom-station-pin",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

export default function MapView({ stations = [], activeIndex = 0 }) {
  if (!stations || stations.length === 0) return null;

  // 1. MEMOIZE THE TRACK PATH ARRAY
  // This keeps the array reference identical across re-renders, preventing Leaflet from redrawing the Polyline
  const linePolyline = useMemo(() => {
    return stations.map((s) => s.coordinates);
  }, [stations]);

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
      <style>{`
        @keyframes pulseGlow {
          0% { transform: scale(1); box-shadow: 0 0 12px #f97316, 0 0 20px rgba(249, 115, 22, 0.6); }
          50% { transform: scale(1.15); box-shadow: 0 0 20px #f97316, 0 0 35px rgba(249, 115, 22, 0.9); }
          100% { transform: scale(1); box-shadow: 0 0 12px #f97316, 0 0 20px rgba(249, 115, 22, 0.6); }
        }
        .active-pin-pulse {
          animation: pulseGlow 1.5s infinite ease-in-out;
        }
        .custom-station-pin {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

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

        {/* Static, Permanent Track Line */}
        <Polyline
          positions={linePolyline}
          color="#f97316"
          weight={5}
          opacity={0.85}
        />

        {/* Station Pins */}
        {stations.map((station, index) => {
          let status = "upcoming";
          if (index < activeIndex) status = "completed";
          if (index === activeIndex) status = "active";

          return (
            <Marker
              key={station.id}
              position={station.coordinates}
              icon={createStationIcon(status)}
            />
          );
        })}

        <CameraController activeCoordinates={activeStation?.coordinates} />
      </MapContainer>
    </div>
  );
}

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";

// Linear interpolation between two coordinates
function interpolateCoords(start, end, progress) {
  if (!start || !end) return start || [0, 0];
  const lat = start[0] + (end[0] - start[0]) * progress;
  const lng = start[1] + (end[1] - start[1]) * progress;
  return [lat, lng];
}

// Camera Follower
function CameraController({ trainCoordinates }) {
  const map = useMap();

  useEffect(() => {
    if (trainCoordinates) {
      map.panTo(trainCoordinates, { animate: true, duration: 0.4 });
    }
  }, [trainCoordinates, map]);

  return null;
}

// Station Pin Icon Factory (Emerald Green for completed, Muted Slate Gray for upcoming)
const createStationIcon = (isCompleted) => {
  const color = isCompleted ? "#16a34a" : "#334155";

  const iconHtml = `
    <div style="
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: ${color};
      border: 2px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 8px ${isCompleted ? "rgba(22, 163, 74, 0.6)" : "rgba(0,0,0,0.4)"};
    ">
      <div style="width: 4px; height: 4px; border-radius: 50%; background-color: #ffffff;"></div>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: "custom-station-pin",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// Train Icon
const trainIcon = L.divIcon({
  html: `
    <div style="
      font-size: 28px;
      line-height: 1;
      filter: drop-shadow(0 0 10px #16a34a);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      🚂
    </div>
  `,
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
  if (!stations || stations.length === 0) return null;

  // Calculate segment interpolation progress (0.0 to 1.0)
  const safeTargetLength = Math.max(targetLength, 1);
  const progressFraction = Math.min(userInputLength / safeTargetLength, 1);

  const startStationIndex = Math.max(0, activeIndex - 1);
  const startCoords =
    stations[startStationIndex]?.coordinates || stations[0].coordinates;
  const targetCoords =
    stations[activeIndex]?.coordinates || stations[0].coordinates;

  // Calculate live position of train between origin and target
  const trainCoords = useMemo(() => {
    return interpolateCoords(startCoords, targetCoords, progressFraction);
  }, [startCoords, targetCoords, progressFraction]);

  // Emerald Green Path (Completed line up to train)
  const completedPath = useMemo(() => {
    const passedStations = stations
      .slice(0, startStationIndex + 1)
      .map((s) => s.coordinates);
    return [...passedStations, trainCoords];
  }, [stations, startStationIndex, trainCoords]);

  // Solid Gray Path (Remaining line from train onward)
  const remainingPath = useMemo(() => {
    const upcomingStations = stations
      .slice(activeIndex)
      .map((s) => s.coordinates);
    return [trainCoords, ...upcomingStations];
  }, [stations, activeIndex, trainCoords]);

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
      {/* CSS Transitions for smooth marker sliding */}
      <style>{`
        .custom-station-pin, .custom-train-pin {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-marker-icon.custom-train-pin {
          transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1) !important;
        }
      `}</style>

      <MapContainer
        center={trainCoords}
        zoom={15}
        style={{ height: "100%", width: "100%" }} // Disables all mouse clicks & hover
        // zoomControl={false}
        // dragging={false} // Disables click & drag panning
        // scrollWheelZoom={false} // Disables scroll wheel zooming
        // doubleClickZoom={false} // Disables double-click zoom
        // touchZoom={false} // Disables pinch-to-zoom on touch screens
        // keyboard={false} // Disables arrow key panning
        // boxZoom={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* 1. Completed Path: Solid Emerald Green */}
        <Polyline
          positions={completedPath}
          color="#16a34a"
          weight={6}
          opacity={0.95}
        />

        {/* 2. Remaining Path: Solid Muted Gray */}
        <Polyline
          positions={remainingPath}
          color="#475569"
          weight={5}
          opacity={0.75}
        />

        {/* Station Markers (Green for passed, Gray for upcoming) */}
        {stations.map((station, index) => {
          const isCompleted = index < activeIndex;
          return (
            <Marker
              key={station.id}
              position={station.coordinates}
              icon={createStationIcon(isCompleted)}
            />
          );
        })}

        {/* 3. Train Marker */}
        <Marker position={trainCoords} icon={trainIcon} zIndexOffset={1000} />

        {/* Camera Follower */}
        <CameraController trainCoordinates={trainCoords} />
      </MapContainer>
    </div>
  );
}

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

// Dynamic Camera Follower
function CameraController({ trainCoordinates }) {
  const map = useMap();

  useEffect(() => {
    if (trainCoordinates) {
      map.panTo(trainCoordinates, { animate: true, duration: 0.5 });
    }
  }, [trainCoordinates, map]);

  return null;
}

// Station Pin Icon Factory (Green for completed/active, Muted Gray for upcoming)
const createStationIcon = (status) => {
  const isCompletedOrActive = status === "completed" || status === "active";
  const color = isCompletedOrActive ? "#16a34a" : "#334155";
  const glow = status === "active" ? "box-shadow: 0 0 12px #16a34a;" : "";

  const iconHtml = `
    <div style="
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background-color: ${color};
      border: 2px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      ${glow}
    ">
      <div style="width: 5px; height: 5px; border-radius: 50%; background-color: #ffffff;"></div>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: "custom-station-pin",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

// Custom Train Marker
const trainIcon = L.divIcon({
  html: `
    <div style="
      font-size: 26px;
      line-height: 1;
      filter: drop-shadow(0 0 10px #16a34a);
      transform: translate(-50%, -50%);
      transition: all 0.1s linear;
    ">
      🚂
    </div>
  `,
  className: "custom-train-pin",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export default function MapView({
  stations = [],
  activeIndex = 0,
  userInputLength = 0,
  targetLength = 1,
}) {
  if (!stations || stations.length === 0) return null;

  // 1. Calculate Segment Interpolation Progress (0.0 to 1.0)
  const safeTargetLength = Math.max(targetLength, 1);
  const progressFraction = Math.min(userInputLength / safeTargetLength, 1);

  const startStationIndex = Math.max(0, activeIndex - 1);
  const startCoords =
    stations[startStationIndex]?.coordinates || stations[0].coordinates;
  const targetCoords =
    stations[activeIndex]?.coordinates || stations[0].coordinates;

  // 2. Active Train Coordinate
  const trainCoords = useMemo(() => {
    return interpolateCoords(startCoords, targetCoords, progressFraction);
  }, [startCoords, targetCoords, progressFraction]);

  // 3. Completed Path (Green Line)
  const completedPath = useMemo(() => {
    const passedStations = stations
      .slice(0, startStationIndex + 1)
      .map((s) => s.coordinates);
    return [...passedStations, trainCoords];
  }, [stations, startStationIndex, trainCoords]);

  // 4. Remaining Path (Gray Line)
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
      <style>{`
        .custom-station-pin, .custom-train-pin {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

      <MapContainer
        center={trainCoords}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* Completed Track Line (Emerald Green) */}
        <Polyline
          positions={completedPath}
          color="#16a34a"
          weight={6}
          opacity={0.9}
        />

        {/* Upcoming Track Line (Muted Gray) */}
        <Polyline
          positions={remainingPath}
          color="#334155"
          weight={5}
          opacity={0.7}
          dashArray="8, 8"
        />

        {/* Station Markers */}
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

        {/* Moving Train Marker */}
        <Marker position={trainCoords} icon={trainIcon} zIndexOffset={1000} />

        {/* Camera Following Train */}
        <CameraController trainCoordinates={trainCoords} />
      </MapContainer>
    </div>
  );
}

import { useState, useMemo, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";

// ═══════════════════════════════════════════════════════════════════════
//  HELPERS — shared by both map modes
// ═══════════════════════════════════════════════════════════════════════

/** Simple linear interpolation between two {x,y} points */
function lerp(a, b, t) {
  if (!a || !b) return a || { x: 0, y: 0 };
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Convert lat/lng coordinates → SVG pixel positions, preserving real shape */
function geoToScreen(stations, width, height, padding) {
  if (!stations || stations.length === 0) return [];

  const lats = stations.map((s) => s.coordinates[0]);
  const lngs = stations.map((s) => s.coordinates[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);

  const latRange = maxLat - minLat || 0.01;
  const lngRange = maxLng - minLng || 0.01;

  // Uniform scale so shapes aren't distorted
  const scale = Math.min(
    (width - padding * 2) / lngRange,
    (height - padding * 2) / latRange
  );

  // Center the route within the viewport
  const offsetX = (width - lngRange * scale) / 2;
  const offsetY = (height - latRange * scale) / 2;

  return stations.map((s) => ({
    x: offsetX + (s.coordinates[1] - minLng) * scale,
    y: offsetY + (maxLat - s.coordinates[0]) * scale, // flip Y
  }));
}

/**
 * Generate a smooth SVG path through points using Catmull-Rom → Cubic Bezier.
 * This gives natural metro-style curves through every station.
 */
function smoothPath(points) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  if (points.length === 2) {
    return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;
  }

  let d = `M${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    // Catmull-Rom to cubic bezier control points
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return d;
}


// ═══════════════════════════════════════════════════════════════════════
//  SCHEMATIC MAP — Pure SVG, no external tiles
// ═══════════════════════════════════════════════════════════════════════

function SchematicMap({ stations, activeIndex, userInputLength, targetLength, lineColor }) {
  const W = 1000;
  const H = 500;
  const PAD = 100;

  // 1. Normalize station coordinates to SVG space
  const points = useMemo(() => geoToScreen(stations, W, H, PAD), [stations]);

  // 2. Calculate typing progress within current station
  const progress = Math.min(userInputLength / Math.max(targetLength, 1), 1);
  const prevIdx = Math.max(activeIndex - 1, 0);

  // 3. Train position — linearly interpolated between previous and current station
  const trainPos = useMemo(
    () => lerp(points[prevIdx], points[activeIndex], progress),
    [points, prevIdx, activeIndex, progress]
  );

  // 4. Build path data
  const completedPathD = useMemo(
    () => smoothPath([...points.slice(0, activeIndex), trainPos]),
    [points, activeIndex, trainPos]
  );

  const remainingPathD = useMemo(
    () => smoothPath([trainPos, ...points.slice(activeIndex)]),
    [points, activeIndex, trainPos]
  );

  if (points.length === 0) return null;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      {/* Glow filter for the completed line */}
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="trainGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Subtle dot grid */}
      <defs>
        <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="15" cy="15" r="0.8" fill="rgba(255,255,255,0.06)" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#dots)" />

      {/* Remaining route (gray) */}
      <path
        d={remainingPathD}
        fill="none"
        stroke="#334155"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />

      {/* Completed route (colored + glow) */}
      <path
        d={completedPathD}
        fill="none"
        stroke={lineColor || "#16a34a"}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
      />

      {/* Station markers */}
      {stations.map((station, i) => {
        const pt = points[i];
        if (!pt) return null;
        const isCompleted = i < activeIndex;
        const isCurrent = i === activeIndex;
        const isTerminal = i === 0 || i === stations.length - 1;

        return (
          <g key={station.id}>
            {/* Pulse ring for current station */}
            {isCurrent && (
              <circle
                cx={pt.x}
                cy={pt.y}
                r="14"
                fill="none"
                stroke={lineColor || "#16a34a"}
                strokeWidth="2"
                opacity="0.5"
              >
                <animate
                  attributeName="r"
                  from="10"
                  to="20"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.6"
                  to="0"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
            )}

            {/* Station dot */}
            <circle
              cx={pt.x}
              cy={pt.y}
              r={isTerminal ? 8 : 6}
              fill={isCompleted || isCurrent ? (lineColor || "#16a34a") : "#1e293b"}
              stroke={isCompleted || isCurrent ? "#fff" : "#475569"}
              strokeWidth={isTerminal ? 3 : 2}
            />

            {/* Station label — alternate above/below to avoid overlap */}
            <text
              x={pt.x}
              y={pt.y + (i % 2 === 0 ? -18 : 26)}
              textAnchor="middle"
              fill={isCompleted ? "#94a3b8" : isCurrent ? "#fff" : "#475569"}
              fontSize={isCurrent ? "12" : "10"}
              fontWeight={isCurrent ? "700" : "400"}
              fontFamily="inherit"
            >
              {station.name}
            </text>
          </g>
        );
      })}

      {/* Train marker */}
      {trainPos && (
        <text
          x={trainPos.x}
          y={trainPos.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="28"
          filter="url(#trainGlow)"
          style={{ transition: "x 0.4s ease, y 0.4s ease" }}
        >
          🚂
        </text>
      )}
    </svg>
  );
}


// ═══════════════════════════════════════════════════════════════════════
//  GEOGRAPHIC MAP — Leaflet tiles (existing implementation)
// ═══════════════════════════════════════════════════════════════════════

function CameraController({ trainCoordinates }) {
  const map = useMap();
  useEffect(() => {
    if (trainCoordinates) {
      map.panTo(trainCoordinates, { animate: true, duration: 0.4 });
    }
  }, [trainCoordinates, map]);
  return null;
}

function createStationIcon(isCompleted) {
  const color = isCompleted ? "#16a34a" : "#334155";
  const shadow = isCompleted ? "rgba(22,163,74,0.6)" : "rgba(0,0,0,0.4)";
  return L.divIcon({
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 8px ${shadow}"><div style="width:4px;height:4px;border-radius:50%;background:#fff;margin:4px auto"></div></div>`,
    className: "custom-station-pin",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

const TRAIN_ICON = L.divIcon({
  html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 0 10px #16a34a)">🚂</div>`,
  className: "custom-train-pin",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function GeographicMap({ stations, activeIndex, userInputLength, targetLength }) {
  const safeLen = Math.max(targetLength, 1);
  const frac = Math.min(userInputLength / safeLen, 1);
  const prevIdx = Math.max(activeIndex - 1, 0);

  const startC = stations[prevIdx]?.coordinates || stations[0]?.coordinates;
  const endC = stations[activeIndex]?.coordinates || stations[0]?.coordinates;

  const trainCoords = useMemo(() => {
    if (!startC || !endC) return [0, 0];
    return [
      startC[0] + (endC[0] - startC[0]) * frac,
      startC[1] + (endC[1] - startC[1]) * frac,
    ];
  }, [startC, endC, frac]);

  const completedPath = useMemo(() => {
    const passed = stations.slice(0, prevIdx + 1).map((s) => s.coordinates);
    return [...passed, trainCoords];
  }, [stations, prevIdx, trainCoords]);

  const remainingPath = useMemo(() => {
    const upcoming = stations.slice(activeIndex).map((s) => s.coordinates);
    return [trainCoords, ...upcoming];
  }, [stations, activeIndex, trainCoords]);

  if (!startC || !trainCoords) return null;

  return (
    <>
      <style>{`
        .custom-station-pin, .custom-train-pin { background: transparent !important; border: none !important; }
        .leaflet-marker-icon.custom-train-pin { transition: transform 0.5s cubic-bezier(0.25,1,0.5,1) !important; }
        .leaflet-control-zoom { border: 1px solid var(--border) !important; border-radius: 8px !important; overflow: hidden; }
        .leaflet-control-zoom a { background-color: var(--panel) !important; color: var(--ink) !important; border-bottom: 1px solid var(--border) !important; }
        .leaflet-control-zoom a:hover { background-color: var(--panel-raised) !important; color: var(--marigold) !important; }
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
        <Polyline positions={completedPath} color="#16a34a" weight={6} opacity={0.95} />
        <Polyline positions={remainingPath} color="#475569" weight={5} opacity={0.75} />
        {stations.map((s, i) => (
          <Marker key={s.id} position={s.coordinates} icon={createStationIcon(i < activeIndex)} />
        ))}
        <Marker position={trainCoords} icon={TRAIN_ICON} zIndexOffset={1000} />
        <CameraController trainCoordinates={trainCoords} />
      </MapContainer>
    </>
  );
}


// ═══════════════════════════════════════════════════════════════════════
//  MAIN EXPORT — toggle between schematic & geographic
// ═══════════════════════════════════════════════════════════════════════

export default function MapView({
  stations = [],
  activeIndex = 1,
  userInputLength = 0,
  targetLength = 1,
  lineColor = "#16a34a",
}) {
  const [mode, setMode] = useState("schematic");

  if (!stations || stations.length === 0) return null;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
      {/* Map content */}
      {mode === "schematic" ? (
        <SchematicMap
          stations={stations}
          activeIndex={activeIndex}
          userInputLength={userInputLength}
          targetLength={targetLength}
          lineColor={lineColor}
        />
      ) : (
        <GeographicMap
          stations={stations}
          activeIndex={activeIndex}
          userInputLength={userInputLength}
          targetLength={targetLength}
        />
      )}

      {/* Mode toggle — bottom-right corner */}
      <button
        onClick={() => setMode((m) => (m === "schematic" ? "geographic" : "schematic"))}
        style={{
          position: "absolute",
          bottom: "8rem",
          right: "1.5rem",
          zIndex: 30,
          background: "color-mix(in srgb, var(--panel) 80%, transparent)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "0.6rem 1rem",
          color: "var(--ink)",
          fontSize: "0.8rem",
          fontWeight: "600",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          transition: "background 0.2s",
          fontFamily: "inherit",
        }}
        title={mode === "schematic" ? "Switch to Geographic" : "Switch to Schematic"}
      >
        {mode === "schematic" ? "🗺️ Geographic" : "🚇 Schematic"}
      </button>
    </div>
  );
}

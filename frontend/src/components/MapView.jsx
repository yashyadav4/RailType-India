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
//  HELPERS
// ═══════════════════════════════════════════════════════════════════════

function lerp(a, b, t) {
  if (!a || !b) return a || { x: 0, y: 0 };
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function geoToScreen(stations, width, height, padding) {
  if (!stations || stations.length === 0) return [];

  const lats = stations.map((s) => s.coordinates[0]);
  const lngs = stations.map((s) => s.coordinates[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);

  const latRange = maxLat - minLat || 0.01;
  const lngRange = maxLng - minLng || 0.01;

  const scale = Math.min(
    (width - padding * 2) / lngRange,
    (height - padding * 2) / latRange
  );

  const offsetX = (width - lngRange * scale) / 2;
  const offsetY = (height - latRange * scale) / 2;

  return stations.map((s) => ({
    x: offsetX + (s.coordinates[1] - minLng) * scale,
    y: offsetY + (maxLat - s.coordinates[0]) * scale,
  }));
}

function smoothPath(points) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  if (points.length === 2)
    return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    d += ` C${p1.x + (p2.x - p0.x) / 6},${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6},${p2.y - (p3.y - p1.y) / 6} ${p2.x},${p2.y}`;
  }
  return d;
}

/** Detect current theme from <html data-theme="..."> */
function useThemeDetect() {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute("data-theme") || "dark"
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme") || "dark");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}

// ═══════════════════════════════════════════════════════════════════════
//  SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

function ZoomButtons({ zoomIn, zoomOut }) {
  return (
    <div style={{
      position: "absolute",
      bottom: "1.5rem",
      right: "1.5rem",
      zIndex: 9000,
      display: "flex",
      flexDirection: "column",
      borderRadius: "12px",
      overflow: "hidden",
      border: "1px solid color-mix(in srgb, var(--border) 50%, transparent)",
      boxShadow: "var(--shadow-md)",
      background: "color-mix(in srgb, var(--panel) 70%, transparent)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
    }}>
      {[
        { label: "+", action: zoomIn },
        { label: "−", action: zoomOut },
      ].map((btn) => (
        <button
          key={btn.label}
          onClick={(e) => {
            e.stopPropagation();
            btn.action();
          }}
          onDoubleClick={(e) => e.stopPropagation()}
          style={{
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            color: "var(--ink)",
            border: "none",
            borderBottom: btn.label === "+" ? "1px solid color-mix(in srgb, var(--border) 50%, transparent)" : "none",
            cursor: "pointer",
            fontSize: "1.4rem",
            fontWeight: "400",
            transition: "background 0.2s, color 0.2s",
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = "var(--marigold)"; e.currentTarget.style.color = "var(--marigold-ink)"; }}
          onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ink)"; }}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );



// ═══════════════════════════════════════════════════════════════════════
//  SCHEMATIC MAP — Smooth Camera Follow via CSS Transforms
// ═══════════════════════════════════════════════════════════════════════

function SchematicMap({ stations, activeIndex, userInputLength, targetLength, lineColor }) {
  const W = 1000;
  const H = 500;
  const PAD = 100;

  // Zoom logic
  const [zoom, setZoom] = useState(1);
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;

  const points = useMemo(() => geoToScreen(stations, W, H, PAD), [stations]);
  const progress = Math.min(userInputLength / Math.max(targetLength, 1), 1);
  const prevIdx = Math.max(activeIndex - 1, 0);

  const trainPos = useMemo(
    () => lerp(points[prevIdx], points[activeIndex], progress),
    [points, prevIdx, activeIndex, progress]
  );

  const completedPathD = useMemo(
    () => smoothPath([...points.slice(0, activeIndex), trainPos]),
    [points, activeIndex, trainPos]
  );
  const remainingPathD = useMemo(
    () => smoothPath([trainPos, ...points.slice(activeIndex)]),
    [points, activeIndex, trainPos]
  );

  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, z * 1.3));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, z / 1.3));

  if (points.length === 0) return null;

  // Calculate translation for smooth camera follow. 
  // Train is pinned to center-X and 40% from top-Y.
  const tx = W / 2 - trainPos.x * zoom;
  const ty = H * 0.4 - trainPos.y * zoom;

  return (
    <>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <defs>
          <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="trainGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="var(--ink)" strokeWidth="1" opacity="0.1" />
          </pattern>
        </defs>

        {/* Master wrapper */}
        <g style={{
          transform: `translate(${tx}px, ${ty}px) scale(${zoom})`,
          transition: "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
          transformOrigin: "0 0",
        }}>
          {/* Background grid */}
          <rect x={-5000} y={-5000} width={10000} height={10000} fill="url(#grid)" />

          {/* Decorative transit lines (spaghetti) */}
          <g opacity="0.1" fill="none" stroke="var(--ink)" strokeWidth="3">
            <path d="M-500,200 Q0,800 1500,300 T2500,100" />
            <path d="M-200,-100 Q400,200 600,900 T1200,1500" />
            <path d="M100,-400 Q200,500 900,400 T1800,-200" />
            <path d="M-800,600 Q300,1000 800,-100 T1900,-300" />
            <path d="M200,1000 Q600,200 1200,500 T2200,0" />
          </g>

          {/* Remaining route */}
          <path d={remainingPathD} fill="none" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" opacity="0.15" />

          {/* Completed route */}
          <path d={completedPathD} fill="none" stroke={lineColor || "#16a34a"} strokeWidth="6" strokeLinecap="round" filter="url(#lineGlow)" />

          {/* Station markers */}
          {stations.map((station, i) => {
            const pt = points[i];
            if (!pt) return null;
            const done = i < activeIndex;
            const current = i === activeIndex;
            const terminal = i === 0 || i === stations.length - 1;

            return (
              <g key={station.id}>
                {current && (
                  <circle cx={pt.x} cy={pt.y} r="14" fill="none" stroke={lineColor || "#16a34a"} strokeWidth="2">
                    <animate attributeName="r" from="10" to="22" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={pt.x} cy={pt.y}
                  r={terminal ? 8 : 6}
                  fill={done || current ? (lineColor || "#16a34a") : "var(--panel)"}
                  stroke={done || current ? "var(--panel)" : "var(--ink)"}
                  strokeWidth={terminal ? 3 : 2}
                  opacity={done || current ? 1 : 0.4}
                />
                <text
                  x={pt.x} y={pt.y + (i % 2 === 0 ? -18 : 26)}
                  textAnchor="middle"
                  fill={done ? "var(--ink)" : current ? "var(--ink)" : "var(--ink)"}
                  fontSize={current ? "12" : "10"}
                  fontWeight={current ? "700" : "400"}
                  fontFamily="inherit"
                  opacity={done ? 0.6 : current ? 1 : 0.4}
                >
                  {station.name}
                </text>
              </g>
            );
          })}

          {/* Train Element */}
          {trainPos && (
            <g style={{
              transform: `translate(${trainPos.x}px, ${trainPos.y}px)`,
              transition: "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)",
            }}>
              <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fontSize="28" filter="url(#trainGlow)">
                🚂
              </text>
            </g>
          )}
        </g>
      </svg>

      <ZoomButtons zoomIn={zoomIn} zoomOut={zoomOut} />
    </>
  );
}


// ═══════════════════════════════════════════════════════════════════════
//  GEOGRAPHIC MAP — Leaflet
// ═══════════════════════════════════════════════════════════════════════

function CameraController({ trainCoordinates }) {
  const map = useMap();
  useEffect(() => {
    if (trainCoordinates) {
      const currentZoom = map.getZoom();
      const targetPoint = map.project(trainCoordinates, currentZoom);
      targetPoint.y += 150; // offset camera so train is higher up
      const targetLatLng = map.unproject(targetPoint, currentZoom);
      map.panTo(targetLatLng, { animate: true, duration: 0.4 });
    }
  }, [trainCoordinates, map]);
  return null;
}

function CustomLeafletZoom() {
  const map = useMap();
  const zoomIn = () => map.setZoom(Math.min(map.getMaxZoom(), map.getZoom() + 1));
  const zoomOut = () => map.setZoom(Math.max(map.getMinZoom(), map.getZoom() - 1));
  return <ZoomButtons zoomIn={zoomIn} zoomOut={zoomOut} />;
}

function createStationIcon(isCompleted) {
  const c = isCompleted ? "#16a34a" : "#334155";
  const s = isCompleted ? "rgba(22,163,74,0.6)" : "rgba(0,0,0,0.4)";
  return L.divIcon({
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${c};border:2px solid #fff;box-shadow:0 0 8px ${s}"><div style="width:4px;height:4px;border-radius:50%;background:#fff;margin:4px auto"></div></div>`,
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

function GeographicMap({ stations, activeIndex, userInputLength, targetLength, theme }) {
  const frac = Math.min(userInputLength / Math.max(targetLength, 1), 1);
  const prevIdx = Math.max(activeIndex - 1, 0);

  const startC = stations[prevIdx]?.coordinates || stations[0]?.coordinates;
  const endC = stations[activeIndex]?.coordinates || stations[0]?.coordinates;

  const trainCoords = useMemo(() => {
    if (!startC || !endC) return [0, 0];
    return [startC[0] + (endC[0] - startC[0]) * frac, startC[1] + (endC[1] - startC[1]) * frac];
  }, [startC, endC, frac]);

  const completedPath = useMemo(
    () => [...stations.slice(0, prevIdx + 1).map((s) => s.coordinates), trainCoords],
    [stations, prevIdx, trainCoords]
  );
  const remainingPath = useMemo(
    () => [trainCoords, ...stations.slice(activeIndex).map((s) => s.coordinates)],
    [stations, activeIndex, trainCoords]
  );

  const tileUrl =
    theme === "light"
      ? "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png";

  if (!startC || !trainCoords) return null;

  return (
    <>
      <style>{`
        .custom-station-pin, .custom-train-pin { background: transparent !important; border: none !important; }
        .leaflet-marker-icon.custom-train-pin { transition: transform 0.5s cubic-bezier(0.25,1,0.5,1) !important; }
      `}</style>

      <MapContainer
        center={trainCoords}
        zoom={15}
        minZoom={12}
        maxZoom={18}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer key={theme} url={tileUrl} attribution='&copy; <a href="https://carto.com/">CARTO</a>' />
        <Polyline positions={completedPath} color="#16a34a" weight={6} opacity={0.95} />
        <Polyline positions={remainingPath} color="#475569" weight={5} opacity={0.75} />
        {stations.map((s, i) => (
          <Marker key={s.id} position={s.coordinates} icon={createStationIcon(i < activeIndex)} />
        ))}
        <Marker position={trainCoords} icon={TRAIN_ICON} zIndexOffset={1000} />
        <CameraController trainCoordinates={trainCoords} />
        <CustomLeafletZoom />
      </MapContainer>
    </>
  );
}


// ═══════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════

export default function MapView({
  stations = [],
  activeIndex = 1,
  userInputLength = 0,
  targetLength = 1,
  lineColor = "#16a34a",
}) {
  const [mode, setMode] = useState("schematic");
  const theme = useThemeDetect();

  if (!stations || stations.length === 0) return null;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
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
          theme={theme}
        />
      )}

      {/* Unified Glassmorphism Map Toggle Button */}
      <button
        onClick={() => setMode((m) => (m === "schematic" ? "geographic" : "schematic"))}
        style={{
          position: "absolute",
          bottom: "1.5rem",
          right: "5.5rem", // Placed elegantly next to the zoom controls
          zIndex: 9000,
          background: "color-mix(in srgb, var(--panel) 70%, transparent)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid color-mix(in srgb, var(--border) 50%, transparent)",
          borderRadius: "12px",
          padding: "0 1.2rem",
          height: "40px",
          color: "var(--ink)",
          fontSize: "0.9rem",
          fontWeight: "600",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          boxShadow: "var(--shadow-md)",
          transition: "background 0.2s, transform 0.15s, color 0.2s",
        }}
        onMouseOver={(e) => { 
          e.currentTarget.style.background = "var(--marigold)"; 
          e.currentTarget.style.color = "var(--marigold-ink)";
          e.currentTarget.style.transform = "scale(1.02)"; 
        }}
        onMouseOut={(e) => { 
          e.currentTarget.style.background = "color-mix(in srgb, var(--panel) 70%, transparent)"; 
          e.currentTarget.style.color = "var(--ink)";
          e.currentTarget.style.transform = "scale(1)"; 
        }}
      >
        {mode === "schematic" ? "🗺️ Geographic" : "🚇 Schematic"}
      </button>
    </div>
  );
}}

import { useState, useMemo, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
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

/**
 * Compute stable cubic bezier segments from Catmull-Rom spline through all points.
 * Each segment has { start, cp1, cp2, end } — same math as smoothPath but preserved per-segment.
 */
function computePathSegments(points) {
  if (points.length < 2) return [];
  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    segments.push({
      start: p1,
      cp1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
      cp2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
      end: p2,
    });
  }
  return segments;
}

/** Convert an array of bezier segments into an SVG path string */
function segmentsToPath(segments) {
  if (segments.length === 0) return "";
  let d = `M${segments[0].start.x},${segments[0].start.y}`;
  for (const seg of segments) {
    d += ` C${seg.cp1.x},${seg.cp1.y} ${seg.cp2.x},${seg.cp2.y} ${seg.end.x},${seg.end.y}`;
  }
  return d;
}

/**
 * Split a cubic bezier at parameter t using De Casteljau's algorithm.
 * Returns { first, second } — two sub-segments that together form the original.
 * This guarantees NO curve distortion because control points are geometrically subdivided.
 */
function splitBezierAt(seg, t) {
  const lp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const a = lp(seg.start, seg.cp1, t);
  const b = lp(seg.cp1, seg.cp2, t);
  const c = lp(seg.cp2, seg.end, t);
  const d = lp(a, b, t);
  const e = lp(b, c, t);
  const f = lp(d, e, t); // The exact point on the curve at t
  return {
    first:  { start: seg.start, cp1: a, cp2: d, end: f },
    second: { start: f, cp1: e, cp2: c, end: seg.end },
  };
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
          onMouseDown={(e) => e.preventDefault()}
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
}


// ═══════════════════════════════════════════════════════════════════════
//  SCHEMATIC MAP — Smooth Camera Follow via CSS Transforms
// ═══════════════════════════════════════════════════════════════════════

function SchematicMap({ stations, activeIndex, userInputLength, targetLength, lineColor }) {
  const VIEW_W = 1000;
  const VIEW_H = 500;

  // Dynamically increase the internal mapping canvas to spread out points geographically
  const mapSize = Math.max(3000, stations.length * 150);
  const MAP_W = mapSize;
  const MAP_H = mapSize;
  const PAD = 300;

  // Zoom logic
  const [zoom, setZoom] = useState(0.85);
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;

  const points = useMemo(() => geoToScreen(stations, MAP_W, MAP_H, PAD), [stations, MAP_W, MAP_H]);
  const progress = Math.min(userInputLength / Math.max(targetLength, 1), 1);
  const prevIdx = Math.max(activeIndex - 1, 0);

  // Compute all bezier segments ONCE — curves never change shape
  const allSegments = useMemo(() => computePathSegments(points), [points]);

  // Split at the train's exact position on the curve using De Casteljau
  const { completedPathD, remainingPathD, trainPos } = useMemo(() => {
    if (allSegments.length === 0 || points.length === 0) {
      return { completedPathD: "", remainingPathD: "", trainPos: { x: 0, y: 0 } };
    }

    const segIdx = Math.min(prevIdx, allSegments.length - 1);
    const { first, second } = splitBezierAt(allSegments[segIdx], progress);

    // Completed = all fully traversed segments + first half of current segment
    const completedSegs = [...allSegments.slice(0, segIdx), first];
    // Remaining = second half of current segment + all future segments
    const remainingSegs = [second, ...allSegments.slice(segIdx + 1)];

    return {
      completedPathD: segmentsToPath(completedSegs),
      remainingPathD: segmentsToPath(remainingSegs),
      trainPos: first.end, // Exact point on the original curve
    };
  }, [allSegments, points, prevIdx, progress]);

  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, z * 1.3));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, z / 1.3));

  if (points.length === 0) return null;

  // Calculate translation for smooth camera follow using VIEW_W and VIEW_H
  const tx = VIEW_W / 2 - trainPos.x * zoom;
  const ty = VIEW_H * 0.4 - trainPos.y * zoom;

  return (
    <>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
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
          <g opacity="0.1" fill="none" stroke="var(--ink)" strokeWidth="3" transform={`scale(${MAP_W / 1000})`}>
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
              {/* Pulsing ring */}
              <circle r="22" fill="none" stroke={lineColor} strokeWidth="3">
                <animate attributeName="r" values="18; 28" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1; 0" dur="1.2s" repeatCount="indefinite" />
              </circle>
              {/* Solid train body background */}
              <circle r="18" fill={lineColor} stroke="var(--void)" strokeWidth="3" />
              
              {/* Train icon paths */}
              <g transform="translate(-12, -12)">
                <path d="M8 3.1V7a4 4 0 0 0 8 0V3.1" fill="none" stroke="var(--void)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m9 15-1-1" fill="none" stroke="var(--void)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m15 15 1-1" fill="none" stroke="var(--void)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z" fill="none" stroke="var(--void)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m8 19-2 3" fill="none" stroke="var(--void)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m16 19 2 3" fill="none" stroke="var(--void)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>
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

function createStationIcon(isCompleted, lineColor) {
  const c = isCompleted ? (lineColor || "#16a34a") : "#334155";
  const s = isCompleted ? (lineColor ? `${lineColor}99` : "rgba(22,163,74,0.6)") : "rgba(0,0,0,0.4)";
  return L.divIcon({
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${c};border:2px solid #fff;box-shadow:0 0 8px ${s}"><div style="width:4px;height:4px;border-radius:50%;background:#fff;margin:4px auto"></div></div>`,
    className: "custom-station-pin",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function createTrainIcon(lineColor) {
  const c = lineColor || "#16a34a";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="18" fill="${c}" stroke="var(--void)" stroke-width="3" />
    <g transform="translate(12, 12)">
      <path d="M8 3.1V7a4 4 0 0 0 8 0V3.1" fill="none" stroke="var(--void)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="m9 15-1-1" fill="none" stroke="var(--void)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="m15 15 1-1" fill="none" stroke="var(--void)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z" fill="none" stroke="var(--void)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="m8 19-2 3" fill="none" stroke="var(--void)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="m16 19 2 3" fill="none" stroke="var(--void)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  </svg>`;

  return L.divIcon({
    html: `<div style="filter:drop-shadow(0 0 10px ${c})">${svg}</div>`,
    className: "custom-train-pin",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function GeographicMap({ stations, activeIndex, userInputLength, targetLength, theme, lineColor }) {
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
        <Polyline positions={completedPath} color={lineColor || "#16a34a"} weight={6} opacity={0.95} />
        <Polyline positions={remainingPath} color="#475569" weight={5} opacity={0.75} />
        {stations.map((s, i) => (
          <Marker key={s.id} position={s.coordinates} icon={createStationIcon(i < activeIndex, lineColor)} />
        ))}
        <Marker position={trainCoords} icon={createTrainIcon(lineColor)} zIndexOffset={1000} />
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
          lineColor={lineColor}
        />
      )}

      {/* Unified Glassmorphism Map Toggle Button */}
      <button
        onClick={() => setMode((m) => (m === "schematic" ? "geographic" : "schematic"))}
        onMouseDown={(e) => e.preventDefault()}
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
}

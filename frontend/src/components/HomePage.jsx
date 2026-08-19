import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Train,
  MapPin,
  Keyboard,
  Gauge,
  Play,
  Star,
  ChevronRight,
} from "lucide-react";
import { CITY_CATALOG } from "../data/cities/index";

// ---------------------------------------------------------------------------
// useCountUp — eased number counter
// ---------------------------------------------------------------------------
function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

// ---------------------------------------------------------------------------
// Typing animation — types and erases station names
// ---------------------------------------------------------------------------
const CYCLING_STATIONS = [
  "RAJIV CHOWK",
  "ANDHERI",
  "MG ROAD",
  "HOWRAH MAIDAN",
  "GHATKOPAR",
  "SILK INSTITUTE",
];

function TypingWord() {
  const [wordIdx, setWordIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState("typing");

  useEffect(() => {
    const word = CYCLING_STATIONS[wordIdx];
    let timeout;
    if (phase === "typing") {
      if (displayed.length < word.length) {
        timeout = setTimeout(
          () => setDisplayed(word.slice(0, displayed.length + 1)),
          75
        );
      } else {
        timeout = setTimeout(() => setPhase("pausing"), 1600);
      }
    } else if (phase === "pausing") {
      timeout = setTimeout(() => setPhase("erasing"), 500);
    } else {
      if (displayed.length > 0) {
        timeout = setTimeout(
          () => setDisplayed(displayed.slice(0, -1)),
          40
        );
      } else {
        setWordIdx((i) => (i + 1) % CYCLING_STATIONS.length);
        setPhase("typing");
      }
    }
    return () => clearTimeout(timeout);
  }, [displayed, phase, wordIdx]);

  return (
    <span className="hp-typing-word">
      {displayed}
      <span className="hp-typing-cursor" />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Scroll-driven train background — train moves right→left as you scroll
// ---------------------------------------------------------------------------
function TrainBackground() {
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(h > 0 ? window.scrollY / h : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Train starts at 50% (center) and moves to -30% (left) as page scrolls
  const trainX = 80 - scrollPct * 80;
  // Train starts in middle of hero initially (~25% down) and moves to ~85%
  const trainY = 25 + scrollPct * 60;
  
  // Train "comes out" (scales vertically and horizontally) as it moves down
  const trainScale = 1.05 + scrollPct * 0.45;
  // Starts more visible and gets slightly clearer
  const opacity = 0.6 + scrollPct * 0.25;

  return (
    <div className="hp-train-bg" aria-hidden="true">
      {/* Track line */}
      <svg
        className="hp-tracks"
        viewBox="0 0 1200 40"
        preserveAspectRatio="none"
        style={{ top: `${trainY}%` }}
      >
        {/* Rail lines */}
        <line x1="0" y1="18" x2="1200" y2="18" stroke="var(--ink-muted)" strokeWidth="2" opacity=".3" />
        <line x1="0" y1="26" x2="1200" y2="26" stroke="var(--ink-muted)" strokeWidth="2" opacity=".3" />
        {/* Ties */}
        {Array.from({ length: 60 }, (_, i) => (
          <rect
            key={i}
            x={i * 20 + 2}
            y="14"
            width="8"
            height="16"
            rx="1"
            fill="var(--ink-muted)"
            opacity=".25"
          />
        ))}
      </svg>

      {/* Train SVG */}
      <div
        className="hp-train-sprite"
        style={{
          left: `${trainX}%`,
          top: `${trainY}%`,
          transform: `translate(-50%, -50%) scale(${trainScale})`,
          opacity: opacity,
        }}
      >
        <svg
          width="180"
          height="60"
          viewBox="0 0 180 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Body */}
          <rect x="8" y="10" width="164" height="34" rx="8" fill="var(--panel)" stroke="var(--border)" strokeWidth="1.5" />
          {/* Stripe */}
          <rect x="8" y="28" width="164" height="6" fill="var(--marigold)" opacity=".7" />
          {/* Front */}
          <path d="M172 10 Q180 27 172 44" fill="var(--marigold)" opacity=".9" />
          {/* Windows */}
          <rect x="20" y="15" width="14" height="10" rx="2" fill="var(--teal)" opacity=".5" />
          <rect x="40" y="15" width="14" height="10" rx="2" fill="var(--teal)" opacity=".5" />
          <rect x="60" y="15" width="14" height="10" rx="2" fill="var(--teal)" opacity=".5" />
          <rect x="80" y="15" width="14" height="10" rx="2" fill="var(--teal)" opacity=".5" />
          <rect x="100" y="15" width="14" height="10" rx="2" fill="var(--teal)" opacity=".5" />
          <rect x="120" y="15" width="14" height="10" rx="2" fill="var(--teal)" opacity=".5" />
          <rect x="140" y="15" width="14" height="10" rx="2" fill="var(--teal)" opacity=".5" />
          {/* Door */}
          <rect x="54" y="30" width="10" height="14" rx="1" fill="var(--ink-muted)" opacity=".3" />
          <rect x="110" y="30" width="10" height="14" rx="1" fill="var(--ink-muted)" opacity=".3" />
          {/* Wheels */}
          <circle cx="35" cy="48" r="5" fill="var(--ink-muted)" />
          <circle cx="35" cy="48" r="2" fill="var(--panel)" />
          <circle cx="85" cy="48" r="5" fill="var(--ink-muted)" />
          <circle cx="85" cy="48" r="2" fill="var(--panel)" />
          <circle cx="145" cy="48" r="5" fill="var(--ink-muted)" />
          <circle cx="145" cy="48" r="2" fill="var(--panel)" />
          {/* Headlight */}
          <circle cx="175" cy="20" r="3" fill="var(--marigold)" />
        </svg>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Featured line card
// ---------------------------------------------------------------------------
const FEATURED_LINES = [
  { cityId: "delhi", lineId: "yellow_line" },
  { cityId: "mumbai", lineId: "blue_line" },
  { cityId: "bengaluru", lineId: "purple_line" },
  { cityId: "kolkata", lineId: "blue_line" },
];

function FeaturedCard({ cityId, lineId }) {
  const navigate = useNavigate();
  const city = CITY_CATALOG[cityId];
  const line = city?.lines.find((l) => l.id === lineId);
  if (!city || !line) return null;

  return (
    <button
      className="hp-fcard"
      style={{ "--lc": line.color }}
      onClick={() => navigate(`/${cityId}/${lineId}`)}
    >
      <div className="hp-fcard-strip" />
      <div className="hp-fcard-top">
        <span className="hp-fcard-badge">
          {line.code || line.name.slice(0, 2).toUpperCase()}
        </span>
        <span className="hp-fcard-city">{city.name}</span>
      </div>
      <div className="hp-fcard-name">{line.name}</div>
      <div className="hp-fcard-term">{line.terminals}</div>
      <div className="hp-fcard-foot">
        <span className="hp-fcard-stops">
          <MapPin size={10} /> {line.stations} stations
        </span>
        <span className="hp-fcard-play">
          Play <Play size={12} fill="currentColor" />
        </span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function HomePage() {
  const navigate = useNavigate();
  const cities = Object.values(CITY_CATALOG);
  const totalLines = cities.reduce((acc, c) => acc + c.lines.length, 0);
  const totalStations = cities.reduce(
    (acc, c) => acc + c.lines.reduce((s, l) => s + l.stations, 0),
    0
  );

  const linesCount = useCountUp(totalLines);
  const stationsCount = useCountUp(totalStations);
  const citiesCount = useCountUp(cities.length);

  const featuredCity = cities[0];
  const featuredLine = featuredCity?.lines?.[0];

  return (
    <div className="hp">
      <style>{`

        .hp {
          position: relative;
          background: var(--void);
          color: var(--ink);
          font-family: inherit;
          min-height: 100vh;
          transition: background .25s, color .25s;
          overflow-x: hidden;
        }
        .hp *, .hp *::before, .hp *::after { box-sizing: border-box; }
        .hp :focus-visible { outline: 2px solid var(--marigold); outline-offset: 3px; border-radius: 4px; }

        /* ====== TRAIN BACKGROUND (behind everything) ====== */
        .hp-train-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .hp-tracks {
          position: absolute;
          left: 0; right: 0;
          width: 100%;
          height: 40px;
          transition: top .05s linear;
        }
        .hp-train-sprite {
          position: absolute;
          /* Transform and opacity are set dynamically inline */
          transition: left .08s linear, top .05s linear, transform .1s linear, opacity .1s linear;
          filter: drop-shadow(0 12px 24px rgba(0,0,0,.45));
        }

        /* All page content sits above the train */
        .hp > *:not(.hp-train-bg) { position: relative; z-index: 1; }

        /* ====== HERO ====== */
        .hp-hero {
          max-width: 1080px;
          margin: 0 auto;
          padding: 5rem 2.5rem 4rem;
          display: flex;
          flex-direction: column;
          gap: 1.4rem;
        }

        .hp-station-tag {
          display: inline-flex;
          align-items: center;
          gap: .5rem;
          font-family: "JetBrains Mono", monospace;
          font-size: .72rem;
          font-weight: 700;
          letter-spacing: .16em;
          text-transform: uppercase;
          color: var(--marigold);
          background: color-mix(in srgb, var(--marigold) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--marigold) 30%, transparent);
          padding: .35rem .9rem;
          border-radius: 4px;
          width: fit-content;
        }
        .hp-dot-pulse {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--teal);
          animation: hp-pulse 1.8s ease-in-out infinite;
        }
        @keyframes hp-pulse { 0%,100%{opacity:1} 50%{opacity:.25} }

        .hp-hero-title {
          font-size: clamp(2.8rem, 6.5vw, 5rem);
          font-weight: 800;
          line-height: 1.06;
          letter-spacing: -.03em;
          margin: 0;
          max-width: 700px;
        }
        .hp-hero-title em { font-style: normal; color: var(--marigold); }

        .hp-typing-line {
          display: flex;
          align-items: center;
          gap: .7rem;
          font-family: "JetBrains Mono", monospace;
          font-size: clamp(1rem, 2vw, 1.35rem);
          font-weight: 600;
          color: var(--ink-muted);
        }
        .hp-typing-prefix { color: var(--teal); }
        .hp-typing-word { color: var(--ink); min-width: 200px; }
        .hp-typing-cursor {
          display: inline-block;
          width: 2px; height: 1.2em;
          background: var(--marigold);
          margin-left: 2px;
          vertical-align: middle;
          animation: hp-blink .85s step-end infinite;
        }
        @keyframes hp-blink { 0%,100%{opacity:1} 50%{opacity:0} }

        .hp-hero-sub {
          color: var(--ink-muted);
          font-size: 1.05rem;
          line-height: 1.7;
          max-width: 560px;
          margin: 0;
        }

        .hp-ctas {
          display: flex; gap: .9rem; flex-wrap: wrap;
        }
        .hp-btn {
          font-family: inherit;
          font-size: .95rem;
          font-weight: 700;
          padding: .85rem 1.7rem;
          border-radius: 10px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: .5rem;
          border: 1px solid transparent;
          transition: transform .15s, box-shadow .15s, border-color .15s;
          text-decoration: none;
        }
        .hp-btn-pri { background: var(--marigold); color: var(--marigold-ink); }
        .hp-btn-pri:hover { transform: translateY(-2px); box-shadow: 0 8px 28px color-mix(in srgb, var(--marigold) 40%, transparent); }
        .hp-btn-sec { background: var(--panel); color: var(--ink); border-color: var(--border); }
        .hp-btn-sec:hover { border-color: var(--marigold); }
        .hp-btn-ghost { background: transparent; color: var(--marigold); border: none; padding: .6rem 0; font-weight: 700; }
        .hp-btn-ghost:hover { text-decoration: underline; }

        .hp-stats {
          display: flex; gap: 2.5rem; flex-wrap: wrap;
          padding-top: 1.4rem;
          border-top: 1px solid var(--border);
        }
        .hp-stat-val {
          font-family: "JetBrains Mono", monospace;
          font-size: 2rem; font-weight: 700; line-height: 1;
        }
        .hp-stat-lbl {
          font-size: .65rem; letter-spacing: .12em;
          text-transform: uppercase; color: var(--ink-muted); font-weight: 600;
          margin-top: 4px;
        }
        .hp-stat-div { width: 1px; background: var(--border); align-self: stretch; }

        /* ====== HOW IT WORKS ====== */
        .hp-how {
          max-width: 1080px;
          margin: 0 auto;
          padding: 4rem 2.5rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3.5rem;
          align-items: center;
        }

        .hp-how-img {
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-md);
        }
        .hp-how-img img { width: 100%; display: block; }
        .hp-how-img-tag {
          position: absolute;
          bottom: .8rem; left: .8rem;
          background: color-mix(in srgb, var(--void) 85%, transparent);
          backdrop-filter: blur(8px);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: .45rem .8rem;
          font-size: .72rem;
          color: var(--ink-muted);
          display: flex; align-items: center; gap: .4rem;
        }
        .hp-how-img-tag .hp-tag-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--teal);
          animation: hp-pulse 1.8s ease-in-out infinite;
        }

        .hp-section-tag {
          font-size: .72rem; font-weight: 700;
          letter-spacing: .14em; text-transform: uppercase;
          color: var(--marigold); margin-bottom: .8rem;
        }
        .hp-how-title {
          font-size: clamp(1.6rem, 3vw, 2.3rem);
          font-weight: 800; letter-spacing: -.02em;
          line-height: 1.12; margin: 0 0 1rem;
        }
        .hp-how-title em { font-style: normal; color: var(--marigold); }
        .hp-how-desc {
          color: var(--ink-muted);
          font-size: .95rem; line-height: 1.75;
          margin: 0 0 1.8rem;
        }

        .hp-steps { display: flex; flex-direction: column; gap: .85rem; }
        .hp-step { display: flex; align-items: flex-start; gap: .9rem; }
        .hp-step-icon {
          width: 34px; height: 34px; border-radius: 9px;
          background: color-mix(in srgb, var(--marigold) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--marigold) 30%, transparent);
          color: var(--marigold);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 1px;
        }
        .hp-step-title { font-weight: 700; font-size: .93rem; margin-bottom: 2px; }
        .hp-step-desc { color: var(--ink-muted); font-size: .82rem; line-height: 1.55; }

        /* ====== FEATURED LINES ====== */
        .hp-featured {
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 2.5rem 4rem;
        }
        .hp-featured-head {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-bottom: 1.4rem;
          padding-bottom: .9rem;
          border-bottom: 1px solid var(--border);
          gap: 1rem; flex-wrap: wrap;
        }
        .hp-featured-title {
          font-size: 1.4rem; font-weight: 800;
          letter-spacing: -.01em; margin: 0;
          display: flex; align-items: center; gap: .5rem;
        }
        .hp-featured-title svg { color: var(--marigold); }
        .hp-featured-count {
          font-family: "JetBrains Mono", monospace;
          font-size: .74rem; color: var(--ink-muted); white-space: nowrap;
        }

        .hp-fgrid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: .9rem;
          margin-bottom: 1.6rem;
        }

        .hp-fcard {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 1.1rem;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          color: var(--ink);
          display: flex;
          flex-direction: column;
          gap: .4rem;
          position: relative;
          overflow: hidden;
          transition: transform .15s, border-color .18s, box-shadow .18s;
        }
        .hp-fcard-strip {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--lc, var(--marigold));
        }
        .hp-fcard:hover {
          transform: translateY(-3px);
          border-color: var(--lc, var(--marigold));
          box-shadow: 0 6px 20px color-mix(in srgb, var(--lc, var(--marigold)) 22%, transparent);
        }
        .hp-fcard-top { display: flex; align-items: center; gap: .5rem; margin-top: .2rem; }
        .hp-fcard-badge {
          background: var(--lc, var(--marigold));
          color: #14100b;
          font-family: "JetBrains Mono", monospace;
          font-weight: 700; font-size: .67rem;
          padding: .2rem .5rem; border-radius: 5px;
          letter-spacing: .04em;
        }
        .hp-fcard-city { font-size: .7rem; color: var(--ink-muted); font-weight: 600; }
        .hp-fcard-name { font-size: 1rem; font-weight: 700; }
        .hp-fcard-term { font-size: .76rem; color: var(--ink-muted); line-height: 1.5; flex: 1; }
        .hp-fcard-foot { display: flex; align-items: center; justify-content: space-between; margin-top: .3rem; }
        .hp-fcard-stops {
          display: inline-flex; align-items: center; gap: .3rem;
          font-size: .71rem; color: var(--ink-muted);
          font-family: "JetBrains Mono", monospace; font-weight: 600;
        }
        .hp-fcard-play {
          display: inline-flex; align-items: center; gap: .3rem;
          font-size: .8rem; font-weight: 700; color: var(--marigold);
          transition: gap .15s;
        }
        .hp-fcard:hover .hp-fcard-play { gap: .5rem; }

        .hp-browse-cta {
          text-align: center;
        }

        /* ====== FOOTER ====== */
        .hp-footer {
          max-width: 1080px;
          margin: 0 auto;
          padding: 2.2rem 2.5rem 3rem;
          display: flex; align-items: center;
          justify-content: space-between;
          gap: 1rem; flex-wrap: wrap;
          border-top: 1px solid var(--border);
        }
        .hp-footer-copy { font-size: .78rem; color: var(--ink-muted); line-height: 1.6; margin: 0; }
        .hp-footer-tag {
          display: inline-flex; align-items: center; gap: .4rem;
          font-family: "JetBrains Mono", monospace;
          font-size: .7rem; font-weight: 700;
          color: var(--marigold); letter-spacing: .06em;
        }

        /* ====== RESPONSIVE ====== */
        @media (max-width: 860px) {
          .hp-how { grid-template-columns: 1fr; gap: 2rem; }
          .hp-how-img { max-width: 420px; margin: 0 auto; }
          .hp-train-bg { display: none; }
        }
        @media (max-width: 600px) {
          .hp-hero { padding: 3.5rem 1.2rem 2.5rem; }
          .hp-featured, .hp-how { padding-left: 1.2rem; padding-right: 1.2rem; }
          .hp-hero-title { font-size: 2.3rem; }
          .hp-stats { gap: 1.4rem; }
          .hp-stat-div { display: none; }
          .hp-fgrid { grid-template-columns: 1fr; }
          .hp-footer { flex-direction: column; text-align: center; padding-left: 1.2rem; padding-right: 1.2rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hp *, .hp *::before, .hp *::after { animation: none !important; transition: none !important; }
          .hp-train-bg { display: none; }
        }
      `}</style>

      {/* ═══ Scroll-driven train background ═══ */}
      <TrainBackground />

      {/* ═══ HERO ═══ */}
      <section className="hp-hero">
        <div className="hp-station-tag">
          <span className="hp-dot-pulse" />
          Now boarding · {cities.length} cities active
        </div>

        <h1 className="hp-hero-title">
          Type your way across<br />
          <em>India's railways</em>
        </h1>

        <div className="hp-typing-line">
          <span className="hp-typing-prefix">Next stop →</span>
          <TypingWord />
        </div>

        <p className="hp-hero-sub">
          Pick a metro line, type every station name in order, and race the
          train to the terminus. Real networks, real stations, real fun.
        </p>

        <div className="hp-ctas">
          {featuredLine && (
            <button
              className="hp-btn hp-btn-pri"
              onClick={() =>
                navigate(`/${featuredCity.id}/${featuredLine.id}`)
              }
            >
              <Play size={15} fill="currentColor" />
              Start on {featuredLine.name}
            </button>
          )}
          <button
            className="hp-btn hp-btn-sec"
            onClick={() => navigate("/lines")}
          >
            Browse all lines <ArrowRight size={15} />
          </button>
        </div>

        <div className="hp-stats">
          <div>
            <div className="hp-stat-val">{citiesCount}</div>
            <div className="hp-stat-lbl">Cities</div>
          </div>
          <div className="hp-stat-div" />
          <div>
            <div className="hp-stat-val">{linesCount}</div>
            <div className="hp-stat-lbl">Lines</div>
          </div>
          <div className="hp-stat-div" />
          <div>
            <div className="hp-stat-val">{stationsCount}+</div>
            <div className="hp-stat-lbl">Stations</div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="hp-how">
        <div className="hp-how-img">
          <img
            src="/metro_network_map.png"
            alt="India metro rail network map"
            loading="lazy"
          />
          <div className="hp-how-img-tag">
            <span className="hp-tag-dot" /> {totalLines} lines across India
          </div>
        </div>

        <div>
          <div className="hp-section-tag">How it works</div>
          <h2 className="hp-how-title">
            Pick a line. Type the <em>stations</em>.<br />Reach the terminus.
          </h2>
          <p className="hp-how-desc">
            Every keystroke counts. The next station's name lights up — type it
            correctly and the train pulls forward one stop. A wrong key simply
            doesn't move you, so there's nothing to undo. Finish the line and
            see your time, WPM and accuracy.
          </p>
          <div className="hp-steps">
            <div className="hp-step">
              <div className="hp-step-icon"><Train size={16} /></div>
              <div>
                <div className="hp-step-title">1 · Choose your line</div>
                <div className="hp-step-desc">
                  Delhi, Mumbai, Bengaluru, Kolkata — pick any metro line from
                  {" "}{totalLines} routes across {cities.length} cities.
                </div>
              </div>
            </div>
            <div className="hp-step">
              <div className="hp-step-icon"><Keyboard size={16} /></div>
              <div>
                <div className="hp-step-title">2 · Type to advance</div>
                <div className="hp-step-desc">
                  The next station name appears. Spell it right and the train
                  moves forward. No backspace, no penalties — just pure typing.
                </div>
              </div>
            </div>
            <div className="hp-step">
              <div className="hp-step-icon"><Gauge size={16} /></div>
              <div>
                <div className="hp-step-title">3 · Finish & review</div>
                <div className="hp-step-desc">
                  Reach the terminus and see your total time, words per minute,
                  accuracy and a split for every station.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURED LINES ═══ */}
      <section className="hp-featured">
        <div className="hp-featured-head">
          <h2 className="hp-featured-title">
            <Train size={20} /> Start with one of these
          </h2>
          <span className="hp-featured-count">
            Featured routes
          </span>
        </div>

        <div className="hp-fgrid">
          {FEATURED_LINES.map((fl) => (
            <FeaturedCard
              key={`${fl.cityId}-${fl.lineId}`}
              cityId={fl.cityId}
              lineId={fl.lineId}
            />
          ))}
        </div>

        <div className="hp-browse-cta">
          <button className="hp-btn hp-btn-sec" onClick={() => navigate("/lines")}>
            See all {totalLines} line guides <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="hp-footer">
        <p className="hp-footer-copy">
          Fan-made typing game · Station names are public facts · Not affiliated
          with any metro or railway operator.
        </p>
        <div className="hp-footer-tag">
          <Star size={12} fill="currentColor" /> RAILTYPE.INDIA
        </div>
      </footer>
    </div>
  );
}

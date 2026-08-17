import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon, ArrowRight } from "lucide-react";
import { CITY_CATALOG } from "../data/cities/index";

// npm i lucide-react
// Fonts: IBM Plex Sans + IBM Plex Mono, loaded via @import below for a zero-config
// drop-in. For production, prefer preloading them as <link> tags in index.html instead
// (faster first paint) — see the comment above the <style> block.

// ---------------------------------------------------------------------------
// Sample rows for the hero departure board. This is a decorative flourish, not
// live data — swap the names for a handful of real stations from CITY_CATALOG,
// or wire it up to actually rotate through your catalog if you want it to stay
// in sync automatically (see the commented alternative below the array).
// ---------------------------------------------------------------------------
const BOARD_ROWS = [
  {
    code: "YL",
    color: "#F2C94C",
    city: "DELHI",
    names: ["RAJIV CHOWK", "KASHMERE GATE"],
  },
  {
    code: "M1",
    color: "#4C8DF2",
    city: "MUMBAI",
    names: ["GHATKOPAR", "ANDHERI"],
  },
  {
    code: "PPL",
    color: "#9B6BD9",
    city: "BENGALURU",
    names: ["MG ROAD", "BAIYYAPPANAHALLI"],
  },
  {
    code: "BL",
    color: "#5FBF6B",
    city: "CHENNAI",
    names: ["ESPLANADE", "AIRPORT"],
  },
];
// Alternative: derive rows straight from your catalog so the board can never
// drift out of sync with real data —
//   const BOARD_ROWS = cities.slice(0, 4).map((c) => ({
//     code: c.lines[0]?.code, color: c.lines[0]?.color, city: c.name.toUpperCase(),
//     names: [c.lines[0]?.terminals?.split("⇄")[0]?.trim(), c.lines[0]?.terminals?.split("⇄")[1]?.trim()],
//   }));

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function scrambleTo(el, target, duration = 700) {
  if (!el) return;
  const chars = target.split("");
  const totalFrames = Math.round(duration / 40);
  const revealAt = chars.map((_, i) =>
    Math.round(totalFrames * (i / chars.length)),
  );
  let frame = 0;
  const iv = setInterval(() => {
    frame++;
    el.textContent = chars
      .map((c, i) => {
        if (c === " ") return " ";
        return frame > revealAt[i]
          ? c
          : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      })
      .join("");
    if (frame > totalFrames) {
      clearInterval(iv);
      el.textContent = target;
    }
  }, 40);
  return iv;
}

/** Signature hero element: a split-flap departure board, styled after the
 *  Solari boards still found at older Indian railway stations. Purely
 *  decorative — cycles a handful of station names on a timer. */
function DepartureBoard() {
  const rowRefs = useRef([]);
  const rowIdx = useRef(BOARD_ROWS.map(() => 0));

  useEffect(() => {
    BOARD_ROWS.forEach((row, i) =>
      scrambleTo(rowRefs.current[i], row.names[0]),
    );
    const interval = setInterval(() => {
      BOARD_ROWS.forEach((row, i) => {
        setTimeout(() => {
          rowIdx.current[i] = (rowIdx.current[i] + 1) % row.names.length;
          scrambleTo(rowRefs.current[i], row.names[rowIdx.current[i]]);
        }, i * 220);
      });
    }, 4200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="board" aria-hidden="true">
      <div className="board-head">
        <span>Platform 1 · Now boarding</span>
        <span className="live">on time</span>
      </div>
      <div className="board-rows">
        {BOARD_ROWS.map((row, i) => (
          <div className="board-row" key={row.code + i}>
            <span className="row-code" style={{ background: row.color }}>
              {row.code}
            </span>
            <span
              className="row-name"
              ref={(el) => (rowRefs.current[i] = el)}
            />
            <span className="row-city">{row.city}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Counts a number up from 0 on mount, eased — used for the hero stat strip. */
function useCountUp(target, duration = 900) {
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

function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem("railtype-theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("railtype-theme", theme);
  }, [theme]);
  return [theme, setTheme];
}

export default function HomePage() {
  const navigate = useNavigate();
  const [theme, setTheme] = useTheme();

  const cities = Object.values(CITY_CATALOG);
  const totalLines = cities.reduce((acc, c) => acc + c.lines.length, 0);
  const totalStations = cities.reduce(
    (acc, c) => acc + c.lines.reduce((lAcc, l) => lAcc + l.stations, 0),
    0,
  );

  const linesCount = useCountUp(totalLines);
  const stationsCount = useCountUp(totalStations);
  const citiesCount = useCountUp(cities.length);

  // Feature the first line from the catalog instead of hardcoding a route,
  // so the hero CTA never points at a line that's been removed or renamed.
  const featuredCity = cities[0];
  const featuredLine = featuredCity?.lines?.[0];

  return (
    <div className="home-container">
      {/* For faster first paint in production, move this @import into two
          <link rel="preconnect"> + <link rel="stylesheet"> tags in index.html
          instead — @import blocks rendering until the font CSS resolves. */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700;800&display=swap');

        /* ---------- Tokens ---------- */
        .home-container, .home-container[data-theme="dark"] {
          --void: #120f0c;
          --panel: #1c1712;
          --panel-raised: #251e16;
          --border: #382c1e;
          --ink: #f3ede2;
          --ink-muted: #a89c89;
          --marigold: #f2a900;
          --marigold-ink: #14100b;
          --teal: #2dd4bf;
          --shadow: 0 24px 48px -16px rgba(0,0,0,0.55);
        }
        .home-container[data-theme="light"] {
          --void: #eef1ee;
          --panel: #ffffff;
          --panel-raised: #f6f5f0;
          --border: #dcdad0;
          --ink: #17130f;
          --ink-muted: #6b6459;
          --marigold: #b3790a;
          --marigold-ink: #ffffff;
          --teal: #0e8a79;
          --shadow: 0 24px 48px -20px rgba(23,19,15,0.16);
        }

        .home-container {
          background-color: var(--void);
          color: var(--ink);
          font-family: "IBM Plex Sans", system-ui, -apple-system, sans-serif;
          transition: background-color .25s ease, color .25s ease;
          box-sizing: border-box;
        }
        .home-container * { box-sizing: border-box; }
        .home-container :focus-visible { outline: 2px solid var(--marigold); outline-offset: 3px; border-radius: 4px; }
        .mono { font-family: "IBM Plex Mono", ui-monospace, monospace; }

        /* ---------- Nav ---------- */
        .nav {
          position: sticky; top: 0; z-index: 20;
          backdrop-filter: blur(10px);
          background: color-mix(in srgb, var(--void) 82%, transparent);
          border-bottom: 1px solid var(--border);
          padding: 1.1rem 3rem;
          display: flex; align-items: center; justify-content: space-between;
        }
        .wordmark { display: flex; align-items: baseline; gap: .5rem; font-weight: 700; font-size: 1.05rem; letter-spacing: .08em; }
        .wordmark .dot { color: var(--marigold); }
        .wordmark small { font-family: "IBM Plex Sans", sans-serif; font-weight: 500; font-size: .72rem; color: var(--ink-muted); letter-spacing: 0; }
        .nav-links { display: flex; align-items: center; gap: 1.8rem; }
        .nav-links a { text-decoration: none; font-size: .88rem; color: var(--ink-muted); font-weight: 500; cursor: pointer; }
        .nav-links a:hover { color: var(--ink); }
        .theme-btn {
          width: 38px; height: 38px; border-radius: 10px; border: 1px solid var(--border); background: var(--panel);
          display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ink);
          transition: border-color .15s ease, transform .15s ease;
        }
        .theme-btn:hover { border-color: var(--marigold); transform: translateY(-1px); }

        /* ---------- Hero ---------- */
        .hero {
          max-width: 1180px; margin: 0 auto; padding: 4rem 3rem 3rem;
          display: grid; grid-template-columns: 1.15fr .85fr; gap: 3.5rem; align-items: center;
        }
        .eyebrow {
          display: inline-flex; align-items: center; gap: .5rem; font-size: .78rem; letter-spacing: .12em;
          text-transform: uppercase; color: var(--marigold); font-weight: 600; margin-bottom: 1.1rem;
        }
        .eyebrow::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--marigold); }
        .hero-title { font-size: clamp(2.3rem, 4.4vw, 3.6rem); line-height: 1.06; font-weight: 800; letter-spacing: -.02em; margin: 0 0 1.3rem; }
        .hero-title em { color: var(--marigold); font-style: normal; }
        .hero-subtitle { color: var(--ink-muted); font-size: 1.05rem; line-height: 1.65; max-width: 520px; margin: 0 0 2.1rem; }
        .hero-cta-group { display: flex; gap: .9rem; margin-bottom: 2.6rem; flex-wrap: wrap; }
        .btn {
          font-family: inherit; font-size: .95rem; font-weight: 600; padding: .85rem 1.5rem; border-radius: 10px;
          cursor: pointer; display: inline-flex; align-items: center; gap: .5rem; border: 1px solid transparent;
          transition: transform .15s ease, background-color .15s ease, border-color .15s ease;
        }
        .btn-primary { background: var(--marigold); color: var(--marigold-ink); }
        .btn-primary:hover { transform: translateY(-2px); }
        .btn-secondary { background: transparent; color: var(--ink); border-color: var(--border); }
        .btn-secondary:hover { border-color: var(--marigold); }

        .hero-stats { display: flex; gap: 2.4rem; border-top: 1px solid var(--border); padding-top: 1.4rem; }
        .stat-label { font-size: .68rem; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-muted); font-weight: 600; margin-bottom: 3px; }
        .stat-value { font-size: 1.7rem; font-weight: 700; }

        /* ---------- Departure board ---------- */
        .board { background: var(--panel); border: 1px solid var(--border); border-radius: 14px; box-shadow: var(--shadow); overflow: hidden; position: relative; }
        .board-head {
          display: flex; align-items: center; justify-content: space-between; padding: .8rem 1.1rem;
          border-bottom: 1px solid var(--border); font-size: .72rem; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-muted);
        }
        .board-head .live { display: flex; align-items: center; gap: .4rem; color: var(--teal); }
        .board-head .live::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--teal); animation: railtype-pulse 1.8s ease-in-out infinite; }
        @keyframes railtype-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        .board-rows { padding: .4rem 0; position: relative; }
        .board-rows::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background-image: repeating-linear-gradient(to bottom, transparent 0, transparent 41px,
            color-mix(in srgb, var(--ink) 6%, transparent) 41px, color-mix(in srgb, var(--ink) 6%, transparent) 42px);
        }
        .board-row { display: grid; grid-template-columns: 34px 1fr 76px; align-items: center; gap: .8rem; padding: .55rem 1.1rem; font-family: "IBM Plex Mono", monospace; }
        .row-code { width: 30px; height: 30px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: .68rem; font-weight: 700; color: #14100b; }
        .row-name { font-size: .96rem; font-weight: 600; letter-spacing: .04em; white-space: nowrap; overflow: hidden; }
        .row-city { font-size: .68rem; color: var(--ink-muted); text-align: right; letter-spacing: .06em; }

        /* ---------- City sections ---------- */
        .section { max-width: 1180px; margin: 5rem auto; padding: 0 3rem; }
        .city-group { margin-bottom: 3.6rem; }
        .city-header { display: flex; align-items: baseline; gap: 1rem; margin-bottom: 1.4rem; border-bottom: 1px solid var(--border); padding-bottom: .8rem; }
        .city-title { font-size: 1.9rem; font-weight: 800; letter-spacing: -.01em; margin: 0; }
        .city-operator { color: var(--marigold); font-size: .88rem; font-weight: 600; }
        .city-count { margin-left: auto; font-size: .78rem; color: var(--ink-muted); font-family: "IBM Plex Mono", monospace; }

        .routes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 1.1rem; }
        .route-card {
          background: var(--panel); border: 1px solid var(--border); border-radius: 16px; padding: 1.4rem; cursor: pointer;
          position: relative; overflow: hidden; transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
          display: flex; flex-direction: column; justify-content: space-between; min-height: 175px;
        }
        .route-card:hover, .route-card:focus-visible { transform: translateY(-4px); border-color: var(--line-color, var(--marigold)); box-shadow: var(--shadow); }
        .route-strip { position: absolute; top: 0; left: 0; right: 0; height: 5px; background: var(--line-color, var(--marigold)); }
        .rivet { position: absolute; width: 4px; height: 4px; border-radius: 50%; background: var(--border); }
        .rivet.tl { top: 10px; left: 10px; } .rivet.tr { top: 10px; right: 10px; }

        .route-head { display: flex; align-items: center; gap: .9rem; margin-top: .3rem; margin-bottom: 1.1rem; }
        .route-badge {
          width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
          font-family: "IBM Plex Mono", monospace; font-weight: 700; font-size: .78rem; color: #14100b;
          background: var(--line-color, var(--marigold)); flex-shrink: 0;
        }
        .route-title { font-size: 1.14rem; font-weight: 700; }
        .route-type { font-size: .76rem; color: var(--ink-muted); margin-top: 1px; }
        .route-terminals { font-size: .84rem; color: var(--ink-muted); margin-bottom: 1.3rem; line-height: 1.45; }

        .route-footer { display: flex; align-items: center; justify-content: space-between; margin-top: auto; }
        .route-pill { background: var(--panel-raised); color: var(--ink-muted); padding: .32rem .65rem; border-radius: 7px; font-size: .74rem; font-weight: 600; font-family: "IBM Plex Mono", monospace; }
        .route-play-btn { color: var(--marigold); font-weight: 700; font-size: .88rem; display: flex; align-items: center; gap: 4px; transition: gap .15s ease; }
        .route-card:hover .route-play-btn { gap: 8px; }

        @media (max-width: 900px) {
          .hero { grid-template-columns: 1fr; padding-top: 2.6rem; }
          .board { order: -1; }
        }
        @media (max-width: 640px) {
          .nav, .hero, .section { padding-left: 1.2rem; padding-right: 1.2rem; }
          .nav-links a:not(.theme-btn) { display: none; }
          .hero-cta-group { flex-direction: column; }
          .btn { justify-content: center; }
          .hero-stats { gap: 1.4rem; flex-wrap: wrap; }
          .routes-grid { grid-template-columns: 1fr; }
          .city-count { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .home-container * { animation: none !important; transition: none !important; }
        }
      `}</style>

      {/* Nav */}
      <nav className="nav">
        <div className="wordmark">
          RAILTYPE<span className="dot">.</span>
          <small>type your way across India's railways</small>
        </div>
        <div className="nav-links">
          <a
            onClick={() =>
              document
                .getElementById("routes-section")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Lines
          </a>
          <button
            className="theme-btn"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div>
          <div className="eyebrow">
            {cities.length} cities · live station data
          </div>
          <h1 className="hero-title">
            Type your way across <em>India's</em> railways
          </h1>
          <p className="hero-subtitle">
            Pick a line, tap in like you're through the gate, and type each
            station in order. Every correct name pulls the train one stop closer
            to the terminus.
          </p>

          <div className="hero-cta-group">
            {featuredLine && (
              <button
                className="btn btn-primary"
                onClick={() =>
                  navigate(`/${featuredCity.id}/${featuredLine.id}`)
                }
              >
                Start on {featuredLine.name}
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={() =>
                document
                  .getElementById("routes-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Browse all lines
            </button>
          </div>

          <div className="hero-stats">
            <div>
              <div className="stat-label">Lines</div>
              <div className="stat-value mono">{linesCount}</div>
            </div>
            <div>
              <div className="stat-label">Stations</div>
              <div className="stat-value mono">{stationsCount}+</div>
            </div>
            <div>
              <div className="stat-label">Cities</div>
              <div className="stat-value mono">{citiesCount}</div>
            </div>
          </div>
        </div>

        <DepartureBoard />
      </section>

      {/* Cities & lines */}
      <section className="section" id="routes-section">
        {cities.map((city) => {
          const lineStations = city.lines.reduce((a, l) => a + l.stations, 0);
          return (
            <div key={city.id} className="city-group">
              <div className="city-header">
                <h2 className="city-title">{city.name}</h2>
                <span className="city-operator">{city.operator}</span>
                <span className="city-count">
                  {city.lines.length} lines · {lineStations} stations
                </span>
              </div>

              <div className="routes-grid">
                {city.lines.map((line) => (
                  <div
                    key={line.id}
                    className="route-card"
                    role="button"
                    tabIndex={0}
                    style={{ "--line-color": line.color }}
                    onClick={() => navigate(`/${city.id}/${line.id}`)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && navigate(`/${city.id}/${line.id}`)
                    }
                  >
                    <span className="rivet tl" />
                    <span className="rivet tr" />
                    <div className="route-strip" />
                    <div>
                      <div className="route-head">
                        <div className="route-badge">{line.code}</div>
                        <div>
                          <div className="route-title">{line.name}</div>
                          <div className="route-type">{line.type}</div>
                        </div>
                      </div>
                      <div className="route-terminals">{line.terminals}</div>
                    </div>

                    <div className="route-footer">
                      <span className="route-pill">
                        {line.stations} stations
                      </span>
                      <span className="route-play-btn">
                        Play <ArrowRight size={15} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "2.4rem 3rem 3rem",
        }}
      >
        <p
          style={{
            color: "var(--ink-muted)",
            fontSize: ".82rem",
            maxWidth: 560,
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          Fan-made typing game. Station names are public facts; not affiliated
          with any metro or railway operator.
        </p>
      </footer>
    </div>
  );
}

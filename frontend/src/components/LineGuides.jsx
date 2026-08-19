import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Train,
  MapPin,
  ChevronRight,
  ChevronDown,
  Play,
  Layout,
  ArrowLeft,
} from "lucide-react";
import { CITY_CATALOG } from "../data/cities/index";

// ---------------------------------------------------------------------------
// City accordion card — lists all lines for a city
// ---------------------------------------------------------------------------
function CityCard({ city }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const totalStations = city.lines.reduce((a, l) => a + l.stations, 0);

  return (
    <div className={`lg-city${open ? " open" : ""}`}>
      <button className="lg-city-hd" onClick={() => setOpen((o) => !o)}>
        <div className="lg-city-left">
          <div className="lg-city-icon">
            <Train size={18} />
          </div>
          <div>
            <div className="lg-city-name">{city.name}</div>
            {city.operator && <div className="lg-city-op">{city.operator}</div>}
          </div>
        </div>
        <div className="lg-city-right">
          <span className="lg-pill">
            <Layout size={11} />
            {city.lines.length} lines
          </span>
          <span className="lg-pill">
            <MapPin size={11} />
            {totalStations} stations
          </span>
          {open ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
        </div>
      </button>

      {open && (
        <div className="lg-lines">
          {city.lines.map((line) => (
            <button
              key={line.id}
              className="lg-tile"
              style={{ "--lc": line.color }}
              onClick={() => navigate(`/${city.id}/${line.id}`)}
            >
              <div className="lg-tile-strip" />
              <div className="lg-tile-top">
                <span className="lg-badge">
                  {line.code || line.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="lg-type">{line.type}</span>
              </div>
              <div className="lg-tile-name">{line.name}</div>
              <div className="lg-tile-term">{line.terminals}</div>
              <div className="lg-tile-foot">
                <span className="lg-stops">
                  <MapPin size={10} />
                  {line.stations} stops
                </span>
                <span className="lg-play">
                  Play <Play size={11} fill="currentColor" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Line Guides page
// ---------------------------------------------------------------------------
export default function LineGuides() {
  const navigate = useNavigate();
  const cities = Object.values(CITY_CATALOG);
  const totalLines = cities.reduce((a, c) => a + c.lines.length, 0);
  const totalStations = cities.reduce(
    (a, c) => a + c.lines.reduce((s, l) => s + l.stations, 0),
    0,
  );

  return (
    <div className="lg">
      <style>{`

        .lg {
          background: var(--void);
          color: var(--ink);
          font-family: inherit;
          min-height: 100vh;
          transition: background .25s, color .25s;
        }
        .lg *, .lg *::before, .lg *::after { box-sizing: border-box; }
        .lg :focus-visible { outline: 2px solid var(--marigold); outline-offset: 3px; border-radius: 4px; }

        .lg-inner {
          max-width: 1080px;
          margin: 0 auto;
          padding: 3rem 2.5rem 5rem;
        }

        .lg-back {
          display: inline-flex; align-items: center; gap: .4rem;
          font-family: inherit; font-size: .85rem; font-weight: 600;
          color: var(--ink-muted); background: none; border: none;
          cursor: pointer; margin-bottom: 2rem; padding: 0;
          transition: color .15s;
        }
        .lg-back:hover { color: var(--ink); }

        .lg-head {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-bottom: 1.6rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
          flex-wrap: wrap; gap: 1rem;
        }
        .lg-title {
          font-size: 1.7rem; font-weight: 800;
          letter-spacing: -.015em; margin: 0;
          display: flex; align-items: center; gap: .6rem;
        }
        .lg-title svg { color: var(--marigold); }
        .lg-meta {
          font-family: "JetBrains Mono", monospace;
          font-size: .76rem; color: var(--ink-muted);
          white-space: nowrap;
        }

        .lg-cities { display: flex; flex-direction: column; gap: .9rem; }

        /* City accordion */
        .lg-city {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
          transition: border-color .2s, box-shadow .2s;
        }
        .lg-city.open {
          border-color: color-mix(in srgb, var(--marigold) 45%, transparent);
          box-shadow: var(--shadow-sm);
        }
        .lg-city-hd {
          width: 100%; background: none; border: none;
          padding: 1.1rem 1.3rem;
          display: flex; align-items: center;
          justify-content: space-between;
          gap: 1rem; cursor: pointer;
          color: var(--ink); font-family: inherit;
          transition: background .15s;
        }
        .lg-city-hd:hover { background: color-mix(in srgb, var(--marigold) 5%, transparent); }

        .lg-city-left { display: flex; align-items: center; gap: .9rem; }
        .lg-city-icon {
          width: 42px; height: 42px; border-radius: 10px;
          background: color-mix(in srgb, var(--marigold) 14%, transparent);
          border: 1px solid color-mix(in srgb, var(--marigold) 28%, transparent);
          display: flex; align-items: center; justify-content: center;
          color: var(--marigold); flex-shrink: 0;
        }
        .lg-city-name { font-size: 1.08rem; font-weight: 800; letter-spacing: -.01em; text-align:left; }
        .lg-city-op { font-size: .72rem; color: var(--marigold); font-weight: 600; margin-top: 2px; }
        .lg-city-right { display: flex; align-items: center; gap: .55rem; flex-shrink: 0; color: var(--ink-muted); }
        .lg-pill {
          display: inline-flex; align-items: center; gap: .3rem;
          font-size: .72rem; font-weight: 600; color: var(--ink-muted);
          background: var(--panel-raised); border: 1px solid var(--border);
          padding: .25rem .6rem; border-radius: 99px; white-space: nowrap;
        }

        /* Line tiles grid */
        .lg-lines {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: .8rem;
          padding: 1rem 1.2rem 1.2rem;
          border-top: 1px solid var(--border);
        }
        .lg-tile {
          background: var(--panel-raised);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1rem;
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
        .lg-tile-strip {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: var(--lc, var(--marigold));
        }
        .lg-tile:hover {
          transform: translateY(-3px);
          border-color: var(--lc, var(--marigold));
          box-shadow: 0 6px 20px color-mix(in srgb, var(--lc, var(--marigold)) 22%, transparent);
        }
        .lg-tile-top { display: flex; align-items: center; gap: .4rem; margin-top: .15rem; }
        .lg-badge {
          background: var(--lc, var(--marigold));
          color: #14100b;
          font-family: "JetBrains Mono", monospace;
          font-weight: 700; font-size: .67rem;
          padding: .2rem .5rem; border-radius: 5px;
          letter-spacing: .04em;
        }
        .lg-type { font-size: .68rem; color: var(--ink-muted); font-weight: 600; letter-spacing: .06em; text-transform: uppercase; }
        .lg-tile-name { font-size: .98rem; font-weight: 700; }
        .lg-tile-term { font-size: .76rem; color: var(--ink-muted); line-height: 1.5; flex: 1; }
        .lg-tile-foot { display: flex; align-items: center; justify-content: space-between; margin-top: .2rem; }
        .lg-stops {
          display: inline-flex; align-items: center; gap: .3rem;
          font-size: .71rem; color: var(--ink-muted);
          font-family: "JetBrains Mono", monospace; font-weight: 600;
        }
        .lg-play {
          display: inline-flex; align-items: center; gap: .3rem;
          font-size: .8rem; font-weight: 700; color: var(--marigold);
          transition: gap .15s;
        }
        .lg-tile:hover .lg-play { gap: .5rem; }

        @media (max-width: 600px) {
          .lg-inner { padding: 2rem 1.2rem 3rem; }
          .lg-lines { grid-template-columns: 1fr; }
          .lg-city-right .lg-pill:first-child { display: none; }
        }
      `}</style>

      <div className="lg-inner">
        <button className="lg-back" onClick={() => navigate("/")}>
          <ArrowLeft size={15} /> Back to home
        </button>

        <div className="lg-head">
          <h1 className="lg-title">
            <Train size={22} /> Line Guides
          </h1>
          <span className="lg-meta">
            {cities.length} cities · {totalLines} lines · {totalStations}{" "}
            stations
          </span>
        </div>

        <div className="lg-cities">
          {cities.map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, MapPin, Share2, MousePointer2 } from "lucide-react";
import { CITY_CATALOG, loadRouteData } from "../data/cities/index";

export default function LineInfo() {
  const { cityId, lineId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  // Find the basic catalog info (for the color, total stations, etc.)
  const city = CITY_CATALOG[cityId];
  const catalogEntry = city?.lines.find((l) => l.id === lineId);
  const brandColor = catalogEntry ? catalogEntry.color : "var(--marigold)";

  useEffect(() => {
    async function fetchData() {
      // Load the heavy JSON file dynamically to ensure it works before playing
      await loadRouteData(cityId, lineId);
      setLoading(false);
    }
    fetchData();
  }, [cityId, lineId]);

  if (!catalogEntry)
    return <div className="li-msg">Route not found!</div>;
  if (loading) return <div className="li-msg">Connecting to data center...</div>;

  return (
    <div className="li-wrap">
      <style>{`
        .li-wrap {
          max-width: 900px;
          margin: 0 auto;
          padding: 3rem 2.5rem 5rem;
        }
        .li-back {
          display: inline-flex; align-items: center; gap: .4rem;
          font-family: inherit; font-size: .85rem; font-weight: 600;
          color: var(--ink-muted); background: none; border: none;
          cursor: pointer; margin-bottom: 2.5rem; padding: 0;
          transition: color .15s;
        }
        .li-back:hover { color: var(--ink); }

        .li-header { margin-bottom: 2.5rem; }
        .li-badge {
          display: inline-flex; align-items: center; gap: .4rem;
          font-family: "JetBrains Mono", monospace; font-size: .75rem;
          font-weight: 700; letter-spacing: .08em;
          background: color-mix(in srgb, var(--lc) 15%, transparent);
          color: var(--lc);
          padding: .3rem .7rem; border-radius: 6px;
          margin-bottom: 1.2rem; border: 1px solid color-mix(in srgb, var(--lc) 30%, transparent);
        }
        .li-title {
          font-size: clamp(2rem, 4vw, 3rem); font-weight: 800;
          letter-spacing: -.02em; margin: 0 0 .5rem; line-height: 1.1;
        }
        .li-desc {
          font-size: 1.05rem; color: var(--ink-muted);
          line-height: 1.5; margin: 0;
        }

        .li-dashboard {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 3rem;
          box-shadow: var(--shadow-sm);
        }
        .li-dash-strip { height: 4px; background: var(--lc); }
        .li-dash-stats {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        }
        .li-stat {
          padding: 1.6rem 2rem;
          border-right: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .li-stat:last-child { border-right: none; }
        .li-stat-lbl {
          font-size: .68rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: .12em;
          color: var(--ink-muted); margin-bottom: .4rem;
        }
        .li-stat-val {
          font-family: "JetBrains Mono", monospace;
          font-size: 1.8rem; font-weight: 800; color: var(--ink);
        }
        
        .li-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
        .li-btn {
          font-family: inherit; font-size: 1rem; font-weight: 700;
          padding: 1rem 2rem; border-radius: 12px; cursor: pointer;
          display: inline-flex; align-items: center; gap: .6rem;
          border: 1px solid transparent; transition: transform .15s, box-shadow .15s;
        }
        .li-btn-pri {
          background: var(--lc);
          color: #14100b; /* high contrast dark ink for yellow backgrounds */
        }
        .li-btn-pri:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px color-mix(in srgb, var(--lc) 35%, transparent);
        }
        .li-btn-sec {
          background: var(--panel-raised); color: var(--ink); border-color: var(--border);
        }
        .li-btn-sec:hover { border-color: var(--ink-muted); }

        .li-msg { padding: 4rem; text-align: center; color: var(--ink-muted); font-weight: 500; font-family: "JetBrains Mono", monospace; }

        @media (max-width: 600px) {
          .li-wrap { padding: 2rem 1.2rem 4rem; }
          .li-stat { border-right: none; }
          .li-actions { flex-direction: column; }
          .li-btn { justify-content: center; width: 100%; }
        }
      `}</style>

      <button className="li-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back to network
      </button>

      <div className="li-header" style={{ "--lc": brandColor }}>
        <div className="li-badge">
          {city.name.toUpperCase()} · {catalogEntry.code || city.operator}
        </div>
        <h1 className="li-title">{catalogEntry.name}</h1>
        <p className="li-desc">{catalogEntry.terminals}</p>
      </div>

      <div className="li-dashboard" style={{ "--lc": brandColor }}>
        <div className="li-dash-strip" />
        <div className="li-dash-stats">
          <div className="li-stat">
            <div className="li-stat-lbl">Stations</div>
            <div className="li-stat-val">{catalogEntry.stations}</div>
          </div>
          <div className="li-stat">
            <div className="li-stat-lbl">Type</div>
            <div className="li-stat-val" style={{ fontSize: "1.4rem", paddingTop: ".3rem" }}>
              {catalogEntry.type}
            </div>
          </div>
          <div className="li-stat">
            <div className="li-stat-lbl">Operator</div>
            <div className="li-stat-val" style={{ fontSize: "1.1rem", paddingTop: ".5rem" }}>
              {city.operator || "Metro"}
            </div>
          </div>
        </div>
      </div>

      <div className="li-actions" style={{ "--lc": brandColor }}>
        <button
          className="li-btn li-btn-pri"
          onClick={() => navigate(`/${cityId}/${lineId}/play`)}
        >
          <Play size={18} fill="currentColor" /> Let's go
        </button>
        <button
          className="li-btn li-btn-sec"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
          }}
        >
          <Share2 size={16} /> Share Route
        </button>
      </div>
    </div>
  );
}

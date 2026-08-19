import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Repeat, LogIn, Award, MapPin } from "lucide-react";
import { CITY_CATALOG } from "../data/cities/index";

export default function SummaryPage() {
  const { cityId, lineId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract all telemetry data passed from GameView
  const {
    timeFormatted = "0:00.00",
    cpm = 0,
    accuracy = 0,
    totalMistakes = 0,
    splits = [],
  } = location.state || {};

  const wpm = Math.round(cpm / 5);
  const city = CITY_CATALOG[cityId];
  const catalogEntry = city?.lines.find((l) => l.id === lineId);
  const brandColor = catalogEntry ? catalogEntry.color : "var(--marigold)";

  // Helper to format the split times purely for display
  const formatSplitTime = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const millis = Math.floor((ms % 1000) / 10);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}.${millis < 10 ? "0" : ""}${millis}`;
  };

  // Find the longest time to set the 100% width benchmark
  const maxSplitTime =
    splits.length > 0 ? Math.max(...splits.map((s) => s.timeMs)) : 1;

  // Find the specific fastest and slowest station names
  const fastestStation =
    splits.length > 0
      ? splits.reduce((prev, current) =>
          prev.timeMs < current.timeMs ? prev : current,
        ).name
      : "";
  const slowestStation =
    splits.length > 0
      ? splits.reduce((prev, current) =>
          prev.timeMs > current.timeMs ? prev : current,
        ).name
      : "";

  if (!catalogEntry) return <div className="sp-msg">Route not found!</div>;

  return (
    <div className="sp-wrap" style={{ "--lc": brandColor }}>
      <style>{`
        .sp-wrap {
          max-width: 900px;
          margin: 0 auto;
          padding: 3rem 2.5rem 5rem;
        }

        /* Certificate Header */
        .sp-head {
          margin-bottom: 2rem;
        }
        .sp-cert-label {
          font-family: "JetBrains Mono", monospace;
          color: var(--ink-muted);
          font-size: 0.72rem;
          letter-spacing: 0.16em;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 0.6rem;
        }
        .sp-title-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .sp-title {
          font-size: clamp(2rem, 4vw, 2.8rem);
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .sp-title span {
          font-weight: 400;
          color: var(--ink-muted);
        }
        .sp-terms {
          display: flex; gap: 0.5rem; flex-wrap: wrap;
        }
        .sp-term-badge {
          background: var(--panel-raised);
          border: 1px solid var(--border);
          padding: 0.35rem 0.8rem;
          border-radius: 99px;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--ink-muted);
        }

        /* Score Card */
        .sp-card {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2.5rem;
          margin-bottom: 2rem;
          box-shadow: var(--shadow-sm);
        }
        .sp-card-strip {
          height: 4px;
          background: var(--lc);
          margin: -2.5rem -2.5rem 2.5rem -2.5rem;
        }

        .sp-score-flex {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 2rem;
        }

        .sp-rank-box {
          background: color-mix(in srgb, var(--lc) 6%, transparent);
          border: 1px solid color-mix(in srgb, var(--lc) 25%, transparent);
          border-radius: 12px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 140px;
          color: var(--lc);
        }
        .sp-rank-icon { margin-bottom: 0.5rem; }
        .sp-rank-val { font-size: 1.5rem; font-weight: 800; }
        .sp-rank-lbl { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }

        .sp-time-col { flex: 1; min-width: 260px; }
        .sp-time-lbl {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--ink-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.4rem;
        }
        .sp-time-val {
          color: var(--lc);
          font-family: "JetBrains Mono", monospace;
          font-size: clamp(3rem, 6vw, 4.5rem);
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.04em;
          margin-bottom: 0.8rem;
          text-shadow: 0 4px 24px color-mix(in srgb, var(--lc) 20%, transparent);
        }
        .sp-pb {
          font-size: 0.85rem; color: var(--ink-muted); margin-bottom: 1rem;
        }
        .sp-login {
          font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 0.4rem;
        }
        .sp-login a { color: var(--teal); cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }

        .sp-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 2rem;
          margin-top: 2.5rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border);
        }
        .sp-metric-lbl {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--ink-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.4rem;
        }
        .sp-metric-val {
          font-family: "JetBrains Mono", monospace;
          font-size: 2.2rem;
          font-weight: 700;
          color: var(--ink);
        }
        .sp-metric-val.bad { color: #ef4444; }

        /* Splits */
        .sp-splits-card {
          background: var(--panel-raised);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2.5rem;
          margin-bottom: 2rem;
        }
        .sp-splits-title {
          font-size: 1.25rem; font-weight: 800; margin: 0 0 1.5rem;
        }
        .sp-splits-list {
          display: flex; flex-direction: column; gap: 1rem;
        }
        .sp-split-row {
          display: flex; align-items: center; gap: 1rem;
        }
        .sp-split-num {
          font-family: "JetBrains Mono", monospace;
          color: var(--ink-muted); font-size: 0.8rem; width: 24px;
        }
        .sp-split-name {
          width: 140px; font-weight: 600; font-size: 0.95rem;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sp-split-bar-wrap {
          flex: 1; height: 6px; background: var(--panel); border-radius: 4px; overflow: hidden;
        }
        .sp-split-bar {
          height: 100%; border-radius: 4px; transition: width 1s ease-out;
        }
        .sp-split-time {
          width: 65px; text-align: right; font-family: "JetBrains Mono", monospace; font-size: 0.95rem; font-weight: 600;
        }
        .sp-split-miss {
          width: 60px; text-align: right; font-size: 0.8rem; font-weight: 600;
        }
        .sp-miss-bad { color: #ef4444; }
        .sp-miss-good { color: var(--ink-muted); opacity: 0.5; }

        .sp-legend {
          display: flex; gap: 1.5rem; margin-top: 2rem; padding-top: 1.5rem;
          border-top: 1px solid var(--border); font-size: 0.8rem; color: var(--ink-muted); font-weight: 600;
        }
        .sp-legend-item { display: flex; align-items: center; gap: 0.4rem; }
        .sp-legend-dot { width: 10px; height: 10px; border-radius: 3px; }

        /* Actions */
        .sp-actions { display: flex; gap: 1rem; flex-wrap: wrap; }
        .sp-btn {
          font-family: inherit; font-size: 1rem; font-weight: 700;
          padding: 1rem 2rem; border-radius: 12px; cursor: pointer;
          display: inline-flex; align-items: center; gap: 0.6rem;
          border: 1px solid transparent; transition: transform 0.15s, box-shadow 0.15s;
        }
        .sp-btn-pri { background: var(--lc); color: #14100b; }
        .sp-btn-pri:hover { transform: translateY(-2px); box-shadow: 0 8px 24px color-mix(in srgb, var(--lc) 35%, transparent); }
        .sp-btn-sec { background: var(--panel); color: var(--ink); border: 1px solid var(--border); }
        .sp-btn-sec:hover { border-color: var(--ink-muted); }

        @media(max-width: 600px) {
          .sp-wrap { padding: 2rem 1.2rem; }
          .sp-card, .sp-splits-card { padding: 1.5rem; }
          .sp-card-strip { margin: -1.5rem -1.5rem 1.5rem -1.5rem; }
          .sp-split-name { width: 100px; }
          .sp-split-miss { display: none; }
          .sp-actions { flex-direction: column; }
          .sp-btn { width: 100%; justify-content: center; }
        }
      `}</style>

      {/* Header */}
      <div className="sp-head">
        <div className="sp-cert-label">• Run Complete •</div>
        <div className="sp-title-row">
          <h1 className="sp-title">
            {catalogEntry.name} <span>· full line</span>
          </h1>
          <div className="sp-terms">
            <span className="sp-term-badge">
              <MapPin
                size={12}
                style={{ display: "inline", transform: "translateY(1px)" }}
              />{" "}
              {catalogEntry.terminals}
            </span>
          </div>
        </div>
      </div>

      {/* Main Score Card */}
      <div className="sp-card">
        <div className="sp-card-strip" />
        <div className="sp-score-flex">
          <div className="sp-rank-box">
            <Award size={36} className="sp-rank-icon" />
            <div className="sp-rank-val">--</div>
            <div className="sp-rank-lbl">Global Rank</div>
          </div>

          <div className="sp-time-col">
            <div className="sp-time-lbl">Total Time</div>
            <div className="sp-time-val">{timeFormatted}</div>
            <div className="sp-pb">Personal best --:--.--</div>
            <div className="sp-login">
              <span>Leaderboard unavailable offline!</span>
              <a>
                <LogIn
                  size={14}
                  style={{ display: "inline", transform: "translateY(2px)" }}
                />{" "}
                Login
              </a>
            </div>
          </div>
        </div>

        <div className="sp-metrics">
          <div>
            <div className="sp-metric-lbl">WPM</div>
            <div className="sp-metric-val">{wpm}</div>
          </div>
          <div>
            <div className="sp-metric-lbl">CPM</div>
            <div className="sp-metric-val">{cpm}</div>
          </div>
          <div>
            <div className="sp-metric-lbl">Accuracy</div>
            <div className="sp-metric-val">{accuracy}%</div>
          </div>
          <div>
            <div className="sp-metric-lbl">Mistakes</div>
            <div className={`sp-metric-val ${totalMistakes > 0 ? "bad" : ""}`}>
              {totalMistakes}
            </div>
          </div>
        </div>
      </div>

      {/* Station Splits */}
      <div className="sp-splits-card">
        <h3 className="sp-splits-title">Station Splits</h3>
        <div className="sp-splits-list">
          {splits.map((split, index) => {
            const widthPercent = (split.timeMs / maxSplitTime) * 100;
            let barColor = "var(--teal)";
            if (split.name === fastestStation) barColor = "var(--marigold)";
            else if (split.name === slowestStation) barColor = "#ef4444";

            return (
              <div key={index} className="sp-split-row">
                <div className="sp-split-num">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="sp-split-name" title={split.name}>
                  {split.name}
                </div>
                <div className="sp-split-bar-wrap">
                  <div
                    className="sp-split-bar"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
                <div className="sp-split-time">
                  {formatSplitTime(split.timeMs)}
                </div>
                <div
                  className={`sp-split-miss ${split.mistakes > 0 ? "sp-miss-bad" : "sp-miss-good"}`}
                >
                  {split.mistakes} miss
                </div>
              </div>
            );
          })}
          {splits.length === 0 && (
            <div style={{ color: "var(--ink-muted)", fontStyle: "italic" }}>
              No split data available.
            </div>
          )}
        </div>

        <div className="sp-legend">
          <div className="sp-legend-item">
            <div
              className="sp-legend-dot"
              style={{ backgroundColor: "var(--marigold)" }}
            />
            Fastest: {fastestStation || "--"}
          </div>
          <div className="sp-legend-item">
            <div
              className="sp-legend-dot"
              style={{ backgroundColor: "#ef4444" }}
            />
            Slowest: {slowestStation || "--"}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="sp-actions">
        <button
          className="sp-btn sp-btn-pri"
          onClick={() => navigate(`/${cityId}/${lineId}/play`)}
        >
          <Repeat size={18} /> Play again
        </button>
        <button
          className="sp-btn sp-btn-sec"
          onClick={() => navigate(`/lines`)}
        >
          Change route
        </button>
        <button className="sp-btn sp-btn-sec" onClick={() => navigate("/")}>
          Home
        </button>
      </div>
    </div>
  );
}

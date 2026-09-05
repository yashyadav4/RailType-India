import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Repeat, LogIn, Award, MapPin, Trophy } from "lucide-react";
import { CITY_CATALOG } from "../data/cities/index";
import { useAuth } from "../context/AuthContext";
import { saveGuestRun } from "../utils/guestRuns";
import { STAMP_CATALOG } from "../data/stampCatalog";
import { useToast } from "../context/ToastContext";
import confetti from "canvas-confetti";

// ── Animated counter hook ────────────────────────────────────────────
function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
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

// ── Stamp unlock chime ───────────────────────────────────────────────
function playStampChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, t + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.4);
    });
  } catch (e) {
    /* audio not available */
  }
}

export default function SummaryPage() {
  const { cityId, lineId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, setUser } = useAuth();
  const hasSavedRef = useRef(false);
  const toast = useToast();
  const [isNewPB, setIsNewPB] = useState(false);

  const [leaderboard, setLeaderboard] = useState([]);
  const [globalRank, setGlobalRank] = useState(null);
  const [unlockedStamps, setUnlockedStamps] = useState([]);

  // Extract all telemetry data passed from GameView
  const {
    runId,
    timeFormatted = "0:00.00",
    timeMs = 0,
    cpm = 0,
    accuracy = 0,
    totalMistakes = 0,
    splits = [],
  } = location.state || {};

  // Fetch leaderboard on mount
  useEffect(() => {
    fetch(`/api/runs/leaderboard/${cityId}/${lineId}`)
      .then((res) => res.json())
      .then((data) => setLeaderboard(data))
      .catch((err) => console.error("Failed to load leaderboard:", err));
  }, [cityId, lineId]);

  // Save the run on mount (once)
  useEffect(() => {
    if (hasSavedRef.current || !timeMs) return;

    // Prevent duplicate saves on page reload using sessionStorage and runId
    if (runId && sessionStorage.getItem(`saved_run_${runId}`)) return;
    if (runId) sessionStorage.setItem(`saved_run_${runId}`, "true");

    hasSavedRef.current = true;

    const runData = {
      cityId,
      lineId,
      timeMs,
      accuracy,
      cpm,
      mistakes: totalMistakes,
    };

    if (user && token) {
      // Logged in — save to backend
      fetch("/api/runs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(runData),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.rank) setGlobalRank(data.rank);
          if (data.updatedBests) {
            // Check if this run IS the new PB
            const best = user.bests?.find(
              (b) => b.cityId === cityId && b.routeId === lineId,
            );
            if (!best || timeMs <= best.timeMs) {
              setIsNewPB(true);
              confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
              toast.success("🎉 New Personal Best!");
            }
            setUser({ ...user, bests: data.updatedBests });
          }
          if (data.newStampsEarned && data.newStampsEarned.length > 0) {
            setUnlockedStamps(data.newStampsEarned);
            playStampChime();
          }
          toast.success("Run saved successfully!");
          // Refresh leaderboard just in case this run made the top 10
          return fetch(`/api/runs/leaderboard/${cityId}/${lineId}`);
        })
        .then((res) => res.json())
        .then((data) => setLeaderboard(data))
        .catch((err) => {
          console.error("Failed to save run:", err);
          toast.error("Failed to save run. Check your connection.");
        });
    } else {
      // Guest — save to localStorage
      saveGuestRun(runData);
      toast.info("Run saved locally. Log in to sync!");
    }
  }, []);

  // Animated counters for metrics
  const animWpm = useCountUp(Math.round(cpm / 5), 1200);
  const animCpm = useCountUp(cpm, 1200);
  const animAcc = useCountUp(accuracy, 1000);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "r" || e.key === "R") navigate(`/${cityId}/${lineId}/play`);
      if (e.key === "Escape") navigate("/");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [cityId, lineId, navigate]);

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

  // Find Personal Best
  let pbFormatted = "--:--.--";
  if (user && user.bests) {
    const best = user.bests.find(
      (b) => b.cityId === cityId && b.routeId === lineId,
    );
    if (best) {
      const bestTimeMs = Math.min(best.timeMs, timeMs);
      pbFormatted = formatSplitTime(bestTimeMs);
    } else {
      pbFormatted = formatSplitTime(timeMs);
    }
  } else if (!user) {
    pbFormatted = formatSplitTime(timeMs); // Guest session PB
  }

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

        @keyframes stampHit {
          0% { transform: scale(3) rotate(calc(var(--rot) - 15deg)); opacity: 0; filter: blur(4px); }
          30% { transform: scale(0.9) rotate(calc(var(--rot) + 5deg)); opacity: 1; filter: blur(0px); }
          50% { transform: scale(1.05) rotate(var(--rot)); opacity: 1; }
          100% { transform: scale(1) rotate(var(--rot)); opacity: 0.95; }
        }
        .sp-stamp-anim {
          animation: stampHit 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          opacity: 0;
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
          text-align: center;
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
          font-size: 1.25rem; font-weight: 800; margin: 0 0 1.5rem; display: flex; align-items: center; gap: 0.5rem;
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
        .sp-actions { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem; }
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
      <div className="sp-card" style={{ position: "relative" }}>
        {unlockedStamps.map((id, index) => {
          const stamp = STAMP_CATALOG[id];
          if (!stamp) return null;
          return (
            <div
              key={id}
              className="sp-stamp-anim"
              style={{
                "--rot": `${15 + index * 10}deg`,
                position: "absolute",
                top: `${-15 + index * 15}px`,
                right: `${15 + index * 15}px`,
                animationDelay: `${index * 0.4}s`,
                zIndex: 10,
              }}
            >
              <div
                style={{
                  color: "var(--marigold)",
                  border: "4px solid var(--marigold)",
                  borderRadius: "12px",
                  padding: "0.6rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.8rem",
                  pointerEvents: "none",
                  background:
                    "color-mix(in srgb, var(--panel) 90%, transparent)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <span style={{ fontSize: "2.5rem" }}>{stamp.icon}</span>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.2rem",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 900,
                      textTransform: "uppercase",
                      fontSize: "1.3rem",
                      letterSpacing: "1px",
                      lineHeight: 1,
                    }}
                  >
                    {stamp.name}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "2px",
                      opacity: 0.8,
                      lineHeight: 1,
                    }}
                  >
                    Unlocked!
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div class="sp-card-strip-wrapper">
          <div class="sp-card-strip"></div>
        </div>
        <div className="sp-score-flex">
          <div className="sp-rank-box">
            <Award size={36} className="sp-rank-icon" />
            <div className="sp-rank-val">
              {user ? (globalRank ? `#${globalRank}` : "--") : "-"}
            </div>
            <div className="sp-rank-lbl">Global Rank</div>
            {!user && (
              <div
                style={{
                  fontSize: "0.7rem",
                  marginTop: "0.5rem",
                  color: "var(--ink)",
                }}
              >
                Login to rank
              </div>
            )}
          </div>

          <div className="sp-time-col">
            <div className="sp-time-lbl">Total Time</div>
            <div className="sp-time-val">{timeFormatted}</div>
            <div className="sp-pb">
              {isNewPB && (
                <span style={{ color: "var(--marigold)", fontWeight: 800 }}>
                  🏆 NEW{" "}
                </span>
              )}
              Personal best {pbFormatted}
            </div>
          </div>
        </div>

        <div className="sp-metrics">
          <div>
            <div className="sp-metric-lbl">WPM</div>
            <div className="sp-metric-val">{animWpm}</div>
          </div>
          <div>
            <div className="sp-metric-lbl">CPM</div>
            <div className="sp-metric-val">{animCpm}</div>
          </div>
          <div>
            <div className="sp-metric-lbl">Accuracy</div>
            <div className="sp-metric-val">{animAcc}%</div>
          </div>
          <div>
            <div className="sp-metric-lbl">Mistakes</div>
            <div className={`sp-metric-val ${totalMistakes > 0 ? "bad" : ""}`}>
              {totalMistakes}
            </div>
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
          <span
            style={{
              fontSize: "0.65rem",
              opacity: 0.6,
              marginLeft: "0.3rem",
              fontWeight: 500,
              border: "1px solid rgba(0,0,0,0.2)",
              padding: "0.15rem 0.4rem",
              borderRadius: "4px",
            }}
          >
            R
          </span>
        </button>
        <button
          className="sp-btn sp-btn-sec"
          onClick={() => navigate(`/lines`)}
        >
          Change route
        </button>
        <button className="sp-btn sp-btn-sec" onClick={() => navigate("/")}>
          Home
          <span
            style={{
              fontSize: "0.65rem",
              opacity: 0.5,
              marginLeft: "0.3rem",
              fontWeight: 500,
              border: "1px solid var(--border)",
              padding: "0.15rem 0.4rem",
              borderRadius: "4px",
            }}
          >
            Esc
          </span>
        </button>
      </div>

      {/* Leaderboard Card */}
      <div className="sp-card" style={{ padding: "1.5rem" }}>
        <h3 className="sp-splits-title">
          <Trophy size={20} color="var(--marigold)" /> Top 10 Leaderboard
        </h3>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
            marginTop: "1.5rem",
          }}
        >
          {leaderboard.length === 0 ? (
            <p
              style={{
                color: "var(--ink-muted)",
                fontStyle: "italic",
                margin: "1rem 0",
              }}
            >
              No runs recorded yet. Be the first to rank!
            </p>
          ) : (
            leaderboard.map((run, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.8rem 1rem",
                  background: "var(--panel-raised)",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    fontWeight: "800",
                    color: i < 3 ? "var(--marigold)" : "var(--ink-muted)",
                    fontSize: "1.1rem",
                  }}
                >
                  #{i + 1}
                </div>
                <img
                  src={
                    run.picture ||
                    "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest"
                  }
                  alt="Avatar"
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    border: "1px solid var(--border)",
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    fontWeight: "700",
                    fontSize: "1rem",
                    color: "var(--ink)",
                  }}
                >
                  {run.name}
                </div>
                <div
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontWeight: "800",
                    color: "var(--lc)",
                    fontSize: "1.1rem",
                  }}
                >
                  {formatSplitTime(run.timeMs)}
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--ink-muted)",
                    fontWeight: "600",
                    width: "60px",
                    textAlign: "right",
                  }}
                >
                  {run.accuracy}%
                </div>
              </div>
            ))
          )}
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
    </div>
  );
}

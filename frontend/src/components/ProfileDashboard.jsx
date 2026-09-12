import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Award,
  History,
  Trophy,
  Settings,
  LogOut,
  ArrowLeft,
  Target,
  Zap,
  AlertCircle,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { CITY_CATALOG } from "../data/cities/index";
import { STAMP_CATALOG } from "../data/stampCatalog";

const API_BASE = "/api";

// ── Helpers ──────────────────────────────────────────────────────────
function formatTime(ms) {
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const millis = Math.floor((ms % 1000) / 10);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}.${millis < 10 ? "0" : ""}${millis}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function lookupLine(cityId, lineId) {
  const city = CITY_CATALOG[cityId];
  if (!city) return { name: lineId, color: "var(--marigold)", cityName: cityId };
  const line = city.lines.find((l) => l.id === lineId);
  return {
    name: line?.name || lineId,
    color: line?.color || "var(--marigold)",
    cityName: city.name,
  };
}

// ── Main Component ───────────────────────────────────────────────────
export default function ProfileDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const { user, token, loading, logout, setUser } = useAuth();

  // Run history state
  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(true);

  // Settings state
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [prevUserName, setPrevUserName] = useState(user?.name);
  if (user?.name !== prevUserName) {
    setPrevUserName(user?.name);
    setDisplayName(user?.name || "");
  }
  const [saveStatus, setSaveStatus] = useState(null); // null | "saving" | "saved" | "error"

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [loading, user, navigate]);

  // Fetch runs on mount
  useEffect(() => {
    if (!token) return;
    const fetchRuns = async () => {
      try {
        const res = await fetch(`${API_BASE}/runs/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setRuns(data);
        }
      } catch (err) {
        console.error("Failed to fetch runs:", err);
      } finally {
        setRunsLoading(false);
      }
    };
    fetchRuns();
  }, [token]);

  if (loading) {
    return (
      <div className="pd-layout">
        <style>{`
          /* Reusing layout classes for skeleton */
          .pd-layout { height: 100vh; background-color: var(--void); display: flex; overflow: hidden; }
          .pd-sidebar { width: 280px; flex-shrink: 0; border-right: 1px solid var(--border); background-color: var(--panel); padding: 2rem 1.5rem; display: flex; flex-direction: column; }
          .pd-main { flex: 1; padding: 4rem; overflow-y: auto; }
          @media (max-width: 768px) {
            .pd-layout { flex-direction: column; height: auto; min-height: 100vh; overflow: visible; }
            .pd-sidebar { width: 100%; height: auto; border-right: none; border-bottom: 1px solid var(--border); padding: 1.5rem; }
            .pd-main { padding: 1.5rem; }
          }
          /* Shimmer animation */
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
          .skeleton-box {
            animation: shimmer 2s infinite linear;
            background: linear-gradient(to right, color-mix(in srgb, var(--panel) 50%, var(--void)), color-mix(in srgb, var(--panel) 100%, var(--border)), color-mix(in srgb, var(--panel) 50%, var(--void)));
            background-size: 1000px 100%;
            border-radius: 12px;
          }
        `}</style>
        <aside className="pd-sidebar">
           <div className="skeleton-box" style={{ width: '40%', height: '20px', marginBottom: '2.5rem' }} />
           <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '3rem' }}>
             <div className="skeleton-box" style={{ width: '50px', height: '50px', borderRadius: '14px' }} />
             <div style={{ flex: 1 }}>
               <div className="skeleton-box" style={{ width: '70%', height: '20px', marginBottom: '0.5rem' }} />
               <div className="skeleton-box" style={{ width: '90%', height: '14px' }} />
             </div>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
             {[...Array(5)].map((_, i) => <div key={i} className="skeleton-box" style={{ width: '100%', height: '44px', borderRadius: '8px' }} />)}
           </div>
        </aside>
        <main className="pd-main" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div className="skeleton-box" style={{ width: '30%', height: '40px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
             {[...Array(4)].map((_, i) => <div key={i} className="skeleton-box" style={{ height: '140px', borderRadius: '16px' }} />)}
          </div>
          <div className="skeleton-box" style={{ width: '100%', height: '300px', borderRadius: '16px' }} />
        </main>
      </div>
    );
  }
  if (!user) return null;

  // ── Derived Data ─────────────────────────────────────────────────
  const recentRuns = runs.slice(0, 5);

  // Compute unique lines played
  const uniqueLines = new Set(runs.map((r) => `${r.cityId}/${r.lineId}`));

  // Compute best per line
  const bestsArray = (user.bests || [])
    .map((best) => {
      const info = lookupLine(best.cityId, best.routeId);
      const attempts = runs.filter(
        (r) => r.cityId === best.cityId && r.lineId === best.routeId
      ).length;
      return { ...best, ...info, attempts };
    })
    .sort((a, b) => a.timeMs - b.timeMs);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleSignOut = () => {
    logout();
    navigate("/");
  };

  const handleSaveSettings = async () => {
    if (!displayName.trim()) return;
    setSaveStatus("saving");
    try {
      const res = await fetch(`${API_BASE}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: displayName.trim() }),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(null), 2000);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="pd-layout">
      <style>{`
        @keyframes rt-pulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
        .rt-loader-pulse { animation: rt-pulse 1.5s ease-in-out infinite; }

        .pd-back {
          display: inline-flex; align-items: center; gap: .4rem;
          font-family: inherit; font-size: .85rem; font-weight: 600;
          color: var(--ink-muted); background: none; border: none;
          cursor: pointer; margin-bottom: 2rem; padding: 0;
          transition: color .15s;
        }
        .pd-back:hover { color: var(--ink); }

        .pd-run-row {
          display: grid;
          grid-template-columns: 36px 1fr 100px 80px 80px 70px 100px;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.2rem;
          border-bottom: 1px solid var(--border);
          font-size: 0.9rem;
          transition: background 0.15s;
        }
        .pd-run-row:hover {
          background: color-mix(in srgb, var(--ink) 4%, transparent);
        }
        .pd-run-header {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--ink-muted);
          border-bottom: 2px solid var(--border);
        }
        .pd-run-header:hover { background: transparent; }
        .pd-badge-card {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.8rem;
          text-align: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .pd-badge-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px color-mix(in srgb, var(--void) 50%, transparent);
        }
        .pd-best-card {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.8rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .pd-best-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px color-mix(in srgb, var(--void) 50%, transparent);
        }
        .pd-empty {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--ink-muted);
        }
        .pd-empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.4;
        }
        .pd-input {
          width: 100%;
          padding: 0.8rem;
          border-radius: 8px;
          border: 1px solid var(--border);
          background-color: var(--void);
          color: var(--ink);
          font-family: inherit;
          font-size: 0.95rem;
          transition: border-color 0.2s;
          outline: none;
        }
        .pd-input:focus {
          border-color: var(--marigold);
        }
        
        /* Layout Classes */
        .pd-layout {
          height: 100vh;
          background-color: var(--void);
          color: var(--ink);
          font-family: inherit;
          display: flex;
          overflow: hidden;
        }
        .pd-sidebar {
          width: 280px;
          flex-shrink: 0;
          border-right: 1px solid var(--border);
          background-color: var(--panel);
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        .pd-main {
          flex: 1;
          padding: 4rem;
          overflow-y: auto;
        }
        .pd-sidebar-tabs {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        /* Responsive Layout */
        @media (max-width: 768px) {
          .pd-layout {
            flex-direction: column;
            height: auto;
            min-height: 100vh;
            overflow: visible;
          }
          .pd-sidebar {
            width: 100%;
            height: auto;
            border-right: none;
            border-bottom: 1px solid var(--border);
            padding: 1.5rem;
          }
          .pd-main {
            padding: 1.5rem;
            overflow-y: visible;
          }
          .pd-sidebar-tabs {
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: 0.5rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none; /* Firefox */
          }
          .pd-sidebar-tabs::-webkit-scrollbar {
            display: none; /* Chrome/Safari */
          }
          .pd-sidebar-tabs > button {
            white-space: nowrap;
          }
        }
      `}</style>

      {/* ── SIDEBAR ──────────────────────────────────────────────── */}
      <aside className="pd-sidebar">
        <button className="pd-back" onClick={() => navigate("/")}>
          <ArrowLeft size={15} /> Back to Game
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "2.5rem",
          }}
        >
          <img
            src={user.picture}
            alt="Profile"
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "14px",
              border: "1px solid var(--border)",
            }}
          />
          <div>
            <div style={{ fontWeight: "800", fontSize: "1.2rem" }}>
              {user.name}
            </div>
            <div style={{ color: "var(--ink-muted)", fontSize: "0.8rem" }}>
              {user.email}
            </div>
          </div>
        </div>

        <div className="pd-sidebar-tabs">
          <TabButton
            icon={<LayoutDashboard size={18} />}
            label="Overview"
            isActive={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <TabButton
            icon={<Award size={18} />}
            label="Stamps"
            isActive={activeTab === "stamps"}
            onClick={() => setActiveTab("stamps")}
          />
          <TabButton
            icon={<History size={18} />}
            label="Run History"
            isActive={activeTab === "history"}
            onClick={() => setActiveTab("history")}
          />
          <TabButton
            icon={<Trophy size={18} />}
            label="Best Per Line"
            isActive={activeTab === "bests"}
            onClick={() => setActiveTab("bests")}
          />
          <TabButton
            icon={<Settings size={18} />}
            label="Settings"
            isActive={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
          />
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <main className="pd-main">

        {/* ═══════════ OVERVIEW TAB ═══════════ */}
        {activeTab === "overview" && (
          <div>
            <h2 style={{ fontSize: "2.5rem", fontWeight: "800", margin: "0 0 2rem 0" }}>
              Overview
            </h2>

            {/* Stats Row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1.5rem",
                marginBottom: "3rem",
              }}
            >
              <StatCard label="Total Runs" value={user.totalRuns || runs.length} />
              <StatCard label="Lines Played" value={uniqueLines.size} />
              <StatCard label="Stamps Collected" value={Array.isArray(user?.stamps) ? user.stamps.length : (typeof user?.stamps === "number" ? user.stamps : 0)} />
            </div>

            {/* Recent Runs + Stamps Preview */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "2rem",
              }}
            >
              {/* Recent Runs */}
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "16px",
                  padding: "1.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "1rem",
                  }}
                >
                  <h3 style={{ margin: 0 }}>Recent Runs</h3>
                  <button
                    onClick={() => setActiveTab("history")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--marigold)",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    View All
                  </button>
                </div>
                {recentRuns.length === 0 ? (
                  <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem" }}>
                    No runs recorded yet. Start playing!
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                    {recentRuns.slice(0, 3).map((run, i) => {
                      const info = lookupLine(run.cityId, run.lineId);
                      return (
                        <div
                          key={run._id || i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.8rem",
                            padding: "0.7rem 0",
                            borderBottom: i < 2 ? "1px solid var(--border)" : "none",
                          }}
                        >
                          <div
                            style={{
                              width: "6px",
                              height: "32px",
                              borderRadius: "3px",
                              backgroundColor: info.color,
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                              {info.name}
                            </div>
                            <div style={{ color: "var(--ink-muted)", fontSize: "0.75rem" }}>
                              {info.cityName} · {formatDate(run.createdAt)}
                            </div>
                          </div>
                          <div
                            style={{
                              fontFamily: '"JetBrains Mono", monospace',
                              fontWeight: "700",
                              fontSize: "0.95rem",
                              color: "var(--marigold)",
                            }}
                          >
                            {formatTime(run.timeMs)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent Stamps */}
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "16px",
                  padding: "1.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "1rem",
                  }}
                >
                  <h3 style={{ margin: 0 }}>Recent Stamps</h3>
                  <button
                    onClick={() => setActiveTab("stamps")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--marigold)",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    View All
                  </button>
                </div>
                {(!Array.isArray(user?.stamps) || user.stamps.length === 0) ? (
                  <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem" }}>
                    No stamps collected yet.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                    {(Array.isArray(user?.stamps) ? user.stamps : []).slice(-6).reverse().map((stampId, i) => {
                      const stamp = STAMP_CATALOG[stampId];
                      if (!stamp) return null;
                      return (
                        <span
                          key={i}
                          title={stamp.description}
                          style={{
                            background: "color-mix(in srgb, var(--marigold) 12%, transparent)",
                            border: "1px solid color-mix(in srgb, var(--marigold) 30%, transparent)",
                            color: "var(--marigold)",
                            padding: "0.4rem 0.8rem",
                            borderRadius: "99px",
                            fontSize: "0.8rem",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem"
                          }}
                        >
                          {stamp.icon} {stamp.name}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ STAMPS TAB ═══════════ */}
        {activeTab === "stamps" && (
          <div>
            <h2 style={{ fontSize: "2.5rem", fontWeight: "800", margin: "0 0 0.5rem 0" }}>
              Stamps
            </h2>
            <p style={{ color: "var(--ink-muted)", marginBottom: "2rem" }}>
              Stamps and milestones you've earned on your journey.
            </p>

            {["accuracy", "speed", "dedication"].map(category => (
              <div key={category} style={{ marginBottom: "3rem" }}>
                <h3 style={{ textTransform: "capitalize", fontSize: "1.5rem", marginBottom: "1rem", borderBottom: "2px solid var(--border)", paddingBottom: "0.5rem", color: "var(--ink)" }}>
                  {category}
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: "1.2rem",
                  }}
                >
                  {Object.values(STAMP_CATALOG)
                    .filter(stamp => stamp.category === category)
                    .map(stamp => {
                      const isUnlocked = (Array.isArray(user?.stamps) ? user.stamps : []).includes(stamp.id);
                      return (
                        <div key={stamp.id} className="pd-badge-card" style={{ opacity: isUnlocked ? 1 : 0.4, filter: isUnlocked ? "none" : "grayscale(1)" }}>
                          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
                            {isUnlocked ? stamp.icon : "🔒"}
                          </div>
                          <div style={{ fontWeight: "800", fontSize: "1rem", color: isUnlocked ? "var(--marigold)" : "var(--ink-muted)", marginBottom: "0.5rem" }}>
                            {stamp.name}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "var(--ink-muted)", lineHeight: "1.4" }}>
                            {stamp.description}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════ RUN HISTORY TAB ═══════════ */}
        {activeTab === "history" && (
          <div>
            <h2 style={{ fontSize: "2.5rem", fontWeight: "800", margin: "0 0 0.5rem 0" }}>
              Run History
            </h2>
            <p style={{ color: "var(--ink-muted)", marginBottom: "2rem" }}>
              {runs.length > 0
                ? `${runs.length} run${runs.length > 1 ? "s" : ""} recorded`
                : "All your completed runs will appear here."}
            </p>

            {runsLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "1.5rem 0" }}>
                <div className="rt-loader-pulse" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--marigold)" }} />
                <span className="rt-loader-pulse" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: "0.78rem", letterSpacing: "2px", fontWeight: "600", color: "var(--ink-muted)" }}>LOADING RUNS…</span>
              </div>
            ) : runs.length === 0 ? (
              <div className="pd-empty">
                <div className="pd-empty-icon">🚂</div>
                <h3 style={{ margin: "0 0 0.5rem", fontWeight: "700" }}>No runs yet</h3>
                <p style={{ maxWidth: "400px", margin: "0 auto" }}>
                  Play a line to see your run history here. Each completed run is saved automatically.
                </p>
                <button
                  onClick={() => navigate("/lines")}
                  style={{
                    marginTop: "1.5rem",
                    padding: "0.8rem 2rem",
                    borderRadius: "10px",
                    border: "none",
                    background: "var(--marigold)",
                    color: "#14100b",
                    fontWeight: "700",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Pick a line
                </button>
              </div>
            ) : (
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "14px",
                  overflow: "hidden",
                }}
              >
                {/* Table Header */}
                <div className="pd-run-row pd-run-header">
                  <span>#</span>
                  <span>Line</span>
                  <span>Time</span>
                  <span>WPM</span>
                  <span>Acc.</span>
                  <span>Miss</span>
                  <span>Date</span>
                </div>

                {/* Table Rows */}
                {runs.map((run, i) => {
                  const info = lookupLine(run.cityId, run.lineId);
                  return (
                    <div key={run._id || i} className="pd-run-row">
                      <span
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          color: "var(--ink-muted)",
                          fontSize: "0.8rem",
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div
                          style={{
                            width: "5px",
                            height: "28px",
                            borderRadius: "3px",
                            backgroundColor: info.color,
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: "600", fontSize: "0.88rem" }}>
                            {info.name}
                          </div>
                          <div
                            style={{
                              fontSize: "0.72rem",
                              color: "var(--ink-muted)",
                            }}
                          >
                            {info.cityName}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontWeight: "600",
                          color: "var(--marigold)",
                        }}
                      >
                        {formatTime(run.timeMs)}
                      </span>

                      <span
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontWeight: "600",
                        }}
                      >
                        {Math.round(run.cpm / 5)}
                      </span>

                      <span
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontWeight: "600",
                        }}
                      >
                        {run.accuracy}%
                      </span>

                      <span
                        style={{
                          fontFamily: '"JetBrains Mono", monospace',
                          fontWeight: "600",
                          color: run.mistakes > 0 ? "#ef4444" : "var(--ink-muted)",
                        }}
                      >
                        {run.mistakes}
                      </span>

                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--ink-muted)",
                        }}
                      >
                        {formatDate(run.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ BEST PER LINE TAB ═══════════ */}
        {activeTab === "bests" && (
          <div>
            <h2 style={{ fontSize: "2.5rem", fontWeight: "800", margin: "0 0 0.5rem 0" }}>
              Best Per Line
            </h2>
            <p style={{ color: "var(--ink-muted)", marginBottom: "2rem" }}>
              Your personal records for each line you've played.
            </p>

            {bestsArray.length === 0 ? (
              <div className="pd-empty">
                <div className="pd-empty-icon">🏆</div>
                <h3 style={{ margin: "0 0 0.5rem", fontWeight: "700" }}>No records yet</h3>
                <p style={{ maxWidth: "400px", margin: "0 auto" }}>
                  Complete a line to set your first personal best.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                {bestsArray.map((best, i) => (
                  <div key={i} className="pd-best-card">
                    {/* Color strip */}
                    <div
                      style={{
                        width: "100%",
                        height: "4px",
                        borderRadius: "2px",
                        backgroundColor: best.color,
                        marginBottom: "1.2rem",
                      }}
                    />

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "1.2rem",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "700", fontSize: "1.1rem" }}>
                          {best.name}
                        </div>
                        <div
                          style={{
                            color: "var(--ink-muted)",
                            fontSize: "0.8rem",
                          }}
                        >
                          {best.cityName}
                        </div>
                      </div>
                      <div
                        style={{
                          background: "color-mix(in srgb, var(--marigold) 12%, transparent)",
                          color: "var(--marigold)",
                          padding: "0.3rem 0.7rem",
                          borderRadius: "8px",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                        }}
                      >
                        {best.attempts} run{best.attempts > 1 ? "s" : ""}
                      </div>
                    </div>

                    {/* Best time — hero number */}
                    <div
                      style={{
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: "2rem",
                        fontWeight: "800",
                        color: best.color,
                        marginBottom: "1rem",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {formatTime(best.timeMs)}
                    </div>

                    {/* Metrics row */}
                    <div
                      style={{
                        display: "flex",
                        gap: "1.5rem",
                        borderTop: "1px solid var(--border)",
                        paddingTop: "1rem",
                      }}
                    >
                      <MetricMini
                        icon={<Zap size={13} />}
                        label="WPM"
                        value={Math.round(best.cpm / 5)}
                      />
                      <MetricMini
                        icon={<Target size={13} />}
                        label="Acc."
                        value={`${best.accuracy}%`}
                      />
                      <MetricMini
                        icon={<AlertCircle size={13} />}
                        label="Miss"
                        value={best.mistakes}
                        bad={best.mistakes > 0}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ SETTINGS TAB ═══════════ */}
        {activeTab === "settings" && (
          <div>
            <h2
              style={{
                fontSize: "2.5rem",
                fontWeight: "800",
                margin: "0 0 2rem 0",
              }}
            >
              Settings
            </h2>
            <div
              style={{
                maxWidth: "460px",
                display: "flex",
                flexDirection: "column",
                gap: "1.2rem",
              }}
            >
              {/* Account info (read-only) */}
              <div>
                <label
                  style={{
                    display: "block",
                    color: "var(--ink-muted)",
                    marginBottom: "0.5rem",
                    fontSize: "0.82rem",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Email
                </label>
                <div
                  style={{
                    padding: "0.8rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--panel)",
                    color: "var(--ink-muted)",
                    fontSize: "0.95rem",
                  }}
                >
                  {user.email}
                </div>
              </div>

              {/* Display Name (editable) */}
              <div>
                <label
                  style={{
                    display: "block",
                    color: "var(--ink-muted)",
                    marginBottom: "0.5rem",
                    fontSize: "0.82rem",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pd-input"
                />
              </div>

              {/* Save button with feedback */}
              <button
                onClick={handleSaveSettings}
                disabled={saveStatus === "saving"}
                style={{
                  backgroundColor:
                    saveStatus === "saved"
                      ? "#22c55e"
                      : saveStatus === "error"
                      ? "#ef4444"
                      : "var(--marigold)",
                  color: "#14100b",
                  border: "none",
                  padding: "0.8rem",
                  borderRadius: "8px",
                  cursor: saveStatus === "saving" ? "wait" : "pointer",
                  fontWeight: "bold",
                  fontFamily: "inherit",
                  fontSize: "0.95rem",
                  marginTop: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  transition: "background-color 0.3s",
                }}
              >
                {saveStatus === "saving" && "Saving..."}
                {saveStatus === "saved" && (
                  <>
                    <Check size={16} /> Saved!
                  </>
                )}
                {saveStatus === "error" && (
                  <>
                    <AlertCircle size={16} /> Error — try again
                  </>
                )}
                {!saveStatus && "Save Changes"}
              </button>

              <hr
                style={{
                  borderColor: "var(--border)",
                  margin: "1.5rem 0",
                  width: "100%",
                }}
              />

              {/* Member since */}
              <div
                style={{
                  color: "var(--ink-muted)",
                  fontSize: "0.82rem",
                  marginBottom: "1rem",
                }}
              >
                Member since{" "}
                {user.createdAt ? formatDate(user.createdAt) : "recently"}
              </div>

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  backgroundColor: "transparent",
                  color: "#ff4d4d",
                  border: "1px solid #ff4d4d",
                  padding: "0.8rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontFamily: "inherit",
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background =
                    "color-mix(in srgb, #ff4d4d 10%, transparent)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function TabButton({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.8rem",
        padding: "0.9rem 1.2rem",
        borderRadius: "10px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "0.95rem",
        backgroundColor: isActive
          ? "color-mix(in srgb, var(--marigold) 15%, transparent)"
          : "transparent",
        color: isActive ? "var(--marigold)" : "var(--ink-muted)",
        border: "none",
        textAlign: "left",
        transition: "all 0.2s",
      }}
    >
      {icon} {label}
    </button>
  );
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        backgroundColor: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          color: "var(--ink-muted)",
          fontSize: "0.8rem",
          textTransform: "uppercase",
          letterSpacing: "1px",
          fontWeight: "700",
          marginBottom: "0.5rem",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "2.5rem",
          fontWeight: "bold",
          fontFamily: '"JetBrains Mono", monospace',
          color: "var(--marigold)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MetricMini({ icon, label, value, bad }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.3rem",
          color: "var(--ink-muted)",
          fontSize: "0.7rem",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "0.25rem",
        }}
      >
        {icon} {label}
      </div>
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontWeight: "700",
          fontSize: "1rem",
          color: bad ? "#ef4444" : "var(--ink)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

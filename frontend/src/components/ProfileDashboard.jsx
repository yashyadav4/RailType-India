import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Award,
  History,
  Trophy,
  Settings,
  LogOut,
  ArrowLeft,
} from "lucide-react";

export default function ProfileDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock user data for UI testing
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/");
        return;
      }

      try {
        const res = await fetch("http://localhost:8000/api/users/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.ok) {
          setUser(data);
        } else {
          localStorage.removeItem("token");
          navigate("/");
        }
      } catch (error) {
        console.error("Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);
  if (loading) {
    return (
      <div
        style={{ color: "var(--ink)", padding: "4rem", textAlign: "center" }}
      >
        Loading Profile...
      </div>
    );
  }
  if (!user) return null;
  const handleSignOut = () => {
    // Clear local storage and redirect to home
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--void)",
        color: "var(--ink)",
        fontFamily: "inherit",
        display: "flex",
      }}
    >
      {/* 1. SIDEBAR NAVIGATION */}
      <aside
        style={{
          width: "280px",
          borderRight: "1px solid var(--border)",
          backgroundColor: "var(--panel)",
          padding: "2rem 1.5rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            color: "var(--ink-muted)",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            cursor: "pointer",
            marginBottom: "2rem",
            fontWeight: "600",
          }}
        >
          <ArrowLeft size={16} /> Back to Game
        </button>

        {/* Profile Card */}
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

        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            flex: 1,
          }}
        >
          <TabButton
            icon={<LayoutDashboard size={18} />}
            label="Overview"
            isActive={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <TabButton
            icon={<Award size={18} />}
            label="Stamp Book"
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

      {/* 2. MAIN CONTENT AREA */}
      <main style={{ flex: 1, padding: "4rem", overflowY: "auto" }}>
        {activeTab === "overview" && (
          <div>
            <h2
              style={{
                fontSize: "2.5rem",
                fontWeight: "800",
                margin: "0 0 2rem 0",
              }}
            >
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
              <StatCard label="Total Runs" value={user.totalRuns} />
              <StatCard label="Lines Ranked" value="4" />
              <StatCard label="Stamps Collected" value={user.stamps} />
            </div>

            {/* Quick Preview Sections */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "2rem",
              }}
            >
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
                <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem" }}>
                  No runs recorded yet. Start playing!
                </p>
              </div>

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
                <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem" }}>
                  No stamps collected yet.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "stamps" && (
          <div>
            <h2 style={{ fontSize: "2.5rem", fontWeight: "800" }}>
              Stamp Book
            </h2>
            <p style={{ color: "var(--ink-muted)" }}>Coming soon...</p>
          </div>
        )}
        {activeTab === "history" && (
          <div>
            <h2 style={{ fontSize: "2.5rem", fontWeight: "800" }}>
              Run History
            </h2>
            <p style={{ color: "var(--ink-muted)" }}>Coming soon...</p>
          </div>
        )}
        {activeTab === "bests" && (
          <div>
            <h2 style={{ fontSize: "2.5rem", fontWeight: "800" }}>
              Best Per Line
            </h2>
            <p style={{ color: "var(--ink-muted)" }}>Coming soon...</p>
          </div>
        )}

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
                maxWidth: "400px",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    color: "var(--ink-muted)",
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                  }}
                >
                  Display Name
                </label>
                <input
                  type="text"
                  defaultValue={user.name}
                  style={{
                    width: "100%",
                    padding: "0.8rem",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--void)",
                    color: "var(--ink)",
                    fontFamily: "inherit",
                  }}
                />
              </div>
              <button
                style={{
                  backgroundColor: "var(--panel)",
                  color: "var(--ink)",
                  border: "1px solid var(--border)",
                  padding: "0.8rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  marginTop: "1rem",
                }}
              >
                Save Changes
              </button>

              <hr
                style={{
                  borderColor: "var(--border)",
                  margin: "2rem 0",
                  width: "100%",
                }}
              />

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
                }}
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

// Helper Components for the Dashboard UI
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

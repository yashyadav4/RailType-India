import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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

  // Helper to format the split times purely for display
  const formatSplitTime = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const millis = Math.floor((ms % 1000) / 10);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}.${millis < 10 ? "0" : ""}${millis}`;
  };

  // Find the longest time to set the 100% width benchmark for the progress bars
  const maxSplitTime =
    splits.length > 0 ? Math.max(...splits.map((s) => s.timeMs)) : 1;

  // Find the specific fastest and slowest station names for the legend
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

  if (!catalogEntry)
    return <div style={{ color: "white" }}>Route not found!</div>;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0b0f19",
        color: "#f8fafc",
        padding: "3rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: "1000px" }}>
        {/* Header Section */}
        <div style={{ marginBottom: "2rem" }}>
          <div
            style={{
              color: "#94a3b8",
              fontSize: "0.85rem",
              letterSpacing: "2px",
              fontWeight: "700",
              textTransform: "uppercase",
              marginBottom: "0.5rem",
            }}
          >
            Run Complete • 完走証明
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <h1 style={{ fontSize: "2.5rem", margin: 0, fontWeight: "800" }}>
              {catalogEntry.name}{" "}
              <span style={{ fontWeight: "400", opacity: 0.8 }}>
                · full line
              </span>
            </h1>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <span
                style={{
                  backgroundColor: "#1e1b33",
                  border: "1px solid #332f54",
                  padding: "0.4rem 1rem",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  color: "#cbd5e1",
                }}
              >
                {catalogEntry.terminals}
              </span>
              <span
                style={{
                  backgroundColor: "#1e1b33",
                  border: "1px solid #332f54",
                  padding: "0.4rem 1rem",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  color: "#cbd5e1",
                }}
              >
                Start{" "}
                {catalogEntry.startTerminal ||
                  catalogEntry.terminals.split(" ↔ ")[0]}
              </span>
            </div>
          </div>
        </div>

        {/* Main Score Card */}
        <div
          style={{
            backgroundColor: "#21213a",
            borderRadius: "20px",
            padding: "2.5rem",
            marginBottom: "1.5rem",
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "2rem",
            }}
          >
            <div
              style={{
                width: "140px",
                height: "140px",
                backgroundColor: "#17182c",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "4rem",
                border: "1px solid #332f54",
              }}
            >
              🚆
            </div>

            <div style={{ flex: 1, minWidth: "300px" }}>
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "0.9rem",
                  marginBottom: "0.5rem",
                }}
              >
                Total time
              </div>
              <div
                style={{
                  color: "#facc15",
                  fontSize: "5rem",
                  fontWeight: "800",
                  lineHeight: "1",
                  fontFamily: "monospace",
                  letterSpacing: "-1px",
                  marginBottom: "1rem",
                  textShadow: "0 0 20px rgba(250, 204, 21, 0.2)",
                }}
              >
                {timeFormatted}
              </div>
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "0.95rem",
                  marginBottom: "1rem",
                }}
              >
                Personal best --:--.--
              </div>
              <div style={{ fontSize: "0.9rem" }}>
                <span style={{ color: "#a3e635", fontWeight: "600" }}>
                  Global rank #-- · Leaderboard unavailable offline!
                </span>{" "}
                <span
                  style={{
                    color: "#94a3b8",
                    textDecoration: "underline",
                    cursor: "pointer",
                    marginLeft: "8px",
                  }}
                >
                  Login to save
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "3rem",
              marginTop: "3rem",
              borderTop: "1px solid #332f54",
              paddingTop: "2rem",
            }}
          >
            <div>
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "0.85rem",
                  marginBottom: "0.5rem",
                }}
              >
                WPM
              </div>
              <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{wpm}</div>
            </div>
            <div>
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "0.85rem",
                  marginBottom: "0.5rem",
                }}
              >
                CPM
              </div>
              <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{cpm}</div>
            </div>
            <div>
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "0.85rem",
                  marginBottom: "0.5rem",
                }}
              >
                Accuracy
              </div>
              <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
                {accuracy}%
              </div>
            </div>
            <div>
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "0.85rem",
                  marginBottom: "0.5rem",
                }}
              >
                Mistakes
              </div>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: "bold",
                  color: totalMistakes > 0 ? "#ef4444" : "#f8fafc",
                }}
              >
                {totalMistakes}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Station Splits Card */}
        <div
          style={{
            backgroundColor: "#21213a",
            borderRadius: "20px",
            padding: "2rem 2.5rem",
            marginBottom: "2rem",
            border: "1px solid #332f54",
          }}
        >
          <h3
            style={{
              color: "#cbd5e1",
              fontSize: "1.2rem",
              margin: "0 0 1.5rem 0",
            }}
          >
            Station splits
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {splits.map((split, index) => {
              // Calculate width percentage relative to the slowest station
              const widthPercent = (split.timeMs / maxSplitTime) * 100;

              // Decide bar color: Fastest gets Green, Slowest gets Yellow, rest get blue/purple
              let barColor = "#3b82f6"; // Default blue
              if (split.name === fastestStation)
                barColor = "#a3e635"; // Green
              else if (split.name === slowestStation) barColor = "#facc15"; // Yellow

              return (
                <div
                  key={index}
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  <div
                    style={{
                      color: "#94a3b8",
                      fontSize: "0.85rem",
                      width: "20px",
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div
                    style={{
                      width: "150px",
                      fontWeight: "500",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {split.name}
                  </div>

                  {/* Dynamic Progress Bar */}
                  <div
                    style={{
                      flex: 1,
                      height: "8px",
                      backgroundColor: "#17182c",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${widthPercent}%`,
                        height: "100%",
                        backgroundColor: barColor,
                        transition: "width 1s ease-out",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      width: "60px",
                      fontFamily: "monospace",
                      textAlign: "right",
                    }}
                  >
                    {formatSplitTime(split.timeMs)}
                  </div>
                  <div
                    style={{
                      width: "60px",
                      color: split.mistakes > 0 ? "#ef4444" : "#94a3b8",
                      fontSize: "0.85rem",
                      textAlign: "right",
                    }}
                  >
                    {split.mistakes} miss
                  </div>
                </div>
              );
            })}

            {splits.length === 0 && (
              <div style={{ color: "#94a3b8", fontStyle: "italic" }}>
                No split data available.
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: "1.5rem",
              marginTop: "1.5rem",
              fontSize: "0.85rem",
              color: "#cbd5e1",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  backgroundColor: "#a3e635",
                  borderRadius: "2px",
                }}
              ></span>{" "}
              Fastest: {fastestStation || "--"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  backgroundColor: "#facc15",
                  borderRadius: "2px",
                }}
              ></span>{" "}
              Slowest: {slowestStation || "--"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate(`/${cityId}/${lineId}/play`)}
            style={{
              backgroundColor: "#d9f99d",
              color: "#0b0f19",
              border: "none",
              padding: "0.8rem 2rem",
              borderRadius: "30px",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: "pointer",
              transition: "opacity 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = 0.9)}
            onMouseOut={(e) => (e.currentTarget.style.opacity = 1)}
          >
            Play again
          </button>

          <button
            onClick={() => navigate(`/${cityId}/${lineId}`)}
            style={{
              backgroundColor: "#2e2b4a",
              color: "#f8fafc",
              border: "none",
              padding: "0.8rem 1.5rem",
              borderRadius: "30px",
              fontWeight: "600",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Change route
          </button>

          <button
            onClick={() => navigate("/")}
            style={{
              backgroundColor: "#2e2b4a",
              color: "#f8fafc",
              border: "none",
              padding: "0.8rem 1.5rem",
              borderRadius: "30px",
              fontWeight: "600",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}

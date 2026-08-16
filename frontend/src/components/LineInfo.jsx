import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CITY_CATALOG, loadRouteData } from "../data/cities/index";

export default function LineInfo() {
  const { cityId, lineId } = useParams();
  const navigate = useNavigate();

  const [lineData, setLineData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Find the basic catalog info (for the color, total stations, etc.)
  const city = CITY_CATALOG[cityId];
  const catalogEntry = city?.lines.find((l) => l.id === lineId);

  useEffect(() => {
    async function fetchData() {
      // Load the heavy JSON file dynamically
      const data = await loadRouteData(cityId, lineId);
      setLineData(data);
      setLoading(false);
    }
    fetchData();
  }, [cityId, lineId]);

  if (!catalogEntry)
    return <div style={{ color: "white" }}>Route not found!</div>;
  if (loading) return <div style={{ color: "white" }}>Loading map data...</div>;

  return (
    <div
      className="line-info-container"
      style={{
        minHeight: "100vh",
        backgroundColor: "#0b0f19",
        color: "#f8fafc",
        padding: "3rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        style={{
          background: "transparent",
          color: "#94a3b8",
          border: "1px solid #334155",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          cursor: "pointer",
          marginBottom: "2rem",
        }}
      >
        ← Back to Catalog
      </button>

      {/* Header */}
      <h1 style={{ fontSize: "3rem", margin: "0 0 0.5rem 0" }}>
        {catalogEntry.name}
      </h1>
      <p style={{ color: "#94a3b8", fontSize: "1.2rem", marginBottom: "2rem" }}>
        {catalogEntry.terminals}
      </p>

      {/* Stats Board */}
      <div
        style={{
          display: "flex",
          gap: "2rem",
          padding: "2rem",
          backgroundColor: "#151c2c",
          borderRadius: "16px",
          borderTop: `4px solid ${catalogEntry.color}`,
          marginBottom: "3rem",
          maxWidth: "600px",
        }}
      >
        <div>
          <div
            style={{
              color: "#64748b",
              textTransform: "uppercase",
              fontSize: "0.8rem",
              fontWeight: "bold",
            }}
          >
            Total Stations
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
            {catalogEntry.stations}
          </div>
        </div>
        <div>
          <div
            style={{
              color: "#64748b",
              textTransform: "uppercase",
              fontSize: "0.8rem",
              fontWeight: "bold",
            }}
          >
            Type
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
            {catalogEntry.type}
          </div>
        </div>
      </div>

      {/* Start Action */}
      <button
        onClick={() => navigate(`/${cityId}/${lineId}/play`)}
        style={{
          backgroundColor: "#a3e635",
          color: "#0b0f19",
          border: "none",
          padding: "1rem 3rem",
          fontSize: "1.2rem",
          fontWeight: "bold",
          borderRadius: "12px",
          cursor: "pointer",
          transition: "transform 0.1s",
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        Start Typing Sequence
      </button>
    </div>
  );
}

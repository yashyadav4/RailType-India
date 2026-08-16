import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide the navbar during active gameplay so it doesn't block your Game HUD!
  if (location.pathname.endsWith("/play")) {
    return null;
  }

  return (
    <nav
      style={{
        position: "fixed", // Keeps it permanently at the top
        top: 0,
        left: 0,
        right: 0,
        height: "75px",

        // The Glassmorphism Magic
        backgroundColor: "rgba(11, 15, 25, 0.65)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)", // For Safari support
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",

        zIndex: 1000, // Ensures it stays above all other content
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 3rem",
      }}
    >
      {/* Brand / Logo */}
      <div
        onClick={() => navigate("/")}
        style={{
          color: "#f8fafc",
          fontSize: "1.6rem",
          fontWeight: "900",
          cursor: "pointer",
          letterSpacing: "0.5px",
        }}
      >
        RailType<span style={{ color: "#a3e635" }}>.India</span>
      </div>

      {/* Navigation Links & Auth Placeholder */}
      <div style={{ display: "flex", gap: "2.5rem", alignItems: "center" }}>
        <span
          onClick={() => navigate("/")}
          style={{
            color: "#94a3b8",
            cursor: "pointer",
            fontWeight: "600",
            transition: "color 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = "#f8fafc")}
          onMouseOut={(e) => (e.currentTarget.style.color = "#94a3b8")}
        >
          Catalog
        </span>
        <span
          style={{
            color: "#94a3b8",
            cursor: "pointer",
            fontWeight: "600",
            transition: "color 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = "#facc15")}
          onMouseOut={(e) => (e.currentTarget.style.color = "#94a3b8")}
        >
          Leaderboard
        </span>

        {/* We will wire this button up when we build the backend */}
        <button
          style={{
            backgroundColor: "#2e2b4a",
            color: "#f8fafc",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "0.6rem 1.5rem",
            borderRadius: "30px",
            fontWeight: "700",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#3f3a63")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "#2e2b4a")
          }
        >
          Login
        </button>
      </div>
    </nav>
  );
}

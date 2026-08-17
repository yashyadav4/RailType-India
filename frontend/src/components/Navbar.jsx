import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide the navbar during active gameplay
  if (location.pathname.endsWith("/play")) {
    return null;
  }

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "70px",
        backgroundColor: "#1b1924", // Deep solid navy from the image
        borderBottom: "1px solid #2d2a3d", // Subtle bottom separator
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* 1. LEFT: Logo & Brand Area */}
      <div
        onClick={() => navigate("/")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          cursor: "pointer",
        }}
      >
        {/* Green Face Icon */}
        <div
          style={{
            width: "42px",
            height: "42px",
            backgroundColor: "#65c52c",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            position: "relative",
          }}
        >
          {/* Simple CSS Face to match the image */}
          <div style={{ display: "flex", gap: "8px", marginTop: "-4px" }}>
            <div
              style={{
                width: "5px",
                height: "5px",
                backgroundColor: "#fff",
                borderRadius: "50%",
              }}
            />
            <div
              style={{
                width: "5px",
                height: "5px",
                backgroundColor: "#fff",
                borderRadius: "50%",
              }}
            />
          </div>
          <div
            style={{
              width: "12px",
              height: "4px",
              backgroundColor: "#fff",
              borderRadius: "0 0 10px 10px",
              marginTop: "4px",
            }}
          />
        </div>

        {/* Stacked Text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              color: "#ffffff",
              fontSize: "1.1rem",
              fontWeight: "800",
              lineHeight: "1.2",
            }}
          >
            RailType.India
          </div>
          <div
            style={{
              color: "#8b889e",
              fontSize: "0.65rem",
              fontWeight: "600",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            Rail Typing
          </div>
        </div>
      </div>

      {/* 2. CENTER: Navigation Links */}
      <div
        style={{
          display: "flex",
          gap: "2.5rem",
          alignItems: "center",
          marginRight: "auto",
          marginLeft: "4rem", // Pushes links slightly to the left like the image
        }}
      >
        <span
          style={{
            color: "#e2e8f0",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.95rem",
          }}
        >
          Route maps
        </span>

        {/* Route Planner removed as requested */}

        <span
          style={{
            color: "#e2e8f0",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.95rem",
          }}
        >
          Line guides
        </span>

        <span
          style={{
            color: "#e2e8f0",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.95rem",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          Practice
          {/* Down Chevron SVG */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8b889e"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>

        <span
          style={{
            color: "#e2e8f0",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.95rem",
          }}
        >
          Blog
        </span>
      </div>

      {/* 3. RIGHT: Profile & Action Icons */}
      <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
        {/* Profile Circle */}
        <div
          style={{
            width: "38px",
            height: "38px",
            backgroundColor: "#7c939e",
            color: "#ffffff",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "600",
            fontSize: "1.1rem",
            marginRight: "0.5rem",
            cursor: "pointer",
          }}
        >
          Y
        </div>

        {/* Language button removed as requested */}

        {/* Sound Toggle Button */}
        <button
          style={{
            width: "38px",
            height: "38px",
            backgroundColor: "transparent",
            border: "1px solid #3f3c56",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#e2e8f0",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#2d2a3d")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          {/* Speaker SVG */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        </button>

        {/* Light/Dark Theme Button */}
        <button
          style={{
            width: "38px",
            height: "38px",
            backgroundColor: "transparent",
            border: "1px solid #3f3c56",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#e2e8f0",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "#2d2a3d")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          {/* Sun SVG */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        </button>
      </div>
    </nav>
  );
}

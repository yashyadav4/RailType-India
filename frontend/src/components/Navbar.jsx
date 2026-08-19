import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sun, Moon, User } from "lucide-react";

/* --------------------------------------------------------------------------
   useTheme — mirrors the exact same hook used in HomePage so both components
   read/write the same localStorage key and data-theme attribute.
   -------------------------------------------------------------------------- */
function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem("railtype-theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("railtype-theme", theme);
  }, [theme]);

  return [theme, setTheme];
}

/* --------------------------------------------------------------------------
   Navbar — sticky, glassmorphism bar that sits above every page via
   AppLayout › Outlet. Self-hides during active gameplay (/play routes).
   -------------------------------------------------------------------------- */
export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useTheme();
  const [activeLink, setActiveLink] = useState("home");

  // Keep activeLink in sync when the URL changes (e.g. back button)
  useEffect(() => {
    if (location.pathname === "/") {
      setActiveLink("home");
    } else if (location.pathname === "/lines") {
      setActiveLink("lines");
    } else {
      setActiveLink(null);
    }
  }, [location.pathname]);

  // Hide completely while the user is actively playing
  if (location.pathname.endsWith("/play")) return null;

  return (
    <>
      <style>{`
        /* ---- Navbar shell ---- */
        .rtnav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          height: 64px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          background: color-mix(in srgb, var(--void) 80%, transparent);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 3rem;
          font-family: inherit;
          transition: background 0.25s ease, border-color 0.25s ease;
        }

        /* ---- Wordmark ---- */
        .rtnav-wordmark {
          display: flex;
          align-items: baseline;
          gap: 0.4rem;
          font-weight: 800;
          font-size: 1.05rem;
          letter-spacing: 0.08em;
          color: var(--ink);
          cursor: pointer;
          user-select: none;
          text-decoration: none;
          transition: opacity 0.15s ease;
        }
        .rtnav-wordmark:hover { opacity: 0.82; }
        .rtnav-wordmark .dot { color: var(--marigold); }
        .rtnav-wordmark small {
          font-family: "IBM Plex Sans", sans-serif;
          font-weight: 500;
          font-size: 0.72rem;
          color: var(--ink-muted);
          letter-spacing: 0;
        }

        /* ---- Nav links ---- */
        .rtnav-links {
          display: flex;
          align-items: center;
          gap: 1.8rem;
          margin-left: auto;
        }
        .rtnav-link {
          font-size: 0.88rem;
          font-weight: 500;
          color: var(--ink-muted);
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          font-family: inherit;
          text-decoration: none;
          transition: color 0.15s ease;
          white-space: nowrap;
        }
        .rtnav-link:hover,
        .rtnav-link.active { color: var(--ink); }
        .rtnav-link.active {
          position: relative;
        }
        .rtnav-link.active::after {
          content: "";
          position: absolute;
          left: 0; right: 0;
          bottom: -4px;
          height: 2px;
          border-radius: 9999px;
          background: var(--marigold);
        }

        /* ---- Theme toggle ---- */
        .rtnav-theme-btn {
          width: 38px; height: 38px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--panel);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: var(--ink);
          margin-left: 1.2rem;
          transition: border-color 0.15s ease, transform 0.15s ease, background 0.25s ease;
        }
        .rtnav-theme-btn:hover {
          border-color: var(--marigold);
          transform: translateY(-1px);
        }

        /* ---- Responsive ---- */
        @media (max-width: 640px) {
          .rtnav { padding: 0 1.2rem; }
          .rtnav-link:not(.rtnav-theme-btn) { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .rtnav, .rtnav * { transition: none !important; }
        }
      `}</style>

      <nav className="rtnav" role="navigation" aria-label="Main navigation">
        {/* Wordmark / Logo */}
        <span className="rtnav-wordmark" onClick={() => { setActiveLink("home"); navigate("/"); }}>
          RAILTYPE<span className="dot">.</span>
          <small>type your way across India's railways</small>
        </span>

        {/* Links + theme toggle */}
        <div className="rtnav-links">
          <button
            className={`rtnav-link${activeLink === "home" ? " active" : ""}`}
            onClick={() => {
              setActiveLink("home");
              navigate("/");
            }}
          >
            Home
          </button>
          <button
            className={`rtnav-link${activeLink === "lines" ? " active" : ""}`}
            onClick={() => {
              setActiveLink("lines");
              navigate("/lines");
            }}
          >
            Lines
          </button>

          {/* Dark / Light toggle */}
          <button
            className="rtnav-theme-btn"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>
    </>
  );
}

import React from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import Navbar from "./Navbar";

const GithubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

const LinkedinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

// ── Footer ───────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        padding: "2.5rem 3rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
        color: "var(--ink-muted)",
        fontSize: "0.82rem",
        fontFamily: "inherit",
        transition: "border-color 0.25s, color 0.25s",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        <div>
          <span style={{ fontWeight: 700, color: "var(--ink)" }}>RAILTYPE</span>
          <span style={{ color: "var(--marigold)", fontWeight: 800 }}>.</span>{" "}
          <span>© {new Date().getFullYear()} · Made with ❤️ in India</span>
        </div>
        <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>
          Fan-made typing game · Station names are public facts · Not affiliated with any metro or railway operator.
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
        <a
          href="https://github.com/yashyadav4"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--ink-muted)",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            textDecoration: "none",
            transition: "color 0.15s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = "var(--ink)")}
          onMouseOut={(e) => (e.currentTarget.style.color = "var(--ink-muted)")}
        >
          <GithubIcon /> GitHub
        </a>
        <a
          href="https://www.linkedin.com/in/i-am-yash"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--ink-muted)",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            textDecoration: "none",
            transition: "color 0.15s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = "#0a66c2")}
          onMouseOut={(e) => (e.currentTarget.style.color = "var(--ink-muted)")}
        >
          <LinkedinIcon /> LinkedIn
        </a>
      </div>
    </footer>
  );
}

// ── App Layout ───────────────────────────────────────────────────────
export default function AppLayout() {
  const location = useLocation();
  const isPlaying = location.pathname.endsWith("/play");
  const isProfile = location.pathname === "/profile";
  const isSummary = location.pathname.endsWith("/summary");

  // Don't show footer on fullscreen pages
  const showFooter = !isPlaying && !isProfile && !isSummary;

  return (
    <div style={{ backgroundColor: "var(--void)", minHeight: "100vh", transition: "background-color .25s ease, color .25s ease" }}>
      {/* Page transition CSS */}
      <style>{`
        @keyframes pageEnter {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .page-transition {
          animation: pageEnter 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>

      <Navbar />

      <div style={{ paddingTop: isPlaying ? "0" : "64px" }}>
        <div key={location.pathname} className="page-transition">
          <Outlet />
        </div>
        {showFooter && <Footer />}
      </div>
    </div>
  );
}

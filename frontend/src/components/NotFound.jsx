import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Train } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "3rem 2rem",
        fontFamily: "inherit",
        color: "var(--ink)",
      }}
    >
      <style>{`
        @keyframes trainDrift {
          0%, 100% { transform: translateX(0); }
          50%      { transform: translateX(20px); }
        }
        .nf-train-icon {
          animation: trainDrift 3s ease-in-out infinite;
          color: var(--marigold);
          margin-bottom: 2rem;
          opacity: 0.7;
        }
        .nf-code {
          font-family: "JetBrains Mono", monospace;
          font-size: clamp(5rem, 12vw, 8rem);
          font-weight: 900;
          letter-spacing: -0.04em;
          background: linear-gradient(135deg, var(--marigold), var(--teal));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          line-height: 1;
        }
        .nf-msg {
          font-size: 1.3rem;
          font-weight: 700;
          margin: 1rem 0 0.5rem;
        }
        .nf-sub {
          font-size: 0.95rem;
          color: var(--ink-muted);
          max-width: 400px;
          line-height: 1.6;
          margin: 0 0 2.5rem;
        }
        .nf-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.9rem 2rem;
          border-radius: 12px;
          border: none;
          background: var(--marigold);
          color: var(--marigold-ink);
          font-family: inherit;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .nf-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px color-mix(in srgb, var(--marigold) 35%, transparent);
        }
      `}</style>

      <div className="nf-train-icon">
        <Train size={64} />
      </div>
      <h1 className="nf-code">404</h1>
      <p className="nf-msg">This train doesn't stop here!</p>
      <p className="nf-sub">
        The platform you're looking for doesn't exist on this network. 
        Let's get you back on track.
      </p>
      <button className="nf-btn" onClick={() => navigate("/")}>
        <ArrowLeft size={18} /> Back to Station
      </button>
    </div>
  );
}

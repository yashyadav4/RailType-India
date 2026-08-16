import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CITY_CATALOG } from "../data/cities/index";

export default function HomePage() {
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);

  // Extract cities from the catalog
  const cities = Object.values(CITY_CATALOG);

  // Compute total stats dynamically
  const totalLines = cities.reduce((acc, c) => acc + c.lines.length, 0);
  const totalStations = cities.reduce(
    (acc, c) => acc + c.lines.reduce((lAcc, l) => lAcc + l.stations, 0),
    0,
  );

  return (
    <div className="home-container">
      <style>{`
        .home-container {
          padding: 100px 3rem 3rem 3rem;
          min-height: 100vh;
          background-color: #0b0f19;
          color: #f8fafc;
          font-family: system-ui, -apple-system, sans-serif;
          
          box-sizing: border-box;
        }

        
        /* 2. Hero Section */
        .hero {
          max-width: 1200px;
          margin: 0 auto 3rem auto;
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 3rem;
          align-items: center;
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -1.5px;
          margin-bottom: 1.5rem;
        }

        .hero-subtitle {
          color: #94a3b8;
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 2rem;
          max-width: 540px;
        }

        .hero-cta-group {
          display: flex;
          gap: 1rem;
          margin-bottom: 3.5rem;
        }

        .btn-primary {
          background-color: #a3e635;
          color: #0b0f19;
          font-weight: 700;
          padding: 0.9rem 1.8rem;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          transition: transform 0.15s ease, background-color 0.2s ease;
        }

        .btn-primary:hover {
          background-color: #84cc16;
          transform: translateY(-2px);
        }

        .btn-secondary {
          background-color: #1e293b;
          color: #f8fafc;
          font-weight: 600;
          padding: 0.9rem 1.8rem;
          border-radius: 12px;
          border: 1px solid #334155;
          cursor: pointer;
          font-size: 1rem;
        }

        .btn-secondary:hover {
          background-color: #334155;
        }

        .hero-stats {
          display: flex;
          gap: 2.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 1.5rem;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 800;
        }

        .hero-graphic-box {
          background: radial-gradient(circle at center, rgba(163, 230, 53, 0.12) 0%, rgba(11, 15, 25, 0) 70%);
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 9rem;
          height: 280px;
        }

        /* 3. Cities & Rail Routes Section */
        .section {
          max-width: 1200px;
          margin: 5rem auto;
        }

        .city-group {
          margin-bottom: 4rem;
        }

        .city-header {
          display: flex;
          align-items: baseline;
          gap: 1rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding-bottom: 0.8rem;
        }

        .city-title {
          font-size: 2.2rem;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .city-operator {
          color: #a3e635;
          font-size: 0.95rem;
          font-weight: 600;
        }

        .routes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.2rem;
        }

        .route-card {
          background-color: #151c2c;
          border: 1px solid #2a364f;
          border-radius: 18px;
          padding: 1.5rem;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 180px;
        }

        .route-card:hover {
          transform: translateY(-4px);
          border-color: #a3e635;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
        }

        .route-top-strip {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
        }

        .route-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 0.4rem;
          margin-bottom: 1.2rem;
        }

        .route-badge {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1rem;
          color: #ffffff;
          flex-shrink: 0;
        }

        .route-title {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .route-terminals {
          font-size: 0.85rem;
          color: #94a3b8;
          margin-bottom: 1.5rem;
          line-height: 1.4;
        }

        .route-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
        }

        .route-pill-group {
          display: flex;
          gap: 0.5rem;
        }

        .route-pill {
          background-color: #1e293b;
          color: #94a3b8;
          padding: 0.35rem 0.7rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .route-play-btn {
          color: #a3e635;
          font-weight: 700;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        @media (max-width: 900px) {
          .hero {
            grid-template-columns: 1fr;
            text-align: center;
          }
          .hero-cta-group, .hero-stats {
            justify-content: center;
          }
          .hero-title {
            font-size: 2.5rem;
          }
        }
      `}</style>

      {/* 2. Hero Section */}
      <section className="hero">
        <div>
          <h1 className="hero-title">
            Type your way across real rail networks
          </h1>
          <p className="hero-subtitle">
            Pick a line, tap in, and type each station name in sequence. Every
            correct keystroke advances your train stop-by-stop across real GPS
            maps.
          </p>

          <div className="hero-cta-group">
            {/* Uses React Router to navigate directly to the Delhi Yellow Line info/play page */}
            <button
              className="btn-primary"
              onClick={() => navigate("/delhi/yellow_line")}
            >
              Start on Yellow Line
            </button>
            <button
              className="btn-secondary"
              onClick={() =>
                document
                  .getElementById("routes-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Browse all lines
            </button>
          </div>

          <div className="hero-stats">
            <div>
              <div className="stat-label">Lines</div>
              <div className="stat-value">{totalLines}</div>
            </div>
            <div>
              <div className="stat-label">Stations</div>
              <div className="stat-value">{totalStations}+</div>
            </div>
            <div>
              <div className="stat-label">Cities</div>
              <div className="stat-value">{cities.length}</div>
            </div>
          </div>
        </div>

        {/* Train Graphic Placeholder */}
        <div className="hero-graphic-box">
          <span>🚆</span>
        </div>
      </section>

      {/* 3. Cities & Rail Routes Section */}
      <section className="section" id="routes-section">
        {cities.map((city) => (
          <div key={city.id} className="city-group">
            <div className="city-header">
              <h2 className="city-title">{city.name}</h2>
              <span className="city-operator">{city.operator}</span>
            </div>

            <div className="routes-grid">
              {city.lines.map((line) => (
                <div
                  key={line.id}
                  className="route-card"
                  onClick={() => navigate(`/${city.id}/${line.id}`)}
                >
                  <div
                    className="route-top-strip"
                    style={{ backgroundColor: line.color }}
                  />
                  <div>
                    <div className="route-header">
                      <div
                        className="route-badge"
                        style={{ backgroundColor: line.color, color: "#000" }}
                      >
                        {line.code}
                      </div>
                      <div className="route-title">{line.name}</div>
                    </div>

                    <div className="route-terminals">{line.terminals}</div>
                  </div>

                  <div className="route-footer">
                    <div className="route-pill-group">
                      <span className="route-pill">
                        {line.stations} stations
                      </span>
                      <span className="route-pill">{line.type}</span>
                    </div>
                    <span className="route-play-btn">Play →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { SAMPLE_STATIONS } from "./data/SampleStations";
import MapView from "./components/MapView";

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [shake, setShake] = useState(false);

  // HUD Telemetry States
  const [elapsedMs, setElapsedMs] = useState(0);
  const [cpm, setCpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  // Telemetry Refs
  const startTimeRef = useRef(null);
  const totalKeystrokesRef = useRef(0);
  const correctKeystrokesRef = useRef(0);
  const inputRef = useRef(null);

  const currentStation = SAMPLE_STATIONS[currentIndex] || SAMPLE_STATIONS[0];
  const targetStation = currentStation.name;
  const prevStation =
    currentIndex > 0 ? SAMPLE_STATIONS[currentIndex - 1].name : "START";
  const nextStation =
    currentIndex < SAMPLE_STATIONS.length - 1
      ? SAMPLE_STATIONS[currentIndex + 1].name
      : "TERMINUS";

  // Realtime Timer & Stats Loop
  useEffect(() => {
    const timer = setInterval(() => {
      if (!startTimeRef.current) return;

      const now = Date.now();
      const diff = now - startTimeRef.current;
      setElapsedMs(diff);

      const elapsedMinutes = diff / 1000 / 60;
      if (elapsedMinutes > 0) {
        const calculatedCpm = Math.round(
          correctKeystrokesRef.current / elapsedMinutes,
        );
        setCpm(calculatedCpm);
      }

      const calculatedAcc =
        totalKeystrokesRef.current > 0
          ? Math.round(
              (correctKeystrokesRef.current / totalKeystrokesRef.current) * 100,
            )
          : 100;
      setAccuracy(calculatedAcc);
    }, 50);

    return () => clearInterval(timer);
  }, []);

  // Format Elapsed Time (M:SS.ms)
  const formatTime = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const millis = Math.floor((ms % 1000) / 10);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}.${millis < 10 ? "0" : ""}${millis}`;
  };

  const handleInputChange = (e) => {
    const value = e.target.value;

    if (!startTimeRef.current && value.length > 0) {
      startTimeRef.current = Date.now();
    }

    if (value.length < userInput.length) {
      setUserInput(value);
      return;
    }

    totalKeystrokesRef.current += 1;
    const typedChar = value[value.length - 1];
    const expectedChar = targetStation[userInput.length];

    if (typedChar !== expectedChar) {
      setShake(true);
      setTimeout(() => setShake(false), 300);
      return;
    }

    correctKeystrokesRef.current += 1;
    setUserInput(value);

    if (value === targetStation) {
      if (currentIndex < SAMPLE_STATIONS.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setUserInput("");
      } else {
        alert(
          `🎉 Line Complete!\nTime: ${formatTime(elapsedMs)}\nCPM: ${cpm}\nAccuracy: ${accuracy}%`,
        );
      }
    }
  };

  const renderStyledStationName = () => {
    return targetStation.split("").map((char, index) => {
      let colorClass = "#94a3b8"; // Untyped letter

      if (index < userInput.length) {
        colorClass = "#16a34a"; // Typed correct letter
      }

      const isCursor = index === userInput.length;

      return (
        <span key={index} style={{ position: "relative", color: colorClass }}>
          {isCursor && (
            <span
              style={{
                position: "absolute",
                left: "-2px",
                top: "10%",
                bottom: "10%",
                width: "3px",
                backgroundColor: "#16a34a",
                borderRadius: "2px",
              }}
            />
          )}
          {char}
        </span>
      );
    });
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "sans-serif",
        backgroundColor: "#0b0f19",
      }}
      onClick={() => inputRef.current?.focus()}
    >
      <style>{`
        @keyframes shake {
          0%, 100% { transform:  translateX(0); }
          20%, 60% { transform:  translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .shake-animation {
          animation: shake 0.3s ease-in-out !important;
        }
      `}</style>

      {/* 1. Fullscreen Map Canvas */}
      <MapView stations={SAMPLE_STATIONS} activeIndex={currentIndex} />

      {/* 2. Top HUD Header Bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.2rem 2.5rem",
          background:
            "linear-gradient(to bottom, rgba(11,15,25,0.9), rgba(11,15,25,0))",
        }}
      >
        {/* Line Info */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              backgroundColor: "#f97316",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
            }}
          >
            🚂
          </div>
          <div>
            <h3 style={{ margin: 0, color: "#f8fafc", fontSize: "1.1rem" }}>
              INDORE METRO
            </h3>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.8rem" }}>
              Bhawarkuwa → Palasiya
            </p>
          </div>
        </div>

        {/* Timer Display */}
        <div
          style={{
            fontSize: "2.2rem",
            fontWeight: "bold",
            color: "#facc15",
            fontFamily: "monospace",
            letterSpacing: "2px",
          }}
        >
          {formatTime(elapsedMs)}
        </div>

        {/* Telemetry Stats & Controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2rem",
            color: "#f8fafc",
          }}
        >
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                fontSize: "0.75rem",
                color: "#94a3b8",
                display: "block",
              }}
            >
              Stations
            </span>
            <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
              {currentIndex}/{SAMPLE_STATIONS.length}
            </span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                fontSize: "0.75rem",
                color: "#94a3b8",
                display: "block",
              }}
            >
              Accuracy
            </span>
            <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
              {accuracy}.0%
            </span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                fontSize: "0.75rem",
                color: "#94a3b8",
                display: "block",
              }}
            >
              CPM
            </span>
            <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
              {cpm}
            </span>
          </div>
          <button
            style={{
              backgroundColor: "#1e293b",
              color: "#f8fafc",
              border: "1px solid #334155",
              padding: "0.5rem 1.2rem",
              borderRadius: "20px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Pause
          </button>
        </div>
      </div>

      {/* 3 & 4. Bottom UI Wrapper */}
      <div
        style={{
          position: "absolute",
          bottom: "1.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.6rem",
          zIndex: 10,
        }}
      >
        {/* Floating Metro Station Signboard */}
        <div
          className={shake ? "shake-animation" : ""}
          style={{
            backgroundColor: "#fefcf3",
            borderRadius: "28px",
            width: "520px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
            overflow: "hidden",
            transition: "transform 0.1s ease",
          }}
        >
          <div
            style={{
              padding: "0.5rem 1rem 1rem 1rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "1rem",
                marginBottom: "0.5rem",
              }}
            >
              <div
                style={{
                  border: "3px solid #f97316",
                  borderRadius: "12px",
                  padding: "4px 10px",
                  fontWeight: "bold",
                  color: "#000",
                  fontSize: "1.1rem",
                }}
              >
                {currentStation.code}

                <p
                  style={{
                    color: "#64748b",
                    fontSize: "0.9rem",
                    margin: "0 0 0.5rem 0",
                    letterSpacing: "1px",
                  }}
                >
                  {currentStation.hindiName}
                </p>
              </div>
            </div>

            {/* Typing String Display */}
            <div
              style={{
                fontSize: "2.2rem",
                fontWeight: "bold",
                fontFamily: "monospace",
                letterSpacing: "2px",
                margin: "1.5rem 0",
              }}
            >
              {renderStyledStationName()}
            </div>
          </div>

          {/* Bottom Station Accent Banner */}
          <div
            style={{
              backgroundColor: "#f97316",
              color: "#ffffff",
              padding: "0.8rem 1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: "bold",
              fontSize: "0.9rem",
            }}
          >
            <span>◀ {prevStation}</span>

            <span
              style={{
                fontSize: "0.8rem",
                opacity: 0.9,
              }}
            >
              अगला (Next)
            </span>

            <span>{nextStation} ▶</span>
          </div>
        </div>

        {/* Bottom Hint */}
        <div
          style={{
            color: "#94a3b8",
            fontSize: "0.85rem",
            textAlign: "center",
          }}
        >
          Wrong keys are ignored — just type the correct letter, no backspace
          needed.
        </div>
      </div>

      {/* Hidden Auto-focused Input */}
      <input
        ref={inputRef}
        type="text"
        value={userInput}
        onChange={handleInputChange}
        style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
        autoFocus
      />
    </div>
  );
}

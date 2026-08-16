import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { loadRouteData } from "../data/cities/index";
import MapView from "./MapView";

export default function GameView() {
  const { cityId, lineId } = useParams();
  const navigate = useNavigate();

  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gameplay States (Only things that actually change the layout)
  const [currentIndex, setCurrentIndex] = useState(1);
  const [userInput, setUserInput] = useState("");
  const [shake, setShake] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Core Telemetry Refs (Invisible, no re-renders)
  const startTimeRef = useRef(null);
  const totalKeystrokesRef = useRef(0);
  const correctKeystrokesRef = useRef(0);
  const isCompletedRef = useRef(false);
  const elapsedMsRef = useRef(0); // Holds final time for the summary page

  // Station Split Refs
  const splitsRef = useRef([]);
  const currentStationStartTimeRef = useRef(null);
  const currentStationMistakesRef = useRef(0);
  const totalMistakesRef = useRef(0);

  // DOM Refs (For direct HTML updates, bypassing React)
  const inputRef = useRef(null);
  const timerDivRef = useRef(null);
  const cpmDivRef = useRef(null);
  const accuracyDivRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Reset & Load Route
  useEffect(() => {
    let isMounted = true;
    async function fetchRoute() {
      setLoading(true);
      const data = await loadRouteData(cityId, lineId);
      if (isMounted && data) {
        setRouteData(data);
        setCurrentIndex(1);
        setUserInput("");
        setIsCompleted(false);

        // Reset all refs
        isCompletedRef.current = false;
        startTimeRef.current = null;
        totalKeystrokesRef.current = 0;
        correctKeystrokesRef.current = 0;
        elapsedMsRef.current = 0;
        splitsRef.current = [];
        currentStationStartTimeRef.current = null;
        currentStationMistakesRef.current = 0;
        totalMistakesRef.current = 0;

        // Reset DOM elements manually just in case
        if (timerDivRef.current) timerDivRef.current.innerText = "0:00.00";
        if (cpmDivRef.current) cpmDivRef.current.innerText = "0";
        if (accuracyDivRef.current) accuracyDivRef.current.innerText = "100.0%";

        setLoading(false);
      }
    }
    fetchRoute();

    // Cleanup animation frame if component unmounts early
    return () => {
      isMounted = false;
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    };
  }, [cityId, lineId]);

  // Handle the automatic transition to the summary page
  useEffect(() => {
    if (isCompleted) {
      const transitionTimer = setTimeout(() => {
        navigateToSummary();
      }, 3000);
      return () => clearTimeout(transitionTimer);
    }
  }, [isCompleted]);

  // THE ENGINE: Runs at native 60fps natively synced with your monitor
  const updateTelemetry = () => {
    if (!startTimeRef.current || isCompletedRef.current) return;

    const now = Date.now();
    const diff = now - startTimeRef.current;
    elapsedMsRef.current = diff; // Save silently for the end

    // 1. Direct DOM Update for Timer
    if (timerDivRef.current) {
      timerDivRef.current.innerText = formatTime(diff);
    }

    // 2. Direct DOM Update for CPM
    const elapsedMinutes = diff / 1000 / 60;
    if (elapsedMinutes > 0 && cpmDivRef.current) {
      cpmDivRef.current.innerText = Math.round(
        correctKeystrokesRef.current / elapsedMinutes,
      );
    }

    // 3. Direct DOM Update for Accuracy
    if (accuracyDivRef.current) {
      const acc =
        totalKeystrokesRef.current > 0
          ? Math.round(
              (correctKeystrokesRef.current / totalKeystrokesRef.current) * 100,
            )
          : 100;
      accuracyDivRef.current.innerText = `${acc}.0%`;
    }

    // Loop it for the next screen refresh
    animationFrameRef.current = requestAnimationFrame(updateTelemetry);
  };

  const navigateToSummary = () => {
    // Calculate final stats one last time to pass to the Summary Page
    const finalTimeMs = elapsedMsRef.current;
    const finalElapsedMinutes = finalTimeMs / 1000 / 60;
    const finalCpm =
      finalElapsedMinutes > 0
        ? Math.round(correctKeystrokesRef.current / finalElapsedMinutes)
        : 0;
    const finalAccuracy =
      totalKeystrokesRef.current > 0
        ? Math.round(
            (correctKeystrokesRef.current / totalKeystrokesRef.current) * 100,
          )
        : 100;

    navigate(`/${cityId}/${lineId}/summary`, {
      state: {
        timeFormatted: formatTime(finalTimeMs),
        timeMs: finalTimeMs,
        cpm: finalCpm,
        accuracy: finalAccuracy,
        totalMistakes: totalMistakesRef.current,
        splits: splitsRef.current,
      },
    });
  };

  const formatTime = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const millis = Math.floor((ms % 1000) / 10);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}.${millis < 10 ? "0" : ""}${millis}`;
  };

  if (loading || !routeData) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          backgroundColor: "#0b0f19",
          color: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h2>Loading Metro Route...</h2>
      </div>
    );
  }

  const stations = routeData.stations || [];
  const currentStation = stations[currentIndex] || stations[1];
  const targetStation = currentStation?.name || "";
  const prevStation = stations[currentIndex - 1]?.name || "ORIGIN";
  const nextStation =
    currentIndex < stations.length - 1
      ? stations[currentIndex + 1].name
      : "TERMINUS";

  const handleInputChange = (e) => {
    if (isCompleted) return;

    const value = e.target.value;
    const now = Date.now();

    // FIRST KEYSTROKE: Start the clocks and ignite the rAF loop!
    if (!startTimeRef.current && value.length > 0) {
      startTimeRef.current = now;
      currentStationStartTimeRef.current = now;
      animationFrameRef.current = requestAnimationFrame(updateTelemetry);
    }

    if (value.length < userInput.length) {
      setUserInput(value);
      return;
    }

    totalKeystrokesRef.current += 1;
    const typedChar = value[value.length - 1];
    const expectedChar = targetStation[userInput.length];

    // ON MISTAKE
    if (typedChar.toLowerCase() !== expectedChar.toLowerCase()) {
      totalMistakesRef.current += 1;
      currentStationMistakesRef.current += 1;
      setShake(true);
      setTimeout(() => setShake(false), 300);
      return;
    }

    // ON CORRECT KEYSTROKE
    correctKeystrokesRef.current += 1;
    setUserInput(value);

    // ON STATION COMPLETE
    if (value.toLowerCase() === targetStation.toLowerCase()) {
      const stationTimeMs = now - currentStationStartTimeRef.current;

      // Save split data silently
      splitsRef.current.push({
        name: targetStation,
        timeMs: stationTimeMs,
        mistakes: currentStationMistakesRef.current,
      });

      if (currentIndex < stations.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setUserInput("");

        // Reset timers for the next station
        currentStationStartTimeRef.current = now;
        currentStationMistakesRef.current = 0;
      } else {
        // Game Over! Stop the loop.
        isCompletedRef.current = true;
        cancelAnimationFrame(animationFrameRef.current);
        setIsCompleted(true);
      }
    }
  };

  const renderStyledStationName = () => {
    return targetStation.split("").map((char, index) => {
      let colorClass = "#94a3b8";
      if (index < userInput.length) colorClass = "#16a34a";
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
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .shake-animation { animation: shake 0.3s ease-in-out !important; }
        @keyframes popIn {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* 1. Fullscreen Map Canvas */}
      <MapView
        stations={stations}
        activeIndex={currentIndex}
        userInputLength={userInput.length}
        targetLength={targetStation.length}
      />

      {/* Completion Overlay */}
      {isCompleted && (
        <div
          onClick={navigateToSummary}
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(11, 15, 25, 0.65)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              backgroundColor: "#292742",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "20px",
              padding: "3rem 4rem",
              textAlign: "center",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              animation: "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            }}
          >
            <div
              style={{
                color: "#94a3b8",
                fontSize: "0.85rem",
                letterSpacing: "3px",
                fontWeight: "700",
                textTransform: "uppercase",
                marginBottom: "1rem",
              }}
            >
              Final Stop
            </div>
            <h2
              style={{
                color: "#ffffff",
                fontSize: "2.2rem",
                margin: "0 0 2rem 0",
                fontWeight: "800",
              }}
            >
              Line complete!
            </h2>
            <div
              style={{
                color: "#facc15",
                fontSize: "3.5rem",
                fontFamily: "monospace",
                fontWeight: "bold",
                letterSpacing: "2px",
              }}
            >
              {/* Force a final read from the ref to display on the overlay */}
              {formatTime(elapsedMsRef.current)}
            </div>
          </div>
        </div>
      )}

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
            "linear-gradient(to bottom, rgba(11,15,25,0.95), rgba(11,15,25,0))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              backgroundColor: routeData.color || "#f97316",
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
              {routeData.systemName.toUpperCase()}
            </h3>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.8rem" }}>
              {routeData.startTerminal} → {routeData.endTerminal}
            </p>
          </div>
        </div>

        {/* Timer tied directly to the DOM Ref */}
        <div
          ref={timerDivRef}
          style={{
            fontSize: "2.2rem",
            fontWeight: "bold",
            color: "#facc15",
            fontFamily: "monospace",
            letterSpacing: "2px",
          }}
        >
          0:00.00
        </div>

        {/* Live Telemetry Stats tied to DOM Refs */}
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
              {currentIndex}/{stations.length - 1}
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
            <span
              ref={accuracyDivRef}
              style={{ fontWeight: "bold", fontSize: "1.1rem" }}
            >
              100.0%
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
            <span
              ref={cpmDivRef}
              style={{ fontWeight: "bold", fontSize: "1.1rem" }}
            >
              0
            </span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Typing Card UI */}
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
            style={{ padding: "0.5rem 1rem 1rem 1rem", textAlign: "center" }}
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
                  border: `3px solid ${routeData.color || "#f97316"}`,
                  borderRadius: "12px",
                  padding: "4px 10px",
                  fontWeight: "bold",
                  color: "#000",
                  fontSize: "1.1rem",
                }}
              >
                {currentStation.code}
              </div>
            </div>
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

          <div
            style={{
              backgroundColor: routeData.color || "#f97316",
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
            <span style={{ fontSize: "0.8rem", opacity: 0.9 }}>
              Next Station
            </span>
            <span>{nextStation} ▶</span>
          </div>
        </div>
        <div
          style={{ color: "#94a3b8", fontSize: "0.85rem", textAlign: "center" }}
        >
          Wrong keys are ignored — type the exact station name.
        </div>
      </div>

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

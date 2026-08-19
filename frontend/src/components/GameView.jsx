import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { loadRouteData } from "../data/cities/index";
import MapView from "./MapView";

// ── Subtle Sound Engine (Web Audio API) ─────────────────────────────
let _audioCtx = null;
let _noiseBuffer = null; // Pre-generated, reused across all keypresses

const getAudioCtx = () => {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Pre-generate a 50ms white noise buffer once
    const len = Math.floor(_audioCtx.sampleRate * 0.05);
    _noiseBuffer = _audioCtx.createBuffer(1, len, _audioCtx.sampleRate);
    const ch = _noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
  }
  if (_audioCtx.state === "suspended") _audioCtx.resume();
  return _audioCtx;
};

/**
 * Mechanical keyboard sound — models 4 acoustic layers of a real Cherry MX switch:
 *  1. Click transient  — the sharp snap of the switch leaf engaging (~3ms)
 *  2. Spring ping       — brief metallic resonance from the coil spring (~15ms)
 *  3. Bottom-out thud   — low thump when the stem hits the housing floor (~20ms)
 *  4. Plate resonance   — the mounting plate ringing very briefly (~10ms)
 *
 * Each keypress is subtly randomized in pitch so repeated typing feels organic.
 */
const playTypeClick = () => {
  const ctx = getAudioCtx();
  const t = ctx.currentTime;
  const r = () => 0.93 + Math.random() * 0.14;

  // ── 1. Key contact "tock" (the mechanical signature) ──
  // Mid-frequency bandpass noise — crisp but not shrill
  const tockNoise = ctx.createBufferSource();
  tockNoise.buffer = _noiseBuffer;
  const tockBPF = ctx.createBiquadFilter();
  tockBPF.type = "bandpass";
  tockBPF.frequency.value = 2500 * r();
  tockBPF.Q.value = 1.8;
  const tockGain = ctx.createGain();
  tockGain.gain.setValueAtTime(0.09, t);
  tockGain.gain.exponentialRampToValueAtTime(0.001, t + 0.012);
  tockNoise.connect(tockBPF).connect(tockGain).connect(ctx.destination);
  tockNoise.start(t);
  tockNoise.stop(t + 0.012);

  // ── 2. Bottom-out thump ──
  // Moderate low-end punch — not sub-bassy, just grounded
  const thudOsc = ctx.createOscillator();
  const thudGain = ctx.createGain();
  thudOsc.type = "sine";
  thudOsc.frequency.setValueAtTime(180 * r(), t);
  thudOsc.frequency.exponentialRampToValueAtTime(70, t + 0.03);
  thudGain.gain.setValueAtTime(0.065, t);
  thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
  thudOsc.connect(thudGain).connect(ctx.destination);
  thudOsc.start(t);
  thudOsc.stop(t + 0.03);

  // ── 3. Plate ring (subtle high-end definition) ──
  // A tiny bit of higher frequency to keep it crisp and "mechanical"
  const ringNoise = ctx.createBufferSource();
  ringNoise.buffer = _noiseBuffer;
  const ringBPF = ctx.createBiquadFilter();
  ringBPF.type = "bandpass";
  ringBPF.frequency.value = 4500 * r();
  ringBPF.Q.value = 4;
  const ringGain = ctx.createGain();
  ringGain.gain.setValueAtTime(0.025, t);
  ringGain.gain.exponentialRampToValueAtTime(0.001, t + 0.008);
  ringNoise.connect(ringBPF).connect(ringGain).connect(ctx.destination);
  ringNoise.start(t);
  ringNoise.stop(t + 0.008);
};

/**
 * Station complete — 3-note ascending arpeggio (C5 → E5 → G5)
 * with a warm sine base + soft triangle harmonic overlay
 */
const playSuccessChime = () => {
  const ctx = getAudioCtx();
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

  notes.forEach((freq, i) => {
    const t = ctx.currentTime + i * 0.1;

    // Warm sine base note
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.value = freq;
    g1.gain.setValueAtTime(0.07, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc1.connect(g1).connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.25);

    // Soft triangle shimmer one octave up
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.value = freq * 2;
    g2.gain.setValueAtTime(0.025, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc2.connect(g2).connect(ctx.destination);
    osc2.start(t);
    osc2.stop(t + 0.2);
  });
};

/** Quick low-freq buzz for wrong key */
const playErrorBuzz = () => {
  const ctx = getAudioCtx();
  const t = ctx.currentTime;

  // Dissonant dual-oscillator buzz
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  osc1.type = "square";
  osc2.type = "sawtooth";
  osc1.frequency.value = 180;
  osc2.frequency.value = 220;
  gain.gain.setValueAtTime(0.035, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);
  osc1.start(t);
  osc2.start(t);
  osc1.stop(t + 0.1);
  osc2.stop(t + 0.1);
};

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
          backgroundColor: "var(--void)",
          color: "var(--ink)",
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
      playErrorBuzz();
      setShake(true);
      setTimeout(() => setShake(false), 300);
      return;
    }

    // ON CORRECT KEYSTROKE
    correctKeystrokesRef.current += 1;
    playTypeClick();
    setUserInput(value);

    // ON STATION COMPLETE
    if (value.toLowerCase() === targetStation.toLowerCase()) {
      const stationTimeMs = now - currentStationStartTimeRef.current;
      playSuccessChime();

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
      let colorClass = "var(--ink-muted)";
      if (index < userInput.length) colorClass = "var(--teal)";
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
                backgroundColor: "var(--teal)",
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
        fontFamily: "inherit",
        backgroundColor: "var(--void)",
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
            backgroundColor: "color-mix(in srgb, var(--void) 75%, transparent)",
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
              backgroundColor: "var(--panel)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              padding: "3rem 4rem",
              textAlign: "center",
              boxShadow: "var(--shadow-md)",
              animation: "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            }}
          >
            <div
              style={{
                color: "var(--ink-muted)",
                fontSize: "0.85rem",
                letterSpacing: "3px",
                fontWeight: "700",
                textTransform: "uppercase",
                marginBottom: "1rem",
                fontFamily: "inherit",
              }}
            >
              Final Stop
            </div>
            <h2
              style={{
                color: "var(--ink)",
                fontSize: "2.2rem",
                margin: "0 0 2rem 0",
                fontWeight: "800",
              }}
            >
              Line complete!
            </h2>
            <div
              style={{
                color: "var(--marigold)",
                fontSize: "3.5rem",
                fontFamily: '"JetBrains Mono", monospace',
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
            "linear-gradient(to bottom, var(--void), transparent)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              backgroundColor: routeData.color || "var(--marigold)",
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
            <h3 style={{ margin: 0, color: "var(--ink)", fontSize: "1.1rem" }}>
              {routeData.systemName.toUpperCase()}
            </h3>
            <p style={{ margin: 0, color: "var(--ink-muted)", fontSize: "0.8rem" }}>
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
            color: "var(--lc, var(--marigold))",
            fontFamily: '"JetBrains Mono", monospace',
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
            color: "var(--ink)",
          }}
        >
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--ink-muted)",
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
                color: "var(--ink-muted)",
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
                color: "var(--ink-muted)",
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
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
          zIndex: 10,
        }}
      >
        <div
          className={shake ? "shake-animation" : ""}
          style={{
            backgroundColor: "var(--panel-raised)",
            border: "1px solid var(--border)",
            borderRadius: "32px",
            width: "700px",
            boxShadow: "var(--shadow-md)",
            overflow: "hidden",
            transition: "transform 0.1s ease",
          }}
        >
          {/* Main Content Area (Row Layout) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "2.5rem 3rem",
              gap: "2.5rem",
            }}
          >
            {/* Left: Station Code Box (Mimicking the JY/30 box) */}
            <div
              style={{
                border: `5px solid ${routeData.color || "var(--marigold)"}`,
                borderRadius: "18px",
                width: "65px",
                height: "65px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "800",
                color: "var(--panel-raised)",
                backgroundColor: routeData.color || "var(--marigold)",
                fontFamily: '"JetBrains Mono", monospace',
                flexShrink: 0,
              }}
            >
              {/* If the code has a hyphen (like ML-01), stack it like the reference image */}
              {currentStation?.code?.includes("-") ? (
                <>
                  <span style={{ fontSize: "1rem", lineHeight: "1.2", letterSpacing: "1px" }}>
                    {currentStation.code.split("-")[0]}
                  </span>
                  <span style={{ fontSize: "1.6rem", lineHeight: "1" }}>
                    {currentStation.code.split("-")[1]}
                  </span>
                </>
              ) : (
                <span
                  style={{
                    fontSize:
                      currentStation?.code?.length > 4 ? "1rem" : "1.3rem",
                  }}
                >
                  {currentStation?.code}
                </span>
              )}
            </div>

            {/* Right: Text Information block */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                width: "100%",
              }}
            >
              {/* Local Name (Massive, equivalent to the Kanji) */}
              <div
                style={{
                  fontSize: "2.0rem",
                  fontWeight: "900",
                  color: "var(--ink)",
                  lineHeight: "1.1",
                  marginBottom: "0.5rem",
                  fontFamily: "inherit",
                }}
              >
                {currentStation?.localName || currentStation?.name}
              </div>

              {/* English Name (Small, Uppercase, Spaced Out) */}
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: "700",
                  color: "var(--ink-muted)",
                  letterSpacing: "4px",
                  textTransform: "uppercase",
                  marginBottom: "2rem",
                }}
              >
                {currentStation?.name}
              </div>

              {/* Typing Render Component (Monospace styling preserved) */}
              <div
                style={{
                  fontSize: "2.2rem",
                  fontWeight: "bold",
                  fontFamily: '"JetBrains Mono", monospace',
                  letterSpacing: "2px",
                  color: "var(--ink-muted)",
                  display: "flex",
                  alignItems: "center",
                  whiteSpace: "pre-wrap",
                }}
              >
                {renderStyledStationName()}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div
            style={{
              backgroundColor: routeData.color || "var(--marigold)",
              color: "#14100b", // Keeping dark ink for good contrast on bright train line colors
              padding: "1rem 2rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: "bold",
              fontSize: "1rem",
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            <span style={{ flex: 1, textAlign: "left" }}>
              ◀ {prevStation || "---"}
            </span>
            <span
              style={{
                fontSize: "0.85rem",
                opacity: 0.9,
                flex: 1,
                textAlign: "center",
              }}
            >
              Next Station
            </span>
            <span style={{ flex: 1, textAlign: "right" }}>
              {nextStation || "---"} ▶
            </span>
          </div>
        </div>

        {/* Helper Text */}
        <div
          style={{
            color: "var(--ink-muted)",
            fontSize: "0.9rem",
            textAlign: "center",
            marginTop: "0.5rem",
            fontFamily: "inherit",
          }}
        >
          Wrong keys are ignored — just type the correct letter, no backspace
          needed.
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

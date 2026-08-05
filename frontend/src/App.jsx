import { useEffect, useState, useRef } from "react";

const SAMPLE_STATIONS = ["Bhawarkuwa", "navlakha", "GPO", "Palasiya"];

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [shake, setShake] = useState("");

  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  // Telemetry Refs (Silent Engine - no re-renders!)
  const startTimeRef = useRef(null);
  const totalKeystrokesRef = useRef(0);
  const correctKeystrokesRef = useRef(0);

  const targetStation = SAMPLE_STATIONS[currentIndex];

  useEffect(() => {
    const timer = setInterval(() => {
      if (!startTimeRef.current) return;

      const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;
      if (elapsedSeconds < 1) return;

      // WPM = (Total Correct Chars / 5) / Elapsed Minutes
      const wordsTyped = correctKeystrokesRef.current / 5;
      const minutesElapsed = elapsedSeconds / 60;
      const calculatedWpm = Math.round(wordsTyped / minutesElapsed);

      // Accuracy = (Correct Keystrokes / Total Keystrokes) * 100
      const calculatedAccuracy =
        totalKeystrokesRef.current > 0
          ? Math.round(
              (correctKeystrokesRef.current / totalKeystrokesRef.current) * 100,
            )
          : 100;

      setWpm(calculatedWpm);
      setAccuracy(calculatedAccuracy);
    }, 500);

    return () => clearInterval(timer);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value.length > targetStation.length) return;

    // Start timer on very first keystroke
    if (!startTimeRef.current && value.length > 0) {
      startTimeRef.current = Date.now();
    }

    if (value.length < userInput.length) {
      setUserInput(value);
      return;
    }

    totalKeystrokesRef.current += 1;

    // Get the character just typed
    const typedChar = value[value.length - 1];
    const expectedChar = targetStation[userInput.length];

    // STOP & SHAKE RULE: Did they type the wrong character?
    if (typedChar !== expectedChar) {
      // Trigger CSS Shake Animation
      setShake(true);
      setTimeout(() => setShake(false), 300); // Remove shake class after 300ms
      return; // DO NOT update userInput (Stops input from advancing!)
    }

    correctKeystrokesRef.current += 1;
    setUserInput(value);

    if (value === targetStation) {
      if (currentIndex < SAMPLE_STATIONS.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setUserInput("");
      } else {
        alert(`🎉 Line Complete!\nFinal WPM: ${wpm}\nAccuracy: ${accuracy}%`);
      }
    }
  };
  const renderStyledStationName = () => {
    return targetStation.split("").map((char, index) => {
      let colorClass = "#64748b"; // Default (untyped letter)

      if (index < userInput.length) {
        colorClass = "#34d399"; // Correct letter (Neon Green)
      } else if (index === userInput.length && shake) {
        colorClass = "#f43f5e"; // Current active letter flashes Red on typo
      }

      return (
        <span
          key={index}
          style={{
            color: colorClass,
            padding: "0 2px",
            borderBottom:
              index === userInput.length ? "3px solid #38bdf8" : "none", // Active cursor underline
          }}
        >
          {char}
        </span>
      );
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#090d16",
        color: "#f8fafc",
        fontFamily: "monospace",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      {/* CSS Keyframe Animation for Shake */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .shake-animation {
          animation: shake 0.3s ease-in-out;
          border-color: #f43f5e !important;
        }
      `}</style>
      {/* Dark Mode Terminal Container */}
      <div
        className={shake ? "shake-animation" : ""}
        style={{
          backgroundColor: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "16px",
          padding: "3rem",
          maxWidth: "600px",
          width: "100%",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
          textAlign: "center",
          transition: "border-color 0.2s ease",
        }}
      >
        {/* Line Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "1.5rem",
          }}
        >
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#eab308",
            }}
          ></span>
          <span
            style={{
              color: "#94a3b8",
              fontSize: "0.9rem",
              letterSpacing: "1px",
            }}
          >
            DELHI METRO • YELLOW LINE
          </span>
        </div>
        {/* Live Telemetry Display */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            backgroundColor: "#020617",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "2rem",
            border: "1px solid #1e293b",
          }}
        >
          <div>
            <p style={{ color: "#64748b", fontSize: "0.75rem" }}>SPEED</p>
            <p
              style={{
                fontSize: "1.8rem",
                fontWeight: "bold",
                color: "#38bdf8",
              }}
            >
              {wpm} <span style={{ fontSize: "0.9rem" }}>WPM</span>
            </p>
          </div>
          <div>
            <p style={{ color: "#64748b", fontSize: "0.75rem" }}>ACCURACY</p>
            <p
              style={{
                fontSize: "1.8rem",
                fontWeight: "bold",
                color: "#34d399",
              }}
            >
              {accuracy}%
            </p>
          </div>
        </div>
        {/* Dynamic Station Target Display */}
        <p
          style={{
            color: "#64748b",
            fontSize: "0.85rem",
            marginBottom: "0.5rem",
          }}
        >
          NEXT STATION
        </p>
        <div
          style={{
            fontSize: "3rem",
            fontWeight: "bold",
            letterSpacing: "2px",
            marginBottom: "2.5rem",
          }}
        >
          {renderStyledStationName()}
        </div>

        <input
          type="text"
          value={userInput}
          onChange={handleInputChange}
          placeholder="type the station name here"
          style={{
            width: "100%",
            padding: "1rem",
            fontSize: "1.2rem",
            backgroundColor: "#020617",
            border: "1px solid #334155",
            borderRadius: "8px",
            color: "#38bdf8",
            outline: "none",
            textAlign: "center",
            fontFamily: "monospace",
          }}
          autoFocus
        />
        <div
          style={{
            marginTop: "2rem",
            display: "flex",
            justifyContent: "space-between",
            color: "#64748b",
            fontSize: "0.85rem",
          }}
        >
          <span>
            STATION {currentIndex + 1} OF {SAMPLE_STATIONS.length}
          </span>
          <span>MODE: LOCAL</span>
        </div>
      </div>
    </div>
  );
}

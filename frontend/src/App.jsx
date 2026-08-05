import { useState } from "react";

const SAMPLE_STATIONS = ["Bhawarkuwa", "navlakha", "GPO", "Palasiya"];

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const [userInput, setUserInput] = useState("");

  const targetStation = SAMPLE_STATIONS[currentIndex];

  const handleInputChange = (e) => {
    const value = e.target.value;

    if (value.length > targetStation.length) return;
    setUserInput(value);
    if (value.trim() == targetStation) {
      if (currentIndex < SAMPLE_STATIONS.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setUserInput("");
      } else {
        alert("Line complete!");
        setUserInput("");
      }
    }
  };
  const renderStyledStationName = () => {
    return targetStation.split("").map((char, index) => {
      let colorClass = "text-slate-500"; // Default (untyped letter)
      let bgClass = "transparent";

      if (index < userInput.length) {
        if (userInput[index] === char) {
          colorClass = "text-emerald-400"; // Correct letter (Green)
        } else {
          colorClass = "text-rose-500 underline decoration-2"; // Wrong letter (Red)
          bgClass = "rgba(244, 63, 94, 0.2)";
        }
      }

      return (
        <span
          key={index}
          style={{
            color: colorClass.includes("emerald")
              ? "#34d399"
              : colorClass.includes("rose")
                ? "#f43f5e"
                : "#64748b",
            backgroundColor: bgClass,
            padding: "0 2px",
            borderRadius: "3px",
            textDecoration: colorClass.includes("underline")
              ? "underline"
              : "none",
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
      {/* Dark Mode Terminal Container */}
      <div
        style={{
          backgroundColor: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "16px",
          padding: "3rem",
          maxWidth: "600px",
          width: "100%",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
          textAlign: "center",
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

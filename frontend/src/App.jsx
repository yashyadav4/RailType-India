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

  return (
    <div
      style={{ padding: "2rem", fontFamily: "sans-serif", textAlign: "center" }}
    >
      <h1>🚂 India Rail Typing (Prototype)</h1>

      <div style={{ margin: "2rem 0" }}>
        <p style={{ color: "#666" }}>Next Station:</p>
        <h2 style={{ fontSize: "2.5rem", color: "#2563eb" }}>
          {targetStation}
        </h2>
      </div>

      <input
        type="text"
        value={userInput}
        onChange={handleInputChange}
        placeholder="type the station name here"
        style={{
          padding: "0.8rem 1.2rem",
          fontSize: "1.2rem",
          width: "300px",
          borderRadius: "8px",
          border: "2px solid #ccc",
        }}
        autoFocus
      />
      <p style={{ marginTop: "1.5rem", color: "#888" }}>
        Station {currentIndex + 1} of {SAMPLE_STATIONS.length}
      </p>
    </div>
  );
}

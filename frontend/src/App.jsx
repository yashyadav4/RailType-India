import { BrowserRouter, Routes, Route } from "react-router-dom";

// We will build these components out next
import HomePage from "./components/HomePage";
import LineInfo from "./components/LineInfo";
import GameView from "./components/GameView";
import SummaryPage from "./components/SummaryPage";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* 2. Line Info Page (e.g., /delhi/yellow_line) */}
        <Route path="/:cityId/:lineId" element={<LineInfo />} />
        {/* 3. The Active Game (e.g., /delhi/yellow_line/play) */}
        <Route path="/:cityId/:lineId/play" element={<GameView />} />
        {/* 4. Post-Game Summary & Leaderboard (e.g., /delhi/yellow_line/summary) */}
        <Route path="/:cityId/:lineId/summary" element={<SummaryPage />} />
      </Routes>
    </BrowserRouter>
  );
}

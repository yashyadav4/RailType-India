import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import HomePage from "./components/HomePage";
import LineInfo from "./components/LineInfo";
import GameView from "./components/GameView";
import SummaryPage from "./components/SummaryPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* THIS IS THE FIX: AppLayout wraps all the other routes */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/:cityId/:lineId" element={<LineInfo />} />
          <Route path="/:cityId/:lineId/play" element={<GameView />} />
          <Route path="/:cityId/:lineId/summary" element={<SummaryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

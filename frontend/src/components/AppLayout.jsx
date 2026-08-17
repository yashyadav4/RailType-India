import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";

export default function AppLayout() {
  const location = useLocation();

  // We check if the user is playing the game.
  // If they are, we remove the padding so the map can be full-screen!
  const isPlaying = location.pathname.endsWith("/play");

  return (
    <div style={{ backgroundColor: "#0b0f19", minHeight: "100vh" }}>
      <Navbar />

      {/* This div automatically pushes your page content down below the frosted glass */}
      <div style={{ paddingTop: isPlaying ? "0" : "100px" }}>
        {/* <Outlet /> is a placeholder. React Router swaps this out for HomePage, SummaryPage, etc. */}
        <Outlet />
      </div>
    </div>
  );
}

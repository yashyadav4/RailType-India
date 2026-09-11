import { STAMP_CATALOG } from "./stampCatalog.js";

// Evaluates a single run against the user's history and returns an array of newly earned stamp IDs
export const evaluateStamps = (user, runData, currentRank, routeLength) => {
  const earnedStamps = new Set(user.stamps || []);
  const newStamps = [];

  const addStamp = (id) => {
    if (!earnedStamps.has(id)) {
      newStamps.push(id);
      earnedStamps.add(id);
    }
  };

  const { timeMs, accuracy, cpm, mistakes, clientHour } = runData;
  const { totalRuns = 0, perfectRuns = 0, currentStreak = 0 } = user;
  
  // Use client's local hour if provided, or fallback to server hour
  const hours = (typeof clientHour === "number" && clientHour >= 0 && clientHour <= 23)
    ? clientHour
    : new Date().getHours();

  // ── 1. DEDICATION ──
  
  if (totalRuns >= 1) addStamp("first_ride");
  if (totalRuns >= 10) addStamp("commuter_pass");
  if (totalRuns >= 50) addStamp("veteran_passenger");
  if (currentStreak >= 3) addStamp("daily_commuter");
  
  // Night Owl: 12:00 AM (0) to 4:59 AM (4)
  if (hours >= 0 && hours < 5) addStamp("night_owl");
  
  // First Departure: 5:00 AM (5) to 7:59 AM (7)
  if (hours >= 5 && hours < 8) addStamp("first_departure");

  // ── 2. ACCURACY ──

  if (mistakes === 0) {
    addStamp("flawless_ride");
    if (perfectRuns >= 10) addStamp("perfect_10");
    if (perfectRuns >= 50) addStamp("untouchable");
    if (routeLength >= 30) addStamp("master_conductor");
  }
  
  if (accuracy >= 99) {
    addStamp("sharpshooter");
  }

  // ── 3. SPEED ──

  if (cpm >= 400) addStamp("super_express");
  if (cpm >= 500) addStamp("shinkansen");
  if (currentRank === 1) addStamp("line_record");

  return newStamps;
};

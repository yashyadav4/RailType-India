const STORAGE_KEY = "railtype-guest-runs";
const MAX_GUEST_RUNS = 50;

/**
 * Save a guest (unauthenticated) run to localStorage.
 * Capped at 50 runs to prevent bloating.
 */
export function saveGuestRun(runData) {
  try {
    const runs = getGuestRuns();
    runs.push({
      ...runData,
      playedAt: new Date().toISOString(),
    });

    // Cap at MAX_GUEST_RUNS — keep the most recent
    const capped = runs.slice(-MAX_GUEST_RUNS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
  } catch (error) {
    console.error("Failed to save guest run:", error);
  }
}

/**
 * Get all stored guest runs from localStorage.
 */
export function getGuestRuns() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Clear guest runs from localStorage (called after syncing to backend).
 */
export function clearGuestRuns() {
  localStorage.removeItem(STORAGE_KEY);
}

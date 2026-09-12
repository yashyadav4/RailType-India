const STORAGE_KEY = "railtype-pending-runs";
const MAX_PENDING_RUNS = 50;

/**
 * Save an authenticated run to localStorage when network fails or client is offline.
 * Capped at 50 runs to prevent storage bloating.
 */
export function savePendingRun(runData) {
  try {
    const runs = getPendingRuns();
    // Avoid duplicate if same runId exists
    const exists = runData.runId && runs.some((r) => r.runId === runData.runId);
    if (!exists) {
      runs.push({
        ...runData,
        savedLocallyAt: new Date().toISOString(),
      });
      const capped = runs.slice(-MAX_PENDING_RUNS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
    }
  } catch (error) {
    console.error("Failed to save pending run locally:", error);
  }
}

/**
 * Get all pending runs from localStorage.
 */
export function getPendingRuns() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Remove a single pending run by runId.
 */
export function removePendingRun(runId) {
  try {
    if (!runId) return;
    const runs = getPendingRuns().filter((r) => r.runId !== runId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
  } catch (error) {
    console.error("Failed to remove pending run:", error);
  }
}

/**
 * Clear all pending runs from localStorage.
 */
export function clearPendingRuns() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear pending runs:", error);
  }
}

/**
 * Sync all pending runs stored in localStorage to the backend.
 */
export async function syncPendingRuns(authToken, onUserUpdate) {
  const pendingRuns = getPendingRuns();
  if (!pendingRuns.length || !authToken) return { success: true, count: 0 };

  try {
    const res = await fetch("/api/runs/bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ runs: pendingRuns }),
    });

    if (res.ok) {
      const bulkData = await res.json();
      clearPendingRuns();
      if (onUserUpdate && bulkData.updatedBests) {
        onUserUpdate(bulkData);
      }
      console.log(`Synced ${pendingRuns.length} offline pending runs to account`);
      return { success: true, count: pendingRuns.length };
    }
  } catch (err) {
    console.error("Failed to sync pending runs:", err);
  }
  return { success: false };
}

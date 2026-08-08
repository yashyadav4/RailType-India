// Catalog of available lines for the level selection UI
export const CITY_CATALOG = {
  delhi: {
    cityName: "Delhi NCR",
    systemName: "Delhi Metro",
    lines: [
      { id: "yellow_line", name: "Yellow Line", color: "#facc15" },
      { id: "blue_line", name: "Blue Line", color: "#2563eb" },
      { id: "blue_line_branch", name: "Blue Line Branch", color: "#3b82f6" },
      {
        id: "orange_line",
        name: "Orange Line (Airport Express)",
        color: "#f97316",
      },
      { id: "pink_line", name: "Pink Line", color: "#ec4899" },
      { id: "red_line", name: "Red Line", color: "#ef4444" },
      { id: "magenta_line", name: "Magenta Line", color: "#d946ef" },
      { id: "green_line", name: "Green Line", color: "#22c55e" },
      { id: "voilet_line", name: "Violet Line", color: "#8b5cf6" },
    ],
  },
};

/**
 * Dynamically imports only the requested line's JSON file.
 */
export async function loadRouteData(cityName = "delhi", lineId = "aqua_line") {
  try {
    const routeModule = await import(`./${cityName}/${lineId}.json`);
    return routeModule.default;
  } catch (error) {
    console.error(`Failed to load route: ${cityName}/${lineId}`, error);
    return null;
  }
}

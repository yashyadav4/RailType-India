// Catalog of available lines for the level selection UI
export const CITY_CATALOG = {
  delhi: {
    id: "delhi",
    name: "Delhi NCR",
    operator: "DMRC · NMRC · Rapid Metro",
    lines: [
      {
        id: "yellow_line",
        name: "Yellow Line",
        code: "YL",
        color: "#facc15",
        stations: 37,
        type: "Line",
        terminals: "Samaypur Badli ↔ Huda City Centre",
      },
      {
        id: "blue_line",
        name: "Blue Line",
        code: "BL",
        color: "#2563eb",
        stations: 32,
        type: "Line",
        terminals: "Dwarka ↔ Noida City Center",
      },
      {
        id: "blue_line_branch",
        name: "Blue Line Branch",
        code: "BLB",
        color: "#3b82f6",
        stations: 8,
        type: "Branch",
        terminals: "Yamuna Bank ↔ Vaishali",
      },
      {
        id: "orange_line",
        name: "Airport Express",
        code: "OL",
        color: "#f97316",
        stations: 6,
        type: "Express",
        terminals: "New Delhi-Airport Express ↔ Dwarka Sector 21",
      },
      {
        id: "pink_line",
        name: "Pink Line",
        code: "PL",
        color: "#ec4899",
        stations: 36,
        type: "Ring",
        terminals: "Majlis Park ↔ Johri Enclave",
      },
      {
        id: "red_line",
        name: "Red Line",
        code: "RL",
        color: "#ef4444",
        stations: 29,
        type: "Line",
        terminals: "Shaheed Sthal ↔ Rithala",
      },
      {
        id: "magenta_line",
        name: "Magenta Line",
        code: "ML",
        color: "#d946ef",
        stations: 25,
        type: "Line",
        terminals: "Janak Puri West ↔ Botanical Garden",
      },
      {
        id: "green_line",
        name: "Green Line",
        code: "GL",
        color: "#22c55e",
        stations: 21,
        type: "Line",
        terminals: "Inderlok Conn:Red ↔ Brigadier Hoshiar Singh",
      },
      {
        id: "voilet_line",
        name: "Violet Line",
        code: "VL",
        color: "#8b5cf6",
        stations: 33,
        type: "Line",
        terminals: "Kashmere Gate ↔ Raja Nahar Singh",
      },
    ],
  },
  mumbai: {
    id: "mumbai",
    name: "Mumbai",
    lines: [
      {
        id: "line_1",
        name: "Blue Line 1",
        color: "#3b82f6",
        stations: 12,
        terminals: "Versova ↔ Ghatkopar",
        startTerminal: "Versova",
        type: "Metro",
      },
      {
        id: "line_2a",
        name: "Yellow Line 2A",
        color: "#facc15",
        stations: 17,
        terminals: "Dahisar East ↔ Andheri West",
        startTerminal: "Dahisar East",
        type: "Metro",
      },
      {
        id: "line_7",
        name: "Red Line 7",
        color: "#ef4444",
        stations: 14,
        terminals: "Dahisar East ↔ Gundavali",
        startTerminal: "Dahisar East",
        type: "Metro",
      },
      {
        id: "western_local",
        name: "Western Line",
        color: "#9333ea",
        stations: 21,
        terminals: "Churchgate ↔ Borivali",
        startTerminal: "Churchgate",
        type: "Suburban",
      },
      {
        id: "monorail",
        name: "Monorail",
        color: "#ec4899",
        stations: 17,
        terminals: "Chembur ↔ Jacob Circle",
        startTerminal: "Chembur",
        type: "Monorail",
      },
    ],
  },
  bengaluru: {
    id: "bengaluru",
    name: "Namma Metro",
    lines: [
      {
        id: "purple_line",
        name: "Purple Line",
        color: "#a855f7",
        stations: 37,
        terminals: "Challaghatta ↔ Whitefield",
        startTerminal: "Challaghatta",
        type: "Metro",
      },
      {
        id: "green_line",
        name: "Green Line",
        color: "#22c55e",
        stations: 29,
        terminals: "Nagasandra ↔ Silk Institute",
        startTerminal: "Nagasandra",
        type: "Metro",
      },
      {
        id: "yellow_line",
        name: "Yellow Line",
        color: "#facc15",
        stations: 16,
        terminals: "RV Road ↔ Bommasandra",
        startTerminal: "RV Road",
        type: "Metro",
      },
    ],
  },
  kolkata: {
    id: "kolkata",
    name: "Kolkata",
    operator: "KMRC · India's First Metro",
    lines: [
      {
        id: "blue_line",
        name: "Blue Line",
        color: "#3b82f6",
        stations: 26,
        terminals: "Dakshineswar ↔ Kavi Subhash",
        startTerminal: "Dakshineswar",
        type: "Metro",
      },
      {
        id: "green_line",
        name: "Green Line",
        color: "#22c55e",
        stations: 12,
        terminals: "Howrah Maidan ↔ Salt Lake Sector V",
        startTerminal: "Howrah Maidan",
        type: "Metro",
      },
      {
        id: "purple_line",
        name: "Purple Line",
        color: "#a855f7",
        stations: 12,
        terminals: "Joka ↔ Esplanade",
        startTerminal: "Joka",
        type: "Metro",
      },
      {
        id: "yellow_line",
        name: "Yellow Line",
        color: "#facc15",
        stations: 10,
        terminals: "Noapara ↔ Barasat",
        startTerminal: "Noapara",
        type: "Metro",
      },
      {
        id: "orange_line",
        name: "Orange Line",
        color: "#f97316", // Using Orange for Line 6 (or you can swap to Cyan: #06b6d4)
        stations: 12,
        terminals: "Kavi Subhash ↔ Salt Lake Sector V",
        startTerminal: "Kavi Subhash",
        type: "Metro",
      },
    ],
  },
};

export function getAllRoutes() {
  return Object.values(CITY_CATALOG).flatMap((city) =>
    city.lines.map((line) => ({
      ...line,
      cityId: city.id,
      cityName: city.name,
    })),
  );
}

export async function loadRouteData(cityName = "delhi", lineId = "red_line") {
  try {
    const routeModule = await import(`./${cityName}/${lineId}.json`);
    return routeModule.default;
  } catch (error) {
    console.error(`Failed to load route: ${cityName}/${lineId}`, error);
    return null;
  }
}

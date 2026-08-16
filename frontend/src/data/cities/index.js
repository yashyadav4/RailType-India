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
    operator: "MMRDA · Mumbai Metro",
    lines: [
      {
        id: "mumbai_line1",
        name: "Line 1 (Blue)",
        code: "M1",
        color: "#a855f7",
        stations: 12,
        type: "Line",
        terminals: "Versova ↔ Ghatkopar",
      },
      {
        id: "mumbai_line2a",
        name: "Line 2A (Yellow)",
        code: "M2",
        color: "#eab308",
        stations: 17,
        type: "Line",
        terminals: "Dahisar E ↔ DN Nagar",
      },
      {
        id: "mumbai_line7",
        name: "Line 7 (Red)",
        code: "M7",
        color: "#f43f5e",
        stations: 14,
        type: "Line",
        terminals: "Dahisar E ↔ Gundavali",
      },
    ],
  },
  bengaluru: {
    id: "bengaluru",
    name: "Bengaluru",
    operator: "BMRCL · Namma Metro",
    lines: [
      {
        id: "blr_purple",
        name: "Purple Line",
        code: "BP",
        color: "#9333ea",
        stations: 37,
        type: "Line",
        terminals: "Challaghatta ↔ Whitefield",
      },
      {
        id: "blr_green",
        name: "Green Line",
        code: "BG",
        color: "#16a34a",
        stations: 32,
        type: "Line",
        terminals: "Silk Institute ↔ Nagasandra",
      },
    ],
  },
  kolkata: {
    id: "kolkata",
    name: "Kolkata",
    operator: "KMRC · India's First Metro",
    lines: [
      {
        id: "kol_line1",
        name: "Blue Line (Line 1)",
        code: "K1",
        color: "#0284c7",
        stations: 26,
        type: "Line",
        terminals: "Dakshineswar ↔ Kavi Subhash",
      },
      {
        id: "kol_line2",
        name: "Green Line (Underwater)",
        code: "K2",
        color: "#10b981",
        stations: 12,
        type: "Line",
        terminals: "Howrah Maidan ↔ Salt Lake Sec V",
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

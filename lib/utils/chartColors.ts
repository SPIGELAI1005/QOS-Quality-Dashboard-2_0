/**
 * Chart color utilities
 * Maps plant colors to chart-compatible hex/rgb values
 * and provides color palettes for different chart types
 */

// Plant color mapping - matches filter-panel.tsx
// Converted from Tailwind classes to hex values for charts
export const PLANT_COLORS_HEX: Record<string, string> = {
  "101": "#06b6d4", // cyan-500
  "106": "#22d3ee", // cyan-400
  "111": "#6366f1", // indigo-500
  "131": "#14b8a6", // teal-500
  "135": "#10b981", // emerald-500
  "145": "#22c55e", // green-500
  "155": "#84cc16", // lime-500
  "167": "#eab308", // yellow-500
  "175": "#3b82f6", // blue-500
  "180": "#0ea5e9", // sky-500
  "195": "#06b6d4", // cyan-500
  "200": "#8b5cf6", // violet-500
  "205": "#a855f7", // purple-500
  "211": "#d946ef", // fuchsia-500
  "215": "#ec4899", // pink-500
  "230": "#f43f5e", // rose-500
  "235": "#f97316", // orange-500
  "410": "#ef4444", // red-500
  "411": "#a855f7", // purple-500
  "705": "#f59e0b", // amber-500
  "752": "#78716c", // stone-500
  "770": "#64748b", // slate-500
};

// Fallback color for plants not in mapping
const FALLBACK_COLOR = "#6b7280"; // gray-500

/**
 * Get hex color for a plant code
 */
export function getPlantColorHex(plantCode: string): string {
  return PLANT_COLORS_HEX[plantCode] || FALLBACK_COLOR;
}

/**
 * Get color for a plant by index (for charts with multiple plants)
 */
export function getPlantColorByIndex(plantCode: string, index: number, allPlantCodes: string[]): string {
  // First try to get the specific plant color
  if (PLANT_COLORS_HEX[plantCode]) {
    return PLANT_COLORS_HEX[plantCode];
  }
  
  // Fallback to a generated color palette
  return generateColorPalette(allPlantCodes.length)[index % allPlantCodes.length];
}

/**
 * Generate a color palette for charts
 * Uses plant colors when available, otherwise generates harmonious colors
 */
export function generateColorPalette(count: number, plantCodes?: string[]): string[] {
  if (plantCodes && plantCodes.length > 0) {
    return plantCodes.map(code => getPlantColorHex(code));
  }
  
  // Default harmonious palette if no plant codes provided
  const defaultPalette = [
    "#06b6d4", // cyan-500
    "#6366f1", // indigo-500
    "#14b8a6", // teal-500
    "#10b981", // emerald-500
    "#22c55e", // green-500
    "#84cc16", // lime-500
    "#eab308", // yellow-500
    "#3b82f6", // blue-500
    "#0ea5e9", // sky-500
    "#8b5cf6", // violet-500
    "#a855f7", // purple-500
    "#d946ef", // fuchsia-500
    "#ec4899", // pink-500
    "#f43f5e", // rose-500
    "#f97316", // orange-500
    "#ef4444", // red-500
    "#f59e0b", // amber-500
    "#78716c", // stone-500
    "#64748b", // slate-500
  ];
  
  // Repeat palette if needed
  return Array.from({ length: count }, (_, i) => defaultPalette[i % defaultPalette.length]);
}

/**
 * Notification type colors (Q1, Q2, Q3, D, P)
 */
export const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  Q1: "#06b6d4", // cyan-500 - Customer
  Q2: "#14b8a6", // teal-500 - Supplier
  Q3: "#3b82f6", // blue-500 - Internal
  D: "#f59e0b",  // amber-500 - Deviations
  P: "#d946ef",  // fuchsia-500 - PPAP
  D1: "#f59e0b", // amber-500
  D2: "#f97316", // orange-500
  D3: "#ef4444", // red-500
  P1: "#d946ef", // fuchsia-500
  P2: "#ec4899", // pink-500
  P3: "#f43f5e", // rose-500
};

/**
 * Get color for notification type
 */
export function getNotificationTypeColor(type: string): string {
  return NOTIFICATION_TYPE_COLORS[type] || "#6b7280"; // gray-500 fallback
}

/**
 * Chart animation configuration - builds from left to right
 */
export const CHART_ANIMATION = {
  isAnimationActive: true,
  animationBegin: 0,
  animationDuration: 1200,
  animationEasing: "ease-out" as const,
};

/**
 * Bar chart animation - builds from left to right with smooth progression
 */
export function getBarAnimation(index: number, baseDelay: number = 0) {
  return {
    isAnimationActive: true,
    animationBegin: baseDelay + (index * 80), // Staggered by 80ms for smooth left-to-right build
    animationDuration: 1000,
    animationEasing: "ease-out" as const,
  };
}

/**
 * Line chart animation - draws from left to right
 */
export function getLineAnimation(index: number, baseDelay: number = 0) {
  return {
    isAnimationActive: true,
    animationBegin: baseDelay + (index * 150),
    animationDuration: 1200,
    animationEasing: "ease-out" as const,
  };
}

/**
 * Pie chart animation - clockwise rotation
 */
export const PIE_ANIMATION = {
  isAnimationActive: true,
  animationBegin: 0,
  animationDuration: 1500,
  animationEasing: "ease-out" as const,
  // Recharts Pie component supports startAngle and endAngle for clockwise animation
  startAngle: 90, // Start from top
  endAngle: -270, // Complete circle clockwise
};

/**
 * Staggered animation for multiple bars/lines (backward compatibility)
 */
export function getStaggeredAnimation(index: number, baseDelay: number = 0) {
  return getBarAnimation(index, baseDelay);
}


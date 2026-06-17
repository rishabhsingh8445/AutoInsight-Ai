/** Brand palette — matches :root --a / --b / --c in styles.css */
export const ACCENT = "#8cffe6";
export const ACCENT_BLUE = "#7da5ff";
export const ACCENT_PINK = "#ffaaf0";

export const CHART_COLORS = [
  ACCENT,
  ACCENT_BLUE,
  ACCENT_PINK,
  "rgba(140, 255, 230, 0.75)",
  "rgba(125, 165, 255, 0.75)",
  "rgba(255, 170, 240, 0.75)",
];

/** Semantic scale for tables / heatmaps (theme-aligned) */
export const SCALE_HIGH = ACCENT;
export const SCALE_MID = ACCENT_BLUE;
export const SCALE_LOW = ACCENT_PINK;

export const tooltipStyle = {
  background: "rgba(8, 8, 14, 0.96)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "#ededed",
  fontSize: 12,
  fontFamily: "'JetBrains Mono', monospace",
  boxShadow: "0 12px 40px -12px rgba(0,0,0,0.8)",
} as const;

export const tooltipItemStyle = { color: ACCENT };

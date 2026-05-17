import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useRef } from "react";
import { useDataStore } from "@/store/dataStore";
import {
  PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart,
  BarChart, Bar,
} from "recharts";
import {
  ACCENT, ACCENT_BLUE, ACCENT_PINK, CHART_COLORS,
  tooltipStyle, tooltipItemStyle,
} from "@/lib/theme";
import { Download, TrendingUp, Hash, BarChart2, Upload, Table2, ChevronRight, X, Bookmark, BookmarkCheck, Trash2, ImageDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL_FILTER_VALUE = "__all__";

const analyticsSelectTrigger =
  "h-auto w-full rounded-lg border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white shadow-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 [&>svg]:text-muted-foreground";
const analyticsSelectContent =
  "z-[100] max-h-60 rounded-lg border-white/10 bg-[#12121a] text-white shadow-lg";
const analyticsSelectItem =
  "text-xs rounded-md py-2 pl-2 pr-8 cursor-pointer focus:bg-primary/15 focus:text-white data-[highlighted]:bg-primary/15 data-[highlighted]:text-white";

function AnalyticsSelect({
  value,
  onValueChange,
  options,
  placeholder,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={analyticsSelectTrigger}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={analyticsSelectContent} position="popper">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className={analyticsSelectItem}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
});

type ChartType = "line" | "bar" | "pie" | "scatter";

interface DrillState {
  col: string;
  value: string;
}

interface BookmarkSnapshot {
  id: string;
  name: string;
  createdAt: string;
  filters: Record<string, string>;
  chartType: ChartType;
  xCol: string;
  yCol: string;
  drillStack: DrillState[];
}

const BOOKMARKS_KEY = "autoinsight_bookmarks";

function loadBookmarks(): BookmarkSnapshot[] {
  try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? "[]"); }
  catch { return []; }
}
function saveBookmarks(bms: BookmarkSnapshot[]) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bms));
}

function getNumericColumns(columns: string[], rows: Record<string, unknown>[]) {
  // Sample up to 100 rows spread across the full dataset for accurate detection
  const step = Math.max(1, Math.floor(rows.length / 100));
  const sample = rows.filter((_, i) => i % step === 0);
  return columns.filter(col => {
    const vals = sample.map(r => r[col]);
    const numCount = vals.filter(v => v !== null && v !== "" && !isNaN(Number(v))).length;
    return numCount > vals.length * 0.7;
  });
}

function getCategoricalColumns(columns: string[], rows: Record<string, unknown>[]) {
  // Sample up to 200 rows to get a representative unique-value count
  const step = Math.max(1, Math.floor(rows.length / 200));
  const sample = rows.filter((_, i) => i % step === 0);
  return columns.filter(col => {
    const vals = sample.map(r => r[col]);
    const unique = new Set(vals.map(v => String(v ?? ""))).size;
    // Exclude columns that look numeric
    const numCount = vals.filter(v => v !== null && v !== "" && !isNaN(Number(v))).length;
    if (numCount > vals.length * 0.7) return false;
    return unique <= 30 && unique > 1;
  });
}

function buildChartTitle(
  chartType: ChartType, activeX: string, activeY: string,
  filters: Record<string, string>, drillStack: DrillState[]
): { title: string; subtitle: string } {
  const activeFilters = Object.entries(filters).filter(([, v]) => Boolean(v));
  let title = "";
  if (chartType === "scatter") title = `${activeX} vs ${activeY}`;
  else if (chartType === "pie") title = `${activeX} Distribution`;
  else if (chartType === "bar") title = activeY ? `${activeY} by ${activeX}` : `${activeX} Breakdown`;
  else title = `${activeX} Trend`;
  if (drillStack.length > 0) {
    return { title, subtitle: `Drill: ${drillStack.map(d => `${d.col} = ${d.value}`).join(" â†’ ")}` };
  }
  let subtitle = "All data";
  if (activeFilters.length === 1) subtitle = `Filtered by ${activeFilters[0][0]} = ${activeFilters[0][1]}`;
  else if (activeFilters.length > 1) subtitle = `${activeFilters.length} filters active: ${activeFilters.map(([k, v]) => `${k}=${v}`).join(", ")}`;
  return { title, subtitle };
}

// Standard chart PNG download (SVG-based)
const downloadChart = (id: string, name: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  const svgs = el.querySelectorAll("svg");
  let svg: SVGElement | null = null;
  let maxArea = 0;
  svgs.forEach(s => {
    const area = s.clientWidth * s.clientHeight;
    if (area > maxArea) { maxArea = area; svg = s as SVGElement; }
  });
  if (!svg) return;
  const w = (svg as SVGElement).clientWidth || 800;
  const h = (svg as SVGElement).clientHeight || 350;
  const cloned = (svg as SVGElement).cloneNode(true) as SVGElement;
  cloned.setAttribute("width", String(w));
  cloned.setAttribute("height", String(h));
  cloned.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("width", "100%"); bg.setAttribute("height", "100%"); bg.setAttribute("fill", "#000000");
  cloned.insertBefore(bg, cloned.firstChild);
  const blob = new Blob([new XMLSerializer().serializeToString(cloned)], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const img = new Image();
  img.onload = () => {
    ctx.fillStyle = "#000000"; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const a = document.createElement("a"); a.download = `${name}.png`; a.href = canvas.toDataURL("image/png"); a.click();
    URL.revokeObjectURL(url);
  };
  img.src = url;
};

// HIGH QUALITY snapshot â€” draws chart SVG + metadata onto a branded canvas at 2x scale
const downloadSnapshotImage = (
  snapshotName: string,
  chartTitle: string,
  chartSubtitle: string,
  chartType: ChartType,
  filters: Record<string, string>,
  drillStack: DrillState[],
  kpis: { total: number; sum: string; avg: string; min: number; max: number; col: string } | null,
  chartData: { name?: string; value?: number; x?: number; y?: number }[]
) => {
  const SCALE = 2;
  const W = 1200;
  const H = 800;
  const cW = W * SCALE;
  const cH = H * SCALE;

  const canvas = document.createElement("canvas");
  canvas.width = cW;
  canvas.height = cH;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "#000000");
  bgGrad.addColorStop(1, "#ffffff");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Top accent bar
  const accentGrad = ctx.createLinearGradient(0, 0, W, 0);
  accentGrad.addColorStop(0, ACCENT);
  accentGrad.addColorStop(0.5, ACCENT_BLUE);
  accentGrad.addColorStop(1, ACCENT_PINK);
  ctx.fillStyle = accentGrad;
  ctx.fillRect(0, 0, W, 4);

  // Logo / app name
  ctx.fillStyle = ACCENT;
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.fillText("âœ¦ AutoInsight AI", 32, 32);

  // Timestamp top right
  ctx.fillStyle = "rgba(148,163,184,0.6)";
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(new Date().toLocaleString(), W - 32, 32);
  ctx.textAlign = "left";

  // Snapshot name
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px system-ui, sans-serif";
  ctx.fillText(snapshotName, 32, 70);

  // Chart title + subtitle
  ctx.fillStyle = "rgba(148,163,184,0.9)";
  ctx.font = "14px system-ui, sans-serif";
  ctx.fillText(`${chartTitle}  Â·  ${chartSubtitle}`, 32, 92);

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(32, 106); ctx.lineTo(W - 32, 106); ctx.stroke();

  // KPI Cards row
  if (kpis) {
    const kpiItems = [
      { label: "Rows", value: kpis.total.toLocaleString(), color: ACCENT },
      { label: `Sum (${kpis.col})`, value: Number(kpis.sum).toLocaleString(), color: ACCENT_BLUE },
      { label: "Average", value: kpis.avg, color: ACCENT },
      { label: "Min", value: String(kpis.min), color: ACCENT_PINK },
      { label: "Max", value: String(kpis.max), color: ACCENT_BLUE },
    ];
    const cardW = (W - 64 - 16 * 4) / 5;
    kpiItems.forEach((k, i) => {
      const cx = 32 + i * (cardW + 16);
      const cy = 118;
      // Card bg
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      roundRect(ctx, cx, cy, cardW, 60, 8);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      roundRect(ctx, cx, cy, cardW, 60, 8);
      ctx.stroke();
      // Label
      ctx.fillStyle = "rgba(148,163,184,0.7)";
      ctx.font = "9px system-ui, sans-serif";
      ctx.fillText(k.label.toUpperCase(), cx + 10, cy + 18);
      // Value
      ctx.fillStyle = k.color;
      ctx.font = "bold 18px system-ui, sans-serif";
      ctx.fillText(k.value, cx + 10, cy + 44);
    });
  }

  // Active filters display
  const activeFilters = Object.entries(filters).filter(([, v]) => Boolean(v));
  const drillPath = drillStack.map(d => `${d.col}=${d.value}`).join(" â†’ ");
  const filterStr = [
    ...activeFilters.map(([k, v]) => `${k}: ${v}`),
    ...(drillPath ? [`Drill: ${drillPath}`] : [])
  ].join("  |  ");
  if (filterStr) {
    ctx.fillStyle = "rgba(140, 255, 230, 0.12)";
    roundRect(ctx, 32, 194, W - 64, 24, 6);
    ctx.fill();
    ctx.fillStyle = ACCENT;
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText("âš¡ " + filterStr, 42, 210);
  }

  // Chart area â€” get SVG from DOM and draw it
  const chartAreaY = filterStr ? 230 : 200;
  const chartAreaH = H - chartAreaY - 60;

  const svgEl = document.getElementById("main-chart")?.querySelector("svg");
  if (svgEl) {
    const cloned = svgEl.cloneNode(true) as SVGElement;
    const svgW = svgEl.clientWidth || 800;
    const svgH = svgEl.clientHeight || 400;
    cloned.setAttribute("width", String(W - 64));
    cloned.setAttribute("height", String(chartAreaH));
    cloned.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("width", "100%"); bg.setAttribute("height", "100%"); bg.setAttribute("fill", "transparent");
    cloned.insertBefore(bg, cloned.firstChild);
    const svgData = new XMLSerializer().serializeToString(cloned);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const chartImg = new Image();
    chartImg.onload = () => {
      // Chart bg card
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      roundRect(ctx, 32, chartAreaY - 8, W - 64, chartAreaH + 16, 12);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      roundRect(ctx, 32, chartAreaY - 8, W - 64, chartAreaH + 16, 12);
      ctx.stroke();

      ctx.drawImage(chartImg, 32, chartAreaY, W - 64, chartAreaH);
      URL.revokeObjectURL(svgUrl);

      drawFooterAndSave(ctx, canvas, W, H, snapshotName, chartType, chartData);
    };
    chartImg.onerror = () => {
      // Fallback: draw chart as text table if SVG fails
      drawChartFallback(ctx, chartData, chartType, 32, chartAreaY, W - 64, chartAreaH);
      drawFooterAndSave(ctx, canvas, W, H, snapshotName, chartType, chartData);
    };
    chartImg.src = svgUrl;
  } else {
    drawChartFallback(ctx, chartData, chartType, 32, chartAreaY, W - 64, chartAreaH);
    drawFooterAndSave(ctx, canvas, W, H, snapshotName, chartType, chartData);
  }

  void svgEl; // suppress unused warning
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawChartFallback(
  ctx: CanvasRenderingContext2D,
  chartData: { name?: string; value?: number; x?: number; y?: number }[],
  chartType: ChartType,
  x: number, y: number, w: number, h: number
) {
  if (chartType === "scatter" || chartType === "pie" || chartData.length === 0) return;
  const maxVal = Math.max(...chartData.map(d => d.value ?? 0));
  const plotH = h - 40;
  const plotW = w - 40;
  const points = chartData.slice(0, 15).map((d, i) => ({
    x: x + 20 + (i / Math.max(chartData.length - 1, 1)) * plotW,
    y: y + plotH - (maxVal > 0 ? ((d.value ?? 0) / maxVal) * plotH : 0),
    label: String(d.name ?? "").slice(0, 8),
  }));
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();
  points.forEach((p, i) => {
    ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length];
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(148,163,184,0.7)";
    ctx.font = "9px system-ui, sans-serif";
    ctx.fillText(p.label, p.x - 12, y + plotH + 14);
  });
}

function drawFooterAndSave(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  W: number, H: number,
  snapshotName: string,
  chartType: ChartType,
  chartData: { name?: string; value?: number }[]
) {
  // Bottom divider
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(32, H - 44); ctx.lineTo(W - 32, H - 44); ctx.stroke();

  // Footer left â€” data summary
  ctx.fillStyle = "rgba(148,163,184,0.5)";
  ctx.font = "10px system-ui, sans-serif";
  const summary = chartType !== "scatter"
    ? `${chartData.length} categories  Â·  Chart: ${chartType}`
    : `${chartData.length} data points  Â·  Chart: scatter`;
  ctx.fillText(summary, 32, H - 26);

  // Footer right â€” watermark
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(140, 255, 230, 0.45)";
  ctx.font = "10px system-ui, sans-serif";
  ctx.fillText("Generated by AutoInsight AI", W - 32, H - 26);
  ctx.textAlign = "left";

  // Bottom accent
  const grad = ctx.createLinearGradient(0, H - 3, W, H - 3);
  grad.addColorStop(0, "rgba(140, 255, 230, 0.55)");
  grad.addColorStop(1, "rgba(125, 165, 255, 0.55)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, H - 3, W, 3);

  // Export
  const link = document.createElement("a");
  link.download = `${snapshotName.replace(/\s+/g, "_")}_snapshot.png`;
  link.href = canvas.toDataURL("image/png", 1.0);
  link.click();
}

function AnalyticsPage() {
  const { columns, rows } = useDataStore();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [chartType, setChartType] = useState<ChartType>("line");
  const [xCol, setXCol] = useState<string>("");
  const [yCol, setYCol] = useState<string>("");
  const [showDataTable, setShowDataTable] = useState(false);
  const [drillStack, setDrillStack] = useState<DrillState[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkSnapshot[]>(loadBookmarks);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarkName, setBookmarkName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const numericCols = useMemo(() => getNumericColumns(columns, rows), [columns, rows]);
  const categoricalCols = useMemo(() => getCategoricalColumns(columns, rows), [columns, rows]);

  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      const passesFilters = Object.entries(filters).every(([col, val]) =>
        !val || String(row[col] ?? "").toLowerCase().includes(val.toLowerCase())
      );
      const passesDrill = drillStack.every(({ col, value }) =>
        String(row[col] ?? "") === value
      );
      return passesFilters && passesDrill;
    });
  }, [rows, filters, drillStack]);

  const kpis = useMemo(() => {
    const numCol = numericCols[0];
    if (!numCol) return null;
    const vals = filteredRows.map(r => Number(r[numCol])).filter(v => !isNaN(v));
    if (!vals.length) return null;
    return {
      total: filteredRows.length,
      sum: vals.reduce((a, b) => a + b, 0).toFixed(2),
      avg: (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2),
      min: Math.min(...vals),
      max: Math.max(...vals),
      col: numCol
    };
  }, [filteredRows, numericCols]);

  const activeX = xCol || categoricalCols[0] || columns[0] || "";
  const activeY = yCol || numericCols[0] || columns[1] || "";

  const nextDrillCol = useMemo(() => {
    const usedCols = new Set([activeX, ...drillStack.map(d => d.col)]);
    return categoricalCols.find(c => !usedCols.has(c)) ?? null;
  }, [categoricalCols, activeX, drillStack]);

  const chartData = useMemo(() => {
    if (!activeX) return [];
    if (chartType === "scatter") {
      return filteredRows.slice(0, 200).map(r => ({ x: Number(r[activeX] ?? 0), y: Number(r[activeY] ?? 0) }));
    }
    if (chartType === "pie") {
      const counts: Record<string, number> = {};
      filteredRows.forEach(r => { const v = String(r[activeX] ?? "Unknown"); counts[v] = (counts[v] ?? 0) + 1; });
      return Object.entries(counts).slice(0, 8).map(([name, value]) => ({ name, value }));
    }
    const counts: Record<string, number> = {};
    filteredRows.forEach(r => {
      const key = String(r[activeX] ?? "Unknown");
      counts[key] = (counts[key] ?? 0) + (activeY ? Number(r[activeY] ?? 1) : 1);
    });
    return Object.entries(counts).slice(0, 15).map(([name, value]) => ({ name, value }));
  }, [filteredRows, activeX, activeY, chartType]);

  const { title: chartTitle, subtitle: chartSubtitle } = useMemo(
    () => buildChartTitle(chartType, activeX, activeY, filters, drillStack),
    [chartType, activeX, activeY, filters, drillStack]
  );

  const handleDrillDown = (data: unknown) => {
    if (!nextDrillCol) return;
    const name =
      (data as { activePayload?: { payload?: { name?: string } }[] })?.activePayload?.[0]?.payload?.name
      ?? (data as { name?: string })?.name;
    if (!name) return;
    setDrillStack(prev => [...prev, { col: activeX, value: String(name) }]);
    setXCol(nextDrillCol);
  };

  const handleDrillUp = (index: number) => {
    const newStack = drillStack.slice(0, index);
    setDrillStack(newStack);
    setXCol(index === 0 ? (categoricalCols[0] || columns[0] || "") : (drillStack[index - 1]?.col || categoricalCols[0] || columns[0] || ""));
  };

  const saveBookmark = () => {
    const name = bookmarkName.trim() || `Snapshot ${bookmarks.length + 1}`;
    const bm: BookmarkSnapshot = {
      id: Date.now().toString(), name, createdAt: new Date().toLocaleString(),
      filters: { ...filters }, chartType, xCol: activeX, yCol: activeY, drillStack: [...drillStack],
    };
    const updated = [bm, ...bookmarks];
    setBookmarks(updated); saveBookmarks(updated);
    setBookmarkName(""); setShowNameInput(false);
    setSavedFeedback(true); setTimeout(() => setSavedFeedback(false), 2000);
  };

  const loadBookmark = (bm: BookmarkSnapshot) => {
    setFilters(bm.filters);
    setChartType(bm.chartType);
    setXCol(bm.xCol); setYCol(bm.yCol); setDrillStack(bm.drillStack);
    setShowBookmarks(false);
  };

  const deleteBookmark = (id: string) => {
    const updated = bookmarks.filter(b => b.id !== id);
    setBookmarks(updated); saveBookmarks(updated);
  };

  const handleSnapshotDownload = (bm: BookmarkSnapshot) => {
    setDownloading(true);
    // Small delay so chart is rendered before we grab the SVG
    setTimeout(() => {
      downloadSnapshotImage(
        bm.name, chartTitle, chartSubtitle, bm.chartType,
        bm.filters, bm.drillStack, kpis, chartData
      );
      setDownloading(false);
    }, 100);
  };

  const handleCurrentSnapshotDownload = () => {
    const name = bookmarkName.trim() || `Snapshot_${Date.now()}`;
    setDownloading(true);
    setTimeout(() => {
      downloadSnapshotImage(
        name, chartTitle, chartSubtitle, chartType,
        filters, drillStack, kpis, chartData
      );
      setDownloading(false);
    }, 100);
  };

  const canDrillDown = chartType === "pie" && nextDrillCol !== null;

  if (!columns.length) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center page-enter page-enter-stagger-1">
        <div className="glass-card p-12">
          <h2 className="text-2xl font-bold text-foreground">No data yet</h2>
          <p className="mt-2 text-muted-foreground">Upload a file to see analytics.</p>
          <Link to="/upload" className="btn-primary mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white">
            <Upload className="h-4 w-4" /> Upload data
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="about page">
      <div className="flex items-center justify-between mb-6 page-enter page-enter-stagger-1">
        <div className="page__hero about__hero" style={{ flex: "1 1 auto" }}>
          <div className="about__badge"><span>Explore</span></div>
          <h1 className="about__title">Data <span className="about__titleAccent">analytics</span></h1>
          <p className="about__lead">Interactive data exploration</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Download current view as high-res snapshot */}
          <button
            onClick={handleCurrentSnapshotDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-white/5 transition-all disabled:opacity-50"
          >
            <ImageDown className="h-3 w-3" />
            {downloading ? "Exporting..." : "Export HD"}
          </button>

          {showNameInput ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={bookmarkName}
                onChange={e => setBookmarkName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveBookmark(); if (e.key === "Escape") setShowNameInput(false); }}
                placeholder="Snapshot name..."
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white outline-none focus:border-primary/50 w-40"
              />
              <button onClick={saveBookmark} className="gradient-bg rounded-lg px-3 py-1.5 text-xs font-medium text-white">Save</button>
              <button onClick={() => setShowNameInput(false)} className="text-xs text-muted-foreground hover:text-white">Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => setShowNameInput(true)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${savedFeedback ? "border-primary/50 bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:bg-white/5"}`}
            >
              {savedFeedback ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
              {savedFeedback ? "Saved!" : "Save Snapshot"}
            </button>
          )}
          <button
            onClick={() => setShowBookmarks(v => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${showBookmarks ? "border-primary/50 bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:bg-white/5"}`}
          >
            <BookmarkCheck className="h-3 w-3" />
            Snapshots {bookmarks.length > 0 && `(${bookmarks.length})`}
          </button>
        </div>
      </div>

      {/* Bookmarks Panel */}
      {showBookmarks && (
        <div className="glass-card p-4 mb-6">
          <h3 className="text-sm font-semibold mb-3">Saved Snapshots</h3>
          {bookmarks.length === 0 ? (
            <p className="text-xs text-muted-foreground">No snapshots saved yet.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {bookmarks.map(bm => (
                <div key={bm.id} className="flex items-start justify-between rounded-lg border border-white/10 bg-white/[0.04]/5 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{bm.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{bm.createdAt}</div>
                    <div className="text-[10px] text-primary mt-1">
                      {bm.chartType} Â· {bm.xCol}
                      {Object.values(bm.filters).filter(Boolean).length > 0 && ` Â· ${Object.values(bm.filters).filter(Boolean).length} filter(s)`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <button onClick={() => loadBookmark(bm)} className="rounded bg-primary/15 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/25">
                      Load
                    </button>
                    <button
                      onClick={() => handleSnapshotDownload(bm)}
                      title="Download HD snapshot"
                      className="rounded p-1 text-muted-foreground hover:text-primary"
                    >
                      <ImageDown className="h-3 w-3" />
                    </button>
                    <button onClick={() => deleteBookmark(bm.id)} className="rounded p-1 text-muted-foreground hover:text-red-400">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {kpis && (
        <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-5 page-enter page-enter-stagger-2">
          {[
            { label: "Total Rows", value: kpis.total.toLocaleString(), color: ACCENT },
            { label: `Sum (${kpis.col})`, value: Number(kpis.sum).toLocaleString(), color: ACCENT_BLUE },
            { label: "Average", value: kpis.avg, color: ACCENT },
            { label: "Min", value: String(kpis.min), color: ACCENT_PINK },
            { label: "Max", value: String(kpis.max), color: ACCENT_BLUE },
          ].map((kpi) => (
            <div key={kpi.label} className="glass-card card-3d p-4"
              onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width; const y = (e.clientY - r.top) / r.height; e.currentTarget.style.transform = `perspective(800px) rotateX(${(0.5 - y) * 16}deg) rotateY(${(x - 0.5) * 16}deg)`; e.currentTarget.style.setProperty('--mouse-x', `${x*100}%`); e.currentTarget.style.setProperty('--mouse-y', `${y*100}%`); }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'perspective(800px) rotateX(0) rotateY(0)'; }}
            >
              <div className="specular-highlight" />
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-mono relative z-10">{kpi.label}</div>
              <div className="text-2xl font-bold font-mono relative z-10" style={{ color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="glass-card p-4 lg:col-span-1">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Hash className="h-4 w-4 text-primary" /> Filters</h3>
          <div className="space-y-3">
            {categoricalCols.slice(0, 6).map(col => (
              <div key={col}>
                <label className="text-xs text-muted-foreground mb-1 block">{col}</label>
                <AnalyticsSelect
                  value={filters[col] || ALL_FILTER_VALUE}
                  onValueChange={(v) =>
                    setFilters((f) => ({ ...f, [col]: v === ALL_FILTER_VALUE ? "" : v }))
                  }
                  options={[
                    { value: ALL_FILTER_VALUE, label: "All" },
                    ...[...new Set(rows.map((r) => String(r[col] ?? "")))]
                      .filter(Boolean)
                      .slice(0, 20)
                      .map((v) => ({ value: v, label: v })),
                  ]}
                />
              </div>
            ))}
            {Object.values(filters).some(Boolean) && (
              <button onClick={() => setFilters({})} className="w-full text-xs text-red-400 hover:text-red-300 mt-2">Clear all filters</button>
            )}
          </div>

          <h3 className="text-sm font-semibold mt-6 mb-4 flex items-center gap-2"><BarChart2 className="h-4 w-4 text-primary" /> Chart Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Chart Type</label>
              <div className="grid grid-cols-2 gap-1">
                {(["line", "bar", "pie", "scatter"] as ChartType[]).map(t => (
                  <button key={t} onClick={() => { setChartType(t); setDrillStack([]); }}
                    className={`rounded-lg px-2 py-1.5 text-xs font-medium capitalize transition-all ${chartType === t ? "gradient-bg border-0 text-white font-semibold shadow-[0_0_14px_rgba(140,255,230,0.35)]" : "border border-white/10 text-muted-foreground hover:bg-white/5"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">X Axis</label>
              <AnalyticsSelect
                value={activeX}
                onValueChange={(v) => {
                  setXCol(v);
                  setDrillStack([]);
                }}
                options={columns.map((c) => ({ value: c, label: c }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Y Axis</label>
              <AnalyticsSelect
                value={activeY}
                onValueChange={setYCol}
                options={columns.map((c) => ({ value: c, label: c }))}
              />
            </div>
            {canDrillDown && drillStack.length === 0 && (
              <p className="text-[10px] text-primary mt-1">ðŸ’¡ Click a slice to drill down</p>
            )}
          </div>
        </div>

        <div className="glass-card p-4 lg:col-span-3">
          {drillStack.length > 0 && (
            <div className="flex items-center gap-1 mb-3 flex-wrap">
              <button onClick={() => handleDrillUp(0)} className="text-xs text-primary hover:text-primary font-medium">All data</button>
              {drillStack.map((d, i) => (
                <span key={i} className="flex items-center gap-1">
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <button onClick={() => handleDrillUp(i + 1)}
                    className={`text-xs font-medium ${i === drillStack.length - 1 ? "text-white" : "text-primary hover:text-primary"}`}>
                    {d.col} = {d.value}
                  </button>
                </span>
              ))}
              <button onClick={() => handleDrillUp(0)} className="ml-auto flex items-center gap-1 rounded border border-white/10 px-2 py-0.5 text-xs text-muted-foreground hover:bg-white/5">
                <X className="h-3 w-3" /> Reset
              </button>
            </div>
          )}

          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />{chartTitle}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{chartSubtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowDataTable(v => !v)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${showDataTable ? "border-primary/50 bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:bg-white/5"}`}>
                <Table2 className="h-3 w-3" />
                {showDataTable ? "Hide Data" : "Show Data"}
              </button>
              <button onClick={() => downloadChart("main-chart", "analytics-chart")}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white">
                <Download className="h-3 w-3" /> PNG
              </button>
            </div>
          </div>

          <div id="main-chart">
            <ResponsiveContainer width="100%" height={showDataTable ? 420 : 620}>
              {chartType === "line" ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                    </linearGradient>
                    <filter id="line-glow">
                      <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={ACCENT} floodOpacity="0.55" />
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={({ x, y, payload }) => (<text x={x} y={y + 8} textAnchor="end" transform={`rotate(-35, ${x}, ${y + 8})`} fill="#aaa" fontSize={10} fontFamily="'JetBrains Mono', monospace">{String(payload.value).length > 12 ? String(payload.value).slice(0, 12) + "â€¦" : payload.value}</text>)} height={60} interval={0} />
                  <YAxis tick={{ fill: "#aaa", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                  <Area type="monotone" dataKey="value" stroke={ACCENT} strokeWidth={2.5} fill="url(#lineAreaGrad)" dot={false} style={{ filter: "url(#line-glow)" }} />
                </AreaChart>
              ) : chartType === "bar" ? (
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ACCENT} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={ACCENT_BLUE} stopOpacity={0.35} />
                    </linearGradient>
                    <filter id="bar-glow">
                      <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={ACCENT} floodOpacity="0.45" />
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="name" tick={({ x, y, payload }) => (<text x={x} y={y + 8} textAnchor="end" transform={`rotate(-35, ${x}, ${y + 8})`} fill="#aaa" fontSize={10} fontFamily="'JetBrains Mono', monospace">{String(payload.value).length > 12 ? String(payload.value).slice(0, 12) + "â€¦" : payload.value}</text>)} height={60} interval={0} />
                  <YAxis tick={{ fill: "#aaa", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} cursor={{ fill: "rgba(140,255,230,0.08)" }} />
                  <Bar dataKey="value" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={48} style={{ filter: "url(#bar-glow)" }} />
                </BarChart>
              ) : chartType === "pie" ? (
                <PieChart>
                  <defs>
                    {CHART_COLORS.map((c, i) => (
                      <filter key={`pie-glow-${i}`} id={`pie-glow-${i}`}>
                        <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={c} floodOpacity="0.5" />
                      </filter>
                    ))}
                  </defs>
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label
                    onClick={canDrillDown ? (data) => handleDrillDown({ name: data.name, activePayload: [{ payload: { name: data.name } }] }) : undefined}
                    style={canDrillDown ? { cursor: "pointer" } : {}}
                    animationDuration={800}>
                    {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="#000000" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} formatter={(value, name) => [value, canDrillDown ? `${name} (click to drill)` : name]} />
                  <Legend wrapperStyle={{ color: "#888", fontSize: 12 }} />
                </PieChart>
              ) : (
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="x" name={activeX} tick={{ fill: "#aaa", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} />
                  <YAxis dataKey="y" name={activeY} tick={{ fill: "#aaa", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={chartData} fill={ACCENT_BLUE} animationDuration={800} />
                </ScatterChart>
              )}
            </ResponsiveContainer>
          </div>

          {showDataTable && (
            <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
              <div className="overflow-x-auto max-h-52 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white/[0.04]">
                    <tr>
                      {chartType === "scatter"
                        ? [activeX, activeY].map(h => <th key={h} className="border-b border-white/10 px-3 py-2 text-left font-semibold text-muted-foreground">{h}</th>)
                        : ["Name", "Value"].map(h => <th key={h} className="border-b border-white/10 px-3 py-2 text-left font-semibold text-muted-foreground">{h}</th>)
                      }
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((row, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                        {chartType === "scatter"
                          ? [(row as {x: number}).x, (row as {y: number}).y].map((v, j) => <td key={j} className="px-3 py-1.5 font-mono text-muted-foreground">{String(v)}</td>)
                          : [(row as {name: string}).name, (row as {value: number}).value].map((v, j) => <td key={j} className="px-3 py-1.5 font-mono text-muted-foreground">{String(v)}</td>)
                        }
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

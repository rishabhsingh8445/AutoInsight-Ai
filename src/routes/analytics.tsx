import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useRef } from "react";
import { useDataStore } from "@/store/dataStore";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from "recharts";
import { Download, TrendingUp, Hash, BarChart2, Upload, Table2, ChevronRight, X, Bookmark, BookmarkCheck, Trash2, ImageDown } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
});

const COLORS = ["#10b981", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e", "#a855f7"];

const tooltipStyle = {
  background: "rgba(5,5,8,0.96)",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  color: "#111827",
  fontSize: 12,
  fontFamily: "'JetBrains Mono', monospace",
  boxShadow: "0 8px 32px -8px rgba(0,0,0,0.6)",
};
const tooltipItemStyle = { color: "#06b6d4" };

type ChartType = "bar" | "line" | "pie" | "scatter";

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
  else if (chartType === "line") title = `${activeX} Trend`;
  else title = `${activeX} by Count`;
  if (drillStack.length > 0) {
    return { title, subtitle: `Drill: ${drillStack.map(d => `${d.col} = ${d.value}`).join(" → ")}` };
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

// HIGH QUALITY snapshot — draws chart SVG + metadata onto a branded canvas at 2x scale
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
  accentGrad.addColorStop(0, "#10b981");
  accentGrad.addColorStop(0.5, "#22d3ee");
  accentGrad.addColorStop(1, "#34d399");
  ctx.fillStyle = accentGrad;
  ctx.fillRect(0, 0, W, 4);

  // Logo / app name
  ctx.fillStyle = "#10b981";
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.fillText("✦ AutoInsight AI", 32, 32);

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
  ctx.fillText(`${chartTitle}  ·  ${chartSubtitle}`, 32, 92);

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(32, 106); ctx.lineTo(W - 32, 106); ctx.stroke();

  // KPI Cards row
  if (kpis) {
    const kpiItems = [
      { label: "Rows", value: kpis.total.toLocaleString(), color: "#34d399" },
      { label: `Sum (${kpis.col})`, value: Number(kpis.sum).toLocaleString(), color: "#10b981" },
      { label: "Average", value: kpis.avg, color: "#22d3ee" },
      { label: "Min", value: String(kpis.min), color: "#a3e635" },
      { label: "Max", value: String(kpis.max), color: "#22d3ee" },
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
  const drillPath = drillStack.map(d => `${d.col}=${d.value}`).join(" → ");
  const filterStr = [
    ...activeFilters.map(([k, v]) => `${k}: ${v}`),
    ...(drillPath ? [`Drill: ${drillPath}`] : [])
  ].join("  |  ");
  if (filterStr) {
    ctx.fillStyle = "rgba(16,185,129,0.15)";
    roundRect(ctx, 32, 194, W - 64, 24, 6);
    ctx.fill();
    ctx.fillStyle = "#34d399";
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText("⚡ " + filterStr, 42, 210);
  }

  // Chart area — get SVG from DOM and draw it
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
  if (chartType === "scatter" || chartData.length === 0) return;
  const maxVal = Math.max(...chartData.map(d => d.value ?? 0));
  const barW = Math.min(60, (w - 40) / chartData.length - 8);
  const barAreaH = h - 40;
  chartData.slice(0, 15).forEach((d, i) => {
    const barH = maxVal > 0 ? ((d.value ?? 0) / maxVal) * barAreaH : 0;
    const bx = x + 20 + i * (barW + 8);
    const by = y + barAreaH - barH;
    const color = COLORS[i % COLORS.length];
    ctx.fillStyle = color;
    roundRect(ctx, bx, by, barW, barH, 4);
    ctx.fill();
    ctx.fillStyle = "rgba(148,163,184,0.7)";
    ctx.font = "9px system-ui, sans-serif";
    const label = String(d.name ?? "").slice(0, 8);
    ctx.fillText(label, bx, y + barAreaH + 14);
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

  // Footer left — data summary
  ctx.fillStyle = "rgba(148,163,184,0.5)";
  ctx.font = "10px system-ui, sans-serif";
  const summary = chartType !== "scatter"
    ? `${chartData.length} categories  ·  Chart: ${chartType}`
    : `${chartData.length} data points  ·  Chart: scatter`;
  ctx.fillText(summary, 32, H - 26);

  // Footer right — watermark
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(16,185,129,0.4)";
  ctx.font = "10px system-ui, sans-serif";
  ctx.fillText("Generated by AutoInsight AI", W - 32, H - 26);
  ctx.textAlign = "left";

  // Bottom accent
  const grad = ctx.createLinearGradient(0, H - 3, W, H - 3);
  grad.addColorStop(0, "rgba(16,185,129,0.6)");
  grad.addColorStop(1, "rgba(167,139,250,0.6)");
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
  const [chartType, setChartType] = useState<ChartType>("bar");
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
    setFilters(bm.filters); setChartType(bm.chartType);
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

  const canDrillDown = (chartType === "bar" || chartType === "pie") && nextDrillCol !== null;

  if (!columns.length) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center page-enter page-enter-stagger-1">
        <div className="glass-card p-12">
          <h2 className="text-2xl font-bold text-[#111827]">No data yet</h2>
          <p className="mt-2 text-[#6b7280]">Upload a file to see analytics.</p>
          <Link to="/upload" className="btn-primary mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white">
            <Upload className="h-4 w-4" /> Upload data
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6 page-enter page-enter-stagger-1">
        <div className="hero-spotlight">
          <h1 className="text-3xl font-bold text-[#111827]">Analytics</h1>
          <p className="text-sm text-[#6b7280]">Interactive data exploration</p>
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
                className="rounded-lg border border-white/10 bg-[#f3f4f6] px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500 w-40"
              />
              <button onClick={saveBookmark} className="gradient-bg rounded-lg px-3 py-1.5 text-xs font-medium text-white">Save</button>
              <button onClick={() => setShowNameInput(false)} className="text-xs text-muted-foreground hover:text-white">Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => setShowNameInput(true)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${savedFeedback ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-white/10 text-muted-foreground hover:bg-white/5"}`}
            >
              {savedFeedback ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
              {savedFeedback ? "Saved!" : "Save Snapshot"}
            </button>
          )}
          <button
            onClick={() => setShowBookmarks(v => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${showBookmarks ? "border-purple-500/50 bg-purple-500/10 text-purple-300" : "border-white/10 text-muted-foreground hover:bg-white/5"}`}
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
                <div key={bm.id} className="flex items-start justify-between rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{bm.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{bm.createdAt}</div>
                    <div className="text-[10px] text-purple-400 mt-1">
                      {bm.chartType} · {bm.xCol}
                      {Object.values(bm.filters).filter(Boolean).length > 0 && ` · ${Object.values(bm.filters).filter(Boolean).length} filter(s)`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <button onClick={() => loadBookmark(bm)} className="rounded bg-purple-500/20 px-2 py-1 text-[10px] font-medium text-purple-300 hover:bg-purple-500/30">
                      Load
                    </button>
                    <button
                      onClick={() => handleSnapshotDownload(bm)}
                      title="Download HD snapshot"
                      className="rounded p-1 text-muted-foreground hover:text-purple-400"
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
            { label: "Total Rows", value: kpis.total.toLocaleString(), color: "#10b981" },
            { label: `Sum (${kpis.col})`, value: Number(kpis.sum).toLocaleString(), color: "#06b6d4" },
            { label: "Average", value: kpis.avg, color: "#f59e0b" },
            { label: "Min", value: String(kpis.min), color: "#10b981" },
            { label: "Max", value: String(kpis.max), color: "#a855f7" },
          ].map((kpi, i) => (
            <div key={kpi.label} className="glass-card card-3d p-4"
              onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width; const y = (e.clientY - r.top) / r.height; e.currentTarget.style.transform = `perspective(800px) rotateX(${(0.5 - y) * 16}deg) rotateY(${(x - 0.5) * 16}deg)`; e.currentTarget.style.setProperty('--mouse-x', `${x*100}%`); e.currentTarget.style.setProperty('--mouse-y', `${y*100}%`); }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'perspective(800px) rotateX(0) rotateY(0)'; }}
            >
              <div className="specular-highlight" />
              <div className="text-xs text-[#9ca3af] uppercase tracking-wider mb-1 font-mono relative z-10">{kpi.label}</div>
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
                <select value={filters[col] ?? ""} onChange={e => setFilters(f => ({ ...f, [col]: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-[#f3f4f6] px-3 py-2 text-xs text-white outline-none focus:border-purple-500">
                  <option value="">All</option>
                  {[...new Set(rows.map(r => String(r[col] ?? "")))].filter(Boolean).slice(0, 20).map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
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
                {(["bar", "line", "pie", "scatter"] as ChartType[]).map(t => (
                  <button key={t} onClick={() => { setChartType(t); setDrillStack([]); }}
                    className={`rounded-lg px-2 py-1.5 text-xs font-medium capitalize transition-all ${chartType === t ? "gradient-bg text-white" : "border border-white/10 text-muted-foreground hover:bg-white/5"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">X Axis</label>
              <select value={activeX} onChange={e => { setXCol(e.target.value); setDrillStack([]); }}
                className="w-full rounded-lg border border-white/10 bg-[#f3f4f6] px-3 py-2 text-xs text-white outline-none focus:border-purple-500">
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Y Axis</label>
              <select value={activeY} onChange={e => setYCol(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#f3f4f6] px-3 py-2 text-xs text-white outline-none focus:border-purple-500">
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {canDrillDown && drillStack.length === 0 && (
              <p className="text-[10px] text-purple-400 mt-1">💡 Click a bar/slice to drill down</p>
            )}
          </div>
        </div>

        <div className="glass-card p-4 lg:col-span-3">
          {drillStack.length > 0 && (
            <div className="flex items-center gap-1 mb-3 flex-wrap">
              <button onClick={() => handleDrillUp(0)} className="text-xs text-purple-400 hover:text-purple-300 font-medium">All data</button>
              {drillStack.map((d, i) => (
                <span key={i} className="flex items-center gap-1">
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <button onClick={() => handleDrillUp(i + 1)}
                    className={`text-xs font-medium ${i === drillStack.length - 1 ? "text-white" : "text-purple-400 hover:text-purple-300"}`}>
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
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${showDataTable ? "border-purple-500/50 bg-purple-500/10 text-purple-300" : "border-white/10 text-muted-foreground hover:bg-white/5"}`}>
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
              {chartType === "bar" ? (
                <BarChart data={chartData} onClick={canDrillDown ? handleDrillDown : undefined} style={canDrillDown ? { cursor: "pointer" } : {}}>
                  <defs>
                    {COLORS.map((c, i) => (
                      <filter key={`glow-${i}`} id={`bar-glow-${i}`}>
                        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={c} floodOpacity="0.5" />
                      </filter>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={({ x, y, payload }) => (<text x={x} y={y + 8} textAnchor="end" transform={`rotate(-35, ${x}, ${y + 8})`} fill="#9ca3af" fontSize={10} fontFamily="'JetBrains Mono', monospace">{String(payload.value).length > 12 ? String(payload.value).slice(0, 12) + "…" : payload.value}</text>)} height={60} interval={0} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} formatter={(value) => [value, "Count"]} labelFormatter={(label) => canDrillDown ? `${label} (click to drill down)` : label} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={800} animationBegin={0}>{chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} style={{ filter: `drop-shadow(0 0 8px ${COLORS[i % COLORS.length]}80)` }} />)}</Bar>
                </BarChart>
              ) : chartType === "line" ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <filter id="line-glow">
                      <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10b981" floodOpacity="0.6" />
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={({ x, y, payload }) => (<text x={x} y={y + 8} textAnchor="end" transform={`rotate(-35, ${x}, ${y + 8})`} fill="#9ca3af" fontSize={10} fontFamily="'JetBrains Mono', monospace">{String(payload.value).length > 12 ? String(payload.value).slice(0, 12) + "…" : payload.value}</text>)} height={60} interval={0} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} fill="url(#lineAreaGrad)" dot={false} style={{ filter: "url(#line-glow)" }} />
                </AreaChart>
              ) : chartType === "pie" ? (
                <PieChart>
                  <defs>
                    {COLORS.map((c, i) => (
                      <filter key={`pie-glow-${i}`} id={`pie-glow-${i}`}>
                        <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={c} floodOpacity="0.5" />
                      </filter>
                    ))}
                  </defs>
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label
                    onClick={canDrillDown ? (data) => handleDrillDown({ name: data.name, activePayload: [{ payload: { name: data.name } }] }) : undefined}
                    style={canDrillDown ? { cursor: "pointer" } : {}}
                    animationDuration={800}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#000000" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} formatter={(value, name) => [value, canDrillDown ? `${name} (click to drill)` : name]} />
                  <Legend wrapperStyle={{ color: "#6b7280", fontSize: 12 }} />
                </PieChart>
              ) : (
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="x" name={activeX} tick={{ fill: "#9ca3af", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} />
                  <YAxis dataKey="y" name={activeY} tick={{ fill: "#9ca3af", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={chartData} fill="#06b6d4" animationDuration={800} />
                </ScatterChart>
              )}
            </ResponsiveContainer>
          </div>

          {showDataTable && (
            <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
              <div className="overflow-x-auto max-h-52 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white">
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

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {categoricalCols.slice(0, 3).map((col, idx) => {
          const data = (() => {
            const counts: Record<string, number> = {};
            filteredRows.forEach(r => { const v = String(r[col] ?? "Unknown"); counts[v] = (counts[v] ?? 0) + 1; });
            return Object.entries(counts).slice(0, 6).map(([name, value]) => ({ name, value }));
          })();
          const activeFilterStr = [
            ...Object.entries(filters).filter(([, v]) => Boolean(v)).map(([k, v]) => `${k}=${v}`),
            ...drillStack.map(d => `${d.col}=${d.value}`)
          ].join(", ");
          return (
            <div key={col} className="glass-card p-4" id={`secondary-chart-${idx}`}>
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h4 className="text-xs font-semibold uppercase text-foreground">{col} Distribution</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{activeFilterStr ? `Filtered: ${activeFilterStr}` : "All data"}</p>
                </div>
                <button onClick={() => downloadChart(`secondary-chart-${idx}`, `chart-${col}`)} className="text-xs text-muted-foreground hover:text-white">
                  <Download className="h-3 w-3" />
                </button>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }} />
                  <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={600}>
                    {data.map((_, i) => <Cell key={i} fill={COLORS[(idx + i) % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}

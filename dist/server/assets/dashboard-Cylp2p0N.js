import { T as jsxRuntimeExports, r as reactExports } from "./worker-entry-klvM4nWa.js";
import { u as useDataStore, a as useSettingsStore } from "./dataStore-A-6e1uaD.js";
import { c as cn, B as Button, M as MissingKeysBanner } from "./button-C7dPF7cb.js";
import { c as createLucideIcon, C as ChartColumn, S as Sparkles } from "./router-UXS1IWPM.js";
import { C as CircleAlert } from "./circle-alert-ceUcu8xR.js";
import { D as Download } from "./download-brN0lA6J.js";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./clsx-DgYk2OaC.js";
const __iconNode$3 = [
  [
    "path",
    {
      d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
      key: "1oefj6"
    }
  ],
  ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5", key: "wfsgrz" }],
  ["path", { d: "M10 9H8", key: "b1mrlr" }],
  ["path", { d: "M16 13H8", key: "t4e002" }],
  ["path", { d: "M16 17H8", key: "z1uh3a" }]
];
const FileText = createLucideIcon("file-text", __iconNode$3);
const __iconNode$2 = [
  [
    "path",
    {
      d: "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",
      key: "1gvzjb"
    }
  ],
  ["path", { d: "M9 18h6", key: "x1upvd" }],
  ["path", { d: "M10 22h4", key: "ceow96" }]
];
const Lightbulb = createLucideIcon("lightbulb", __iconNode$2);
const __iconNode$1 = [
  ["path", { d: "M13 5h8", key: "a7qcls" }],
  ["path", { d: "M13 12h8", key: "h98zly" }],
  ["path", { d: "M13 19h8", key: "c3s6r1" }],
  ["path", { d: "m3 17 2 2 4-4", key: "1jhpwq" }],
  ["path", { d: "m3 7 2 2 4-4", key: "1obspn" }]
];
const ListChecks = createLucideIcon("list-checks", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",
      key: "10ikf1"
    }
  ]
];
const Play = createLucideIcon("play", __iconNode);
function Skeleton({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("animate-pulse rounded-md bg-primary/10", className), ...props });
}
function renderBody(body) {
  if (!body) return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "—" });
  const lines = body.split("\n").filter((l) => l.trim() !== "");
  return /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-2", children: lines.map((line, i) => {
    const isBullet = /^\s*[\*\-•]\s+/.test(line);
    const clean = line.replace(/^\s*[\*\-•]\s+/, "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-2.5 text-sm text-muted-foreground leading-relaxed", children: [
      isBullet && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 w-1.5 h-1.5 rounded-full bg-primary/50 mt-[7px]" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: isBullet ? "" : "list-none", children: clean })
    ] }, i);
  }) });
}
function parseSections(text) {
  const grab = (label, next) => {
    const re = new RegExp(`(?:\\*\\*\\s*)?${label}\\s*(?:\\*\\*)?\\s*:?\\s*\\n+([\\s\\S]*?)(?=\\n\\s*(?:\\*\\*\\s*)?(?:${next.join("|")})\\s*(?:\\*\\*)?\\s*:?|$)`, "i");
    const m = text.match(re);
    return m?.[1]?.trim() ?? "";
  };
  return {
    summary: grab("Summary", ["Key Insights", "Insights", "Anomalies", "Recommendations"]) || text.slice(0, 400),
    insights: grab("Key Insights", ["Anomalies", "Recommendations"]) || grab("Insights", ["Anomalies", "Recommendations"]),
    anomalies: grab("Anomalies", ["Recommendations"]),
    recommendations: grab("Recommendations", ["$"])
  };
}
function DashboardPage() {
  const {
    columns,
    rows,
    report
  } = useDataStore();
  const {
    groqKey
  } = useSettingsStore();
  const [loading, setLoading] = reactExports.useState(false);
  const [sections, setSections] = reactExports.useState(null);
  const [error, setError] = reactExports.useState(null);
  const missing = !groqKey ? ["Groq"] : [];
  const hasData = columns.length > 0 && rows.length > 0;
  const run = async () => {
    if (!groqKey) {
      setError("Add your Groq API key in Settings.");
      return;
    }
    if (!hasData) {
      setError("Upload a dataset first.");
      return;
    }
    setError(null);
    setLoading(true);
    setSections(null);
    const sample = rows.slice(0, 10);
    const colStats = columns.map((col) => {
      const vals = rows.map((r) => r[col]).filter((v) => v !== null && v !== "" && v !== void 0);
      const numeric = vals.filter((v) => !isNaN(Number(v))).map(Number);
      const unique = [...new Set(vals)].slice(0, 5);
      return {
        name: col,
        type: numeric.length > vals.length * 0.7 ? "numeric" : "categorical",
        uniqueSample: unique,
        ...numeric.length > 0 ? {
          min: Math.min(...numeric),
          max: Math.max(...numeric),
          avg: Math.round(numeric.reduce((a, b) => a + b, 0) / numeric.length * 100) / 100
        } : {}
      };
    });
    const prompt = `You are a senior data analyst writing a professional report. Analyze this dataset and respond in EXACTLY this format — no asterisks, no markdown, no bold:

Summary:
Write 2-3 clear professional sentences summarizing the dataset.

Key Insights:
- First key finding
- Second key finding
- Third key finding
- Fourth key finding

Anomalies:
- First anomaly or data quality issue
- Second anomaly

Recommendations:
- First actionable recommendation
- Second actionable recommendation
- Third actionable recommendation

Dataset info: ${rows.length} rows, ${columns.length} columns
Column statistics: ${JSON.stringify(colStats)}
Sample rows (10): ${JSON.stringify(sample)}`;
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{
            role: "user",
            content: prompt
          }],
          max_tokens: 1500
        })
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Groq error ${res.status}: ${t.slice(0, 200)}`);
      }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content ?? "";
      if (!text) throw new Error("Empty response from Groq.");
      setSections(parseSections(text));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };
  const downloadPDF = async () => {
    const {
      default: jsPDF
    } = await import("./jspdf.es.min-Vq6bnIE6.js").then((n) => n.j);
    const doc = new jsPDF({
      unit: "mm",
      format: "a4"
    });
    const PW = 210;
    const PH = 297;
    const MARGIN = 16;
    const WIDTH = PW - MARGIN * 2;
    let y = 20;
    const DARK = [15, 23, 42];
    const ACCENT = [99, 102, 241];
    const TEXT = [55, 65, 81];
    const LIGHT = [148, 163, 184];
    doc.setFillColor(...DARK);
    doc.rect(0, 0, PW, 35, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text("AutoInsight AI", MARGIN, 18);
    doc.setFontSize(9);
    doc.setTextColor(...LIGHT);
    doc.text("DATA ANALYSIS REPORT", MARGIN, 25);
    y = 45;
    const writeText = (text) => {
      const lines = doc.splitTextToSize(text.replace(/\n/g, " "), WIDTH);
      for (const line of lines) {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.setTextColor(...TEXT);
        doc.setFontSize(10);
        doc.text(line, MARGIN, y);
        y += 6;
      }
    };
    const writeBullets = (text) => {
      const lines = text.split("\n").filter(Boolean);
      lines.forEach((line) => {
        const clean = line.replace(/^[-•]\s*/, "");
        const wrapped = doc.splitTextToSize(clean, WIDTH - 8);
        wrapped.forEach((w, i) => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          if (i === 0) {
            doc.setFillColor(...ACCENT);
            doc.circle(MARGIN, y - 1.5, 1, "F");
          }
          doc.setTextColor(...TEXT);
          doc.text(w, MARGIN + 5, y);
          y += 6;
        });
        y += 2;
      });
    };
    const section = (title, body, bullets = false) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...DARK);
      doc.text(title.toUpperCase(), MARGIN, y);
      const titleWidth = doc.getTextWidth(title.toUpperCase());
      doc.setDrawColor(...ACCENT);
      doc.setLineWidth(0.6);
      doc.line(MARGIN, y + 2, MARGIN + titleWidth + 4, y + 2);
      y += 8;
      if (bullets) writeBullets(body);
      else writeText(body);
      y += 6;
    };
    if (sections) {
      section("Executive Summary", sections.summary);
      section("Key Insights", sections.insights, true);
      section("Anomalies", sections.anomalies, true);
      section("Recommendations", sections.recommendations, true);
    }
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...LIGHT);
      doc.text(`Confidential • AutoInsight AI • Page ${i} of ${totalPages}`, PW / 2, PH - 10, {
        align: "center"
      });
    }
    doc.save(`AutoInsight_Report_${Date.now()}.pdf`);
  };
  const cards = sections ? [{
    title: "Summary",
    icon: FileText,
    body: sections.summary
  }, {
    title: "Key Insights",
    icon: Lightbulb,
    body: sections.insights
  }, {
    title: "Anomalies",
    icon: CircleAlert,
    body: sections.anomalies
  }, {
    title: "Recommendations",
    icon: ListChecks,
    body: sections.recommendations
  }] : [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "Dashboard" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "AI-powered analysis of your dataset." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: run, disabled: loading || !hasData, className: "gradient-bg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-4 w-4" }),
          " ",
          loading ? "Analyzing..." : "Run Analysis"
        ] }),
        sections && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: downloadPDF, variant: "outline", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
          " Download PDF"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MissingKeysBanner, { missing }) }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive", children: error }),
    !hasData && !loading && !sections && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card mt-4 flex flex-col items-center justify-center p-16 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "gradient-bg flex h-16 w-16 items-center justify-center rounded-2xl shadow-[var(--shadow-glow)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { className: "h-8 w-8 text-primary-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-6 text-xl font-semibold", children: "Upload data to begin" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 max-w-md text-sm text-muted-foreground", children: "Once you upload a file, click Run Analysis to get AI-generated insights." })
    ] }),
    hasData && !sections && !loading && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card mt-4 p-6 text-sm text-muted-foreground", children: [
      report?.cleanedRows.toLocaleString(),
      " rows · ",
      columns.length,
      " columns ready.",
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-1 inline-flex items-center gap-1 text-primary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3 w-3" }),
        " Click Run Analysis to start."
      ] })
    ] }),
    loading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 grid gap-4 md:grid-cols-2", children: [0, 1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-32" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-full" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-5/6" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-4/6" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-3/6" })
      ] })
    ] }, i)) }),
    sections && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 grid gap-4 md:grid-cols-2", children: cards.map(({
      title,
      icon: Icon,
      body
    }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "gradient-bg flex h-8 w-8 items-center justify-center rounded-lg shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4 text-primary-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-foreground uppercase tracking-wide", children: title })
      ] }),
      renderBody(body)
    ] }, title)) })
  ] });
}
export {
  DashboardPage as component
};

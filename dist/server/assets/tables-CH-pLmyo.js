import { r as reactExports, T as jsxRuntimeExports } from "./worker-entry-klvM4nWa.js";
import { c as createLucideIcon, L as Link, U as Upload } from "./router-UXS1IWPM.js";
import { u as useDataStore } from "./dataStore-A-6e1uaD.js";
import { d as downloadCSV } from "./parseFile-HaCfDFIn.js";
import { D as Download } from "./download-brN0lA6J.js";
import { C as ChevronRight } from "./chevron-right-CngTI7y8.js";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "stream";
const __iconNode$3 = [
  ["path", { d: "M12 5v14", key: "s699le" }],
  ["path", { d: "m19 12-7 7-7-7", key: "1idqje" }]
];
const ArrowDown = createLucideIcon("arrow-down", __iconNode$3);
const __iconNode$2 = [
  ["path", { d: "m5 12 7-7 7 7", key: "hav0vg" }],
  ["path", { d: "M12 19V5", key: "x0mq9r" }]
];
const ArrowUp = createLucideIcon("arrow-up", __iconNode$2);
const __iconNode$1 = [["path", { d: "m15 18-6-6 6-6", key: "1wnfg3" }]];
const ChevronLeft = createLucideIcon("chevron-left", __iconNode$1);
const __iconNode = [
  ["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }]
];
const Search = createLucideIcon("search", __iconNode);
const PAGE_SIZE = 20;
function getNumericCols(columns, rows) {
  const set = /* @__PURE__ */ new Set();
  columns.forEach((col) => {
    const vals = rows.slice(0, 20).map((r) => r[col]);
    const numCount = vals.filter((v) => v !== null && v !== "" && !isNaN(Number(v))).length;
    if (numCount > 12) set.add(col);
  });
  return set;
}
function getColStats(col, rows) {
  const vals = rows.map((r) => Number(r[col])).filter((v) => !isNaN(v));
  if (!vals.length) return null;
  return {
    min: Math.min(...vals),
    max: Math.max(...vals)
  };
}
function getCellStyle(value, stats) {
  if (!stats || stats.max === stats.min) return {};
  const num = Number(value);
  if (isNaN(num)) return {};
  const ratio = (num - stats.min) / (stats.max - stats.min);
  if (ratio >= 0.75) return {
    color: "#4ade80"
  };
  if (ratio >= 0.45) return {
    color: "#facc15"
  };
  return {
    color: "#f87171"
  };
}
function TablesPage() {
  const {
    columns,
    rows,
    report
  } = useDataStore();
  const [query, setQuery] = reactExports.useState("");
  const [sortCol, setSortCol] = reactExports.useState(null);
  const [sortDir, setSortDir] = reactExports.useState("asc");
  const [page, setPage] = reactExports.useState(0);
  const [conditionalFormat, setConditionalFormat] = reactExports.useState(true);
  const numericCols = reactExports.useMemo(() => getNumericCols(columns, rows), [columns, rows]);
  const colStats = reactExports.useMemo(() => {
    const map = {};
    columns.forEach((col) => {
      if (numericCols.has(col)) map[col] = getColStats(col, rows);
    });
    return map;
  }, [columns, rows, numericCols]);
  const filtered = reactExports.useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) => columns.some((c) => String(r[c] ?? "").toLowerCase().includes(q)));
  }, [rows, columns, query]);
  const sorted = reactExports.useMemo(() => {
    if (!sortCol) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = a[sortCol];
      const vb = b[sortCol];
      const na = Number(va), nb = Number(vb);
      let cmp;
      if (!isNaN(na) && !isNaN(nb) && va !== "" && vb !== "") cmp = na - nb;
      else cmp = String(va ?? "").localeCompare(String(vb ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortCol, sortDir]);
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const slice = sorted.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortCol(col);
      setSortDir("asc");
    }
  };
  if (!columns.length) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-2xl py-20 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold", children: "No data yet" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground", children: "Upload a file to see your table here." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/upload", className: "gradient-bg mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-primary-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4" }),
        " Upload data"
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "Tables" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
          sorted.length.toLocaleString(),
          " rows · ",
          columns.length,
          " columns"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card flex items-center gap-2 px-3 py-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: query, onChange: (e) => {
            setQuery(e.target.value);
            setPage(0);
          }, placeholder: "Search all columns...", className: "w-64 bg-transparent text-sm outline-none placeholder:text-muted-foreground" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setConditionalFormat((f) => !f), className: `inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${conditionalFormat ? "border-purple-500/50 bg-purple-500/10 text-purple-300" : "border-white/10 text-muted-foreground hover:bg-white/5"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 rounded-full", style: {
            background: conditionalFormat ? "#a78bfa" : "#555"
          } }),
          "Conditional Format"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => void downloadCSV(columns, sorted, `cleaned_${report?.fileName ?? "data.csv"}`), className: "gradient-bg inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
          " Download File"
        ] })
      ] })
    ] }),
    conditionalFormat && numericCols.size > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center gap-4 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Numeric scale:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: {
        color: "#f87171"
      }, children: "● Low" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: {
        color: "#facc15"
      }, children: "● Mid" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: {
        color: "#4ade80"
      }, children: "● High" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card mt-4 overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-white/5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: columns.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "border-b border-white/10 px-4 py-3 text-left font-semibold", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => toggleSort(c), className: "flex items-center gap-1.5 hover:text-primary whitespace-nowrap", children: [
          c,
          numericCols.has(c) && conditionalFormat && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 rounded bg-purple-500/20 px-1 py-0.5 text-[9px] text-purple-300", children: "NUM" }),
          sortCol === c && (sortDir === "asc" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUp, { className: "h-3 w-3" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDown, { className: "h-3 w-3" }))
        ] }) }, c)) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
          slice.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "border-b border-white/5 transition-colors hover:bg-white/5", children: columns.map((c) => {
            const val = r[c];
            const style = conditionalFormat && numericCols.has(c) ? getCellStyle(val, colStats[c]) : {};
            return /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-2.5 font-mono text-xs", style, children: String(val ?? "") }, c);
          }) }, i)),
          slice.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: columns.length, className: "px-4 py-12 text-center text-muted-foreground", children: "No matching rows" }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-t border-white/10 px-4 py-3 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          "Page ",
          current + 1,
          " of ",
          pages
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setPage((p) => Math.max(0, p - 1)), disabled: current === 0, className: "rounded-md border border-white/10 p-1.5 hover:bg-white/5 disabled:opacity-40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setPage((p) => Math.min(pages - 1, p + 1)), disabled: current >= pages - 1, className: "rounded-md border border-white/10 p-1.5 hover:bg-white/5 disabled:opacity-40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" }) })
        ] })
      ] })
    ] })
  ] });
}
export {
  TablesPage as component
};

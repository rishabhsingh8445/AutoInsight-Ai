import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useDataStore } from "@/store/dataStore";
import { downloadCSV } from "@/lib/parseFile";
import { Search, Download, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Upload } from "lucide-react";

export const Route = createFileRoute("/tables")({
  component: TablesPage,
});

const PAGE_SIZE = 20;

// Detect numeric columns using a sample spread across the full dataset
function getNumericCols(columns: string[], rows: Record<string, unknown>[]) {
  const set = new Set<string>();
  const step = Math.max(1, Math.floor(rows.length / 100));
  const sample = rows.filter((_, i) => i % step === 0);
  columns.forEach(col => {
    const vals = sample.map(r => r[col]);
    const numCount = vals.filter(v => v !== null && v !== "" && !isNaN(Number(v))).length;
    if (numCount > vals.length * 0.7) set.add(col);
  });
  return set;
}

// Per-column min/max for color scaling
function getColStats(col: string, rows: Record<string, unknown>[]) {
  const vals = rows.map(r => Number(r[col])).filter(v => !isNaN(v));
  if (!vals.length) return null;
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

// Returns a Tailwind-compatible inline style for the cell
function getCellStyle(value: unknown, stats: { min: number; max: number } | null): React.CSSProperties {
  if (!stats || stats.max === stats.min) return {};
  const num = Number(value);
  if (isNaN(num)) return {};
  const ratio = (num - stats.min) / (stats.max - stats.min); // 0 to 1
  if (ratio >= 0.75) return { color: "#4ade80" };       // green
  if (ratio >= 0.45) return { color: "#facc15" };       // yellow
  return { color: "#f87171" };                          // red
}

function TablesPage() {
  const { columns, rows, report } = useDataStore();
  const [query, setQuery] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [conditionalFormat, setConditionalFormat] = useState(true);

  const numericCols = useMemo(() => getNumericCols(columns, rows), [columns, rows]);

  const colStats = useMemo(() => {
    const map: Record<string, { min: number; max: number } | null> = {};
    columns.forEach(col => {
      if (numericCols.has(col)) map[col] = getColStats(col, rows);
    });
    return map;
  }, [columns, rows, numericCols]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((r) => columns.some((c) => String(r[c] ?? "").toLowerCase().includes(q)));
  }, [rows, columns, query]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = a[sortCol];
      const vb = b[sortCol];
      const na = Number(va), nb = Number(vb);
      let cmp: number;
      if (!isNaN(na) && !isNaN(nb) && va !== "" && vb !== "") cmp = na - nb;
      else cmp = String(va ?? "").localeCompare(String(vb ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortCol, sortDir]);

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const slice = sorted.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  if (!columns.length) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <div className="glass-card p-12">
          <h2 className="text-2xl font-bold">No data yet</h2>
          <p className="mt-2 text-muted-foreground">Upload a file to see your table here.</p>
          <Link to="/upload" className="gradient-bg mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            <Upload className="h-4 w-4" /> Upload data
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tables</h1>
          <p className="text-sm text-muted-foreground">{sorted.length.toLocaleString()} rows · {columns.length} columns</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="glass-card flex items-center gap-2 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              placeholder="Search all columns..."
              className="w-64 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Conditional Format Toggle */}
          <button
            onClick={() => setConditionalFormat(f => !f)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
              conditionalFormat
                ? "border-purple-500/50 bg-purple-500/10 text-purple-300"
                : "border-white/10 text-muted-foreground hover:bg-white/5"
            }`}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: conditionalFormat ? "#a78bfa" : "#555" }} />
            Conditional Format
          </button>

          <button
            onClick={() => void downloadCSV(columns, sorted, `cleaned_${report?.fileName ?? "data.csv"}`)}
            className="gradient-bg inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Download className="h-4 w-4" /> Download File
          </button>
        </div>
      </div>

      {/* Legend */}
      {conditionalFormat && numericCols.size > 0 && (
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span>Numeric scale:</span>
          <span style={{ color: "#f87171" }}>● Low</span>
          <span style={{ color: "#facc15" }}>● Mid</span>
          <span style={{ color: "#4ade80" }}>● High</span>
        </div>
      )}

      <div className="glass-card mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                {columns.map((c) => (
                  <th key={c} className="border-b border-white/10 px-4 py-3 text-left font-semibold">
                    <button onClick={() => toggleSort(c)} className="flex items-center gap-1.5 hover:text-primary whitespace-nowrap">
                      {c}
                      {numericCols.has(c) && conditionalFormat && (
                        <span className="ml-1 rounded bg-purple-500/20 px-1 py-0.5 text-[9px] text-purple-300">NUM</span>
                      )}
                      {sortCol === c && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((r, i) => (
                <tr key={i} className="border-b border-white/5 transition-colors hover:bg-white/5">
                  {columns.map((c) => {
                    const val = r[c];
                    const style =
                      conditionalFormat && numericCols.has(c)
                        ? getCellStyle(val, colStats[c])
                        : {};
                    return (
                      <td key={c} className="px-4 py-2.5 font-mono text-xs" style={style}>
                        {String(val ?? "")}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {slice.length === 0 && (
                <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">No matching rows</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-sm text-muted-foreground">
          <div>Page {current + 1} of {pages}</div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={current === 0}
              className="rounded-md border border-white/10 p-1.5 hover:bg-white/5 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              disabled={current >= pages - 1}
              className="rounded-md border border-white/10 p-1.5 hover:bg-white/5 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useDataStore } from "@/store/dataStore";
import { downloadCSV } from "@/lib/parseFile";
import { Search, Download, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { SCALE_HIGH, SCALE_MID, SCALE_LOW, ACCENT } from "@/lib/theme";

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

// Returns badge class + style for conditional formatting
function getCellInfo(value: unknown, stats: { min: number; max: number } | null): { style: React.CSSProperties; badge?: string } {
  if (!stats || stats.max === stats.min) return { style: {} };
  const num = Number(value);
  if (isNaN(num)) return { style: {} };
  const ratio = (num - stats.min) / (stats.max - stats.min);
  if (ratio >= 0.75) return { style: { color: SCALE_HIGH }, badge: "badge-high" };
  if (ratio >= 0.45) return { style: { color: SCALE_MID }, badge: "badge-mid" };
  return { style: { color: SCALE_LOW }, badge: "badge-low" };
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
      <div className="mx-auto max-w-2xl py-20 text-center page-enter page-enter-stagger-1">
        <div className="glass-card p-12">
          <h2 className="text-2xl font-bold text-foreground">No data yet</h2>
          <p className="mt-2 text-muted-foreground">Upload a file to see your table here.</p>
          <Link to="/upload" className="btn-primary mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white">
            <Upload className="h-4 w-4" /> Upload data
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="about page">
      <div className="page__hero about__hero page-enter">
        <div className="about__badge"><span>Data</span></div>
        <h1 className="about__title">Data <span className="about__titleAccent">tables</span></h1>
        <p className="about__lead">{sorted.length.toLocaleString()} rows · {columns.length} columns</p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-4 page-enter page-enter-stagger-1" style={{ marginBottom: "1.25rem" }}>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="glass-card flex items-center gap-2 px-3 py-2 chat-input-glow">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              placeholder="Search all columns..."
              className="w-64 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
            />
          </div>

          {/* Conditional Format Toggle */}
          <button
            onClick={() => setConditionalFormat(f => !f)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
              conditionalFormat
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-white/[0.04]"
            }`}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: conditionalFormat ? ACCENT : "#aaa" }} />
            Conditional Format
          </button>

          <button
            onClick={() => void downloadCSV(columns, sorted, `cleaned_${report?.fileName ?? "data.csv"}`)}
            className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          >
            <Download className="h-4 w-4" /> Download File
          </button>
        </div>
      </div>

      {/* Legend */}
      {conditionalFormat && numericCols.size > 0 && (
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground page-enter page-enter-stagger-2">
          <span>Numeric scale:</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full badge-low" style={{ background: SCALE_LOW }} /> Low</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full badge-mid" style={{ background: SCALE_MID }} /> Mid</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full badge-high" style={{ background: SCALE_HIGH }} /> High</span>
        </div>
      )}

      <div className="glass-card mt-4 overflow-hidden page-enter page-enter-stagger-3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03]">
              <tr>
                {columns.map((c) => (
                  <th key={c} className="border-b border-border px-4 py-3 text-left font-semibold text-muted-foreground">
                    <button onClick={() => toggleSort(c)} className="flex items-center gap-1.5 hover:text-primary whitespace-nowrap transition-colors">
                      {c}
                      {numericCols.has(c) && conditionalFormat && (
                        <span className="ml-1 rounded px-1 py-0.5 text-[9px] font-mono bg-primary/15 text-primary">NUM</span>
                      )}
                      {sortCol === c && (sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />)}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((r, i) => (
                <tr key={i} className="table-row-hover border-b border-white/[0.04]">
                  {columns.map((c) => {
                    const val = r[c];
                    const isNum = numericCols.has(c);
                    const info = conditionalFormat && isNum ? getCellInfo(val, colStats[c]) : { style: {} };
                    return (
                      <td key={c} className="px-4 py-2.5 text-xs" style={info.style}>
                        {isNum ? (
                          <span className="font-mono" style={{ color: conditionalFormat ? info.style.color : ACCENT }}>
                            {String(val ?? "")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">{String(val ?? "")}</span>
                        )}
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

        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground">
          <div className="font-mono">Page {current + 1} of {pages}</div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={current === 0}
              className="rounded-md border border-border p-1.5 hover:bg-white/[0.04] disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              disabled={current >= pages - 1}
              className="rounded-md border border-border p-1.5 hover:bg-white/[0.04] disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

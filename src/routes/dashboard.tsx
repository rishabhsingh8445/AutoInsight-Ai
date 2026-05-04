import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, Sparkles, Play, AlertCircle, Lightbulb, ListChecks, FileText, Download } from "lucide-react";
import { useDataStore, useSettingsStore } from "@/store/dataStore";
import { MissingKeysBanner } from "@/components/MissingKeysBanner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

interface Sections {
  summary: string;
  insights: string;
  anomalies: string;
  recommendations: string;
}

function renderBody(body: string) {
  if (!body) return <span className="text-muted-foreground">—</span>;
  const lines = body.split("\n").filter(l => l.trim() !== "");
  return (
    <ul className="space-y-2">
      {lines.map((line, i) => {
        const isBullet = /^\s*[\*\-•]\s+/.test(line);
        const clean = line
          .replace(/^\s*[\*\-•]\s+/, "")
          .replace(/\*\*(.+?)\*\*/g, "$1")
          .replace(/\*(.+?)\*/g, "$1");
        return (
          <li key={i} className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed">
            {isBullet && <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary/50 mt-[7px]" />}
            <span className={isBullet ? "" : "list-none"}>{clean}</span>
          </li>
        );
      })}
    </ul>
  );
}

function parseSections(text: string): Sections {
  const grab = (label: string, next: string[]) => {
    const re = new RegExp(`(?:\\*\\*\\s*)?${label}\\s*(?:\\*\\*)?\\s*:?\\s*\\n+([\\s\\S]*?)(?=\\n\\s*(?:\\*\\*\\s*)?(?:${next.join("|")})\\s*(?:\\*\\*)?\\s*:?|$)`, "i");
    const m = text.match(re);
    return m?.[1]?.trim() ?? "";
  };
  return {
    summary: grab("Summary", ["Key Insights", "Insights", "Anomalies", "Recommendations"]) || text.slice(0, 400),
    insights: grab("Key Insights", ["Anomalies", "Recommendations"]) || grab("Insights", ["Anomalies", "Recommendations"]),
    anomalies: grab("Anomalies", ["Recommendations"]),
    recommendations: grab("Recommendations", ["$"]),
  };
}

/**
 * Computes column statistics over the FULL dataset.
 * Also returns a small representative sample for the LLM prompt.
 */
function buildFullStats(columns: string[], rows: Record<string, unknown>[]) {
  const totalRows = rows.length;

  const colStats = columns.map(col => {
    const vals = rows.map(r => r[col]).filter(v => v !== null && v !== "" && v !== undefined);
    const nullCount = totalRows - vals.length;
    const numeric = vals.filter(v => !isNaN(Number(v))).map(Number);
    const isNumeric = numeric.length > vals.length * 0.7;

    if (isNumeric && numeric.length > 0) {
      const sorted = [...numeric].sort((a, b) => a - b);
      const mean = numeric.reduce((a, b) => a + b, 0) / numeric.length;
      const median = sorted[Math.floor(sorted.length / 2)];
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      return {
        name: col, type: "numeric",
        count: vals.length, nulls: nullCount,
        min: sorted[0], max: sorted[sorted.length - 1],
        mean: Math.round(mean * 100) / 100,
        median, q1, q3,
      };
    } else {
      const freq: Record<string, number> = {};
      vals.forEach(v => { const k = String(v); freq[k] = (freq[k] ?? 0) + 1; });
      const topValues = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([v, c]) => `${v}(${c})`);
      return {
        name: col, type: "categorical",
        count: vals.length, nulls: nullCount,
        uniqueValues: Object.keys(freq).length,
        topValues,
      };
    }
  });

  // Representative sample: first 10 + last 5
  const sample = [
    ...rows.slice(0, 10),
    ...(rows.length > 15 ? rows.slice(-5) : []),
  ];

  return { colStats, sample, totalRows };
}

function DashboardPage() {
  const { columns, rows, report } = useDataStore();
  const { groqKey } = useSettingsStore();
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<Sections | null>(null);
  const [error, setError] = useState<string | null>(null);

  const missing = !groqKey ? ["Groq"] : [];
  const hasData = columns.length > 0 && rows.length > 0;

  const run = async () => {
    if (!groqKey) { setError("Add your Groq API key in Settings."); return; }
    if (!hasData) { setError("Upload a dataset first."); return; }
    setError(null); setLoading(true); setSections(null);

    const { colStats, sample, totalRows } = buildFullStats(columns, rows);

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

Dataset info: ${totalRows.toLocaleString()} rows, ${columns.length} columns
Column statistics (computed over ALL ${totalRows} rows): ${JSON.stringify(colStats)}
Sample rows (first 10 + last 5): ${JSON.stringify(sample)}`;

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1500,
        }),
      });
      if (!res.ok) { const t = await res.text(); throw new Error(`Groq error ${res.status}: ${t.slice(0, 200)}`); }
      const data = await res.json();
      const text: string = data.choices?.[0]?.message?.content ?? "";
      if (!text) throw new Error("Empty response from Groq.");
      setSections(parseSections(text));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const PW = 210;
    const PH = 297;
    const MARGIN = 16;
    const WIDTH = PW - MARGIN * 2;
    let y = 20;

    const DARK: [number, number, number] = [15, 23, 42];
    const ACCENT: [number, number, number] = [99, 102, 241];
    const TEXT: [number, number, number] = [55, 65, 81];
    const LIGHT: [number, number, number] = [148, 163, 184];

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

    const writeText = (text: string) => {
      const lines = doc.splitTextToSize(text.replace(/\n/g, " "), WIDTH);
      for (const line of lines) {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.setTextColor(...TEXT);
        doc.setFontSize(10);
        doc.text(line, MARGIN, y);
        y += 6;
      }
    };

    const writeBullets = (text: string) => {
      const lines = text.split("\n").filter(Boolean);
      lines.forEach(line => {
        const clean = line.replace(/^[-•]\s*/, "");
        const wrapped = doc.splitTextToSize(clean, WIDTH - 8);
        wrapped.forEach((w: string, i: number) => {
          if (y > 280) { doc.addPage(); y = 20; }
          if (i === 0) { doc.setFillColor(...ACCENT); doc.circle(MARGIN, y - 1.5, 1, "F"); }
          doc.setTextColor(...TEXT);
          doc.text(w, MARGIN + 5, y);
          y += 6;
        });
        y += 2;
      });
    };

    const section = (title: string, body: string, bullets = false) => {
      if (y > 260) { doc.addPage(); y = 20; }
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
      doc.text(
        `Confidential • AutoInsight AI • Page ${i} of ${totalPages}`,
        PW / 2, PH - 10, { align: "center" }
      );
    }

    doc.save(`AutoInsight_Report_${Date.now()}.pdf`);
  };

  const cards = sections ? [
    { title: "Summary",         icon: FileText,    body: sections.summary },
    { title: "Key Insights",    icon: Lightbulb,   body: sections.insights },
    { title: "Anomalies",       icon: AlertCircle, body: sections.anomalies },
    { title: "Recommendations", icon: ListChecks,  body: sections.recommendations },
  ] : [];

  return (
    <div className="py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">AI-powered analysis of your dataset.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={run} disabled={loading || !hasData} className="gradient-bg">
            <Play className="h-4 w-4" /> {loading ? "Analyzing..." : "Run Analysis"}
          </Button>
          {sections && (
            <Button onClick={downloadPDF} variant="outline">
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6">
        <MissingKeysBanner missing={missing} />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {!hasData && !loading && !sections && (
        <div className="glass-card mt-4 flex flex-col items-center justify-center p-16 text-center">
          <div className="gradient-bg flex h-16 w-16 items-center justify-center rounded-2xl shadow-[var(--shadow-glow)]">
            <BarChart3 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">Upload data to begin</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Once you upload a file, click Run Analysis to get AI-generated insights.
          </p>
        </div>
      )}

      {hasData && !sections && !loading && (
        <div className="glass-card mt-4 p-6 text-sm text-muted-foreground">
          {report?.cleanedRows.toLocaleString()} rows · {columns.length} columns ready.
          <span className="ml-1 inline-flex items-center gap-1 text-primary">
            <Sparkles className="h-3 w-3" /> Click Run Analysis to start.
          </span>
        </div>
      )}

      {loading && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6">
              <Skeleton className="h-5 w-32" />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/6" />
                <Skeleton className="h-3 w-3/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {sections && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {cards.map(({ title, icon: Icon, body }) => (
            <div key={title} className="glass-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="gradient-bg flex h-8 w-8 items-center justify-center rounded-lg shrink-0">
                  <Icon className="h-4 w-4 text-primary-foreground" />
                </div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">{title}</h3>
              </div>
              {renderBody(body)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

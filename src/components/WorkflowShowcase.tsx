import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Upload,
  Sparkles,
  LineChart,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";

const STEPS = [
  {
    id: "upload",
    short: "Upload",
    label: "Upload CSV or Excel",
    desc: "Drop your spreadsheet and we parse it instantly in the browser — no server wait.",
    tags: ["CSV", "XLSX", "XLS"],
    stat: "Instant parse",
    to: "/upload" as const,
    Icon: Upload,
  },
  {
    id: "clean",
    short: "Clean",
    label: "Auto clean & validate",
    desc: "Empty rows removed, duplicates stripped, and a full quality report before you explore.",
    tags: ["Parse", "Dedupe", "Profile"],
    stat: "Quality report",
    to: "/tables" as const,
    Icon: Sparkles,
  },
  {
    id: "analyze",
    short: "Analyze",
    label: "Visual analytics",
    desc: "Line, pie, and scatter charts with filters, drill-down, and HD export.",
    tags: ["Charts", "KPIs", "Drill-down"],
    stat: "Live charts",
    to: "/analytics" as const,
    Icon: LineChart,
  },
  {
    id: "chat",
    short: "Chat",
    label: "AI chat & insights",
    desc: "Ask questions in plain English — answers use stats from your full dataset.",
    tags: ["Groq", "LLM", "PDF"],
    stat: "AI-native",
    to: "/chat" as const,
    Icon: MessageSquare,
  },
] as const;

function StageVisual({ stepId }: { stepId: (typeof STEPS)[number]["id"] }) {
  if (stepId === "upload") {
    return (
      <div className="workflow-visual workflow-visual--upload">
        <div className="workflow-visual__uploadZone">
          <FileSpreadsheet className="workflow-visual__uploadIcon" strokeWidth={1.5} />
          <span className="workflow-visual__uploadText">sales_data.xlsx</span>
          <span className="workflow-visual__uploadHint">Drop or click to browse</span>
        </div>
        <div className="workflow-visual__uploadMeta">
          <span><CheckCircle2 size={14} /> 4.2 MB</span>
          <span><CheckCircle2 size={14} /> 12 columns detected</span>
        </div>
      </div>
    );
  }

  if (stepId === "clean") {
    return (
      <div className="workflow-visual workflow-visual--table">
        <table className="workflow-visual__table">
          <thead>
            <tr>
              {["Region", "Revenue", "Units", "Status"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["North", "$48.2k", "320", "Active"],
              ["South", "$31.5k", "210", "Active"],
              ["East", "$52.1k", "401", "Active"],
            ].map((row, i) => (
              <tr key={i} className={i === 1 ? "workflow-visual__row--highlight" : undefined}>
                {row.map((cell) => (
                  <td key={cell}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="workflow-visual__stats">
          <span className="workflow-visual__stat workflow-visual__stat--ok">18 empty rows removed</span>
          <span className="workflow-visual__stat workflow-visual__stat--ok">7 duplicates merged</span>
        </div>
      </div>
    );
  }



  if (stepId === "analyze") {
    const series = [
      { label: "Jan", value: 42 },
      { label: "Feb", value: 58 },
      { label: "Mar", value: 51 },
      { label: "Apr", value: 72 },
      { label: "May", value: 68 },
      { label: "Jun", value: 88 },
      { label: "Jul", value: 95 },
    ];
    const max = Math.max(...series.map((p) => p.value));
    const toY = (v: number) => 100 - (v / max) * 82;
    const toX = (i: number) => (i / (series.length - 1)) * 100;
    const linePath = series
      .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(p.value).toFixed(1)}`)
      .join(" ");
    const areaPath = `${linePath} L 100 100 L 0 100 Z`;
    return (
      <div className="workflow-visual workflow-visual--chart">
        <div className="workflow-visual__chartFrame">
          <div className="workflow-visual__chartYAxis" aria-hidden="true">
            {[100, 75, 50, 25, 0].map((tick) => (
              <span key={tick}>{tick}k</span>
            ))}
          </div>
          <div className="workflow-visual__chartPlot">
            <div className="workflow-visual__chartGrid" aria-hidden="true" />
            <svg className="workflow-visual__chartLine" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="workflowLineFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(var(--a), 0.45)" />
                  <stop offset="100%" stopColor="rgba(var(--a), 0)" />
                </linearGradient>
              </defs>
              <path className="workflow-visual__chartArea" d={areaPath} fill="url(#workflowLineFill)" />
              <path className="workflow-visual__chartStroke" d={linePath} fill="none" />
              {series.map((p, i) => (
                <circle
                  key={p.label}
                  className="workflow-visual__chartDot"
                  cx={toX(i)}
                  cy={toY(p.value)}
                  r="2.2"
                  style={{ animationDelay: `${i * 0.08}s` }}
                />
              ))}
            </svg>
            <div className="workflow-visual__chartXLabels" aria-hidden="true">
              {series.map((p) => (
                <span key={p.label}>{p.label}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="workflow-visual__chartLegend">
          <span>Revenue trend</span>
          <span className="workflow-visual__chartKpi">+24% vs prior</span>
        </div>
      </div>
    );
  }

  return (
    <div className="workflow-visual workflow-visual--chat">
      <div className="workflow-visual__chatBubble workflow-visual__chatBubble--user">
        What&apos;s the average revenue in the North region?
      </div>
      <div className="workflow-visual__chatBubble workflow-visual__chatBubble--ai">
        North region average revenue is <strong>$48,200</strong> across 320 units — about 18% above the dataset mean.
      </div>
      <div className="workflow-visual__chatTyping">
        <span /><span /><span />
      </div>
    </div>
  );
}

export function WorkflowShowcase() {
  const [step, setStep] = useState(0);
  const item = STEPS[step];
  const Icon = item.Icon;

  return (
    <section className="about-diorama">
      <header className="about-diorama__header">
        <h2 className="h2">Navigate through the workflow</h2>
        <p className="muted workflow-showcase__subtitle">
          From upload to AI insights — four steps, zero code.
        </p>
      </header>

      <div className="about-diorama__viewport workflow-showcase">
        <div className="workflow-showcase__bg" aria-hidden="true">
          <div className="workflow-showcase__grid" />
          <div className="workflow-showcase__glow workflow-showcase__glow--a" />
          <div className="workflow-showcase__glow workflow-showcase__glow--b" />
        </div>

        <nav className="workflow-showcase__rail" aria-label="Workflow steps">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`workflow-showcase__railItem${i === step ? " is-active" : ""}${i < step ? " is-done" : ""}`}
              onClick={() => setStep(i)}
              aria-current={i === step ? "step" : undefined}
            >
              <span className="workflow-showcase__railDot">{i + 1}</span>
              <span className="workflow-showcase__railLabel">{s.short}</span>
            </button>
          ))}
          <div className="workflow-showcase__railProgress" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
        </nav>

        <div className="workflow-showcase__body">
          <div className="workflow-showcase__stage" key={item.id}>
            <StageVisual stepId={item.id} />
          </div>

          <article className="workflow-showcase__panel">
            <div className="workflow-showcase__panelIcon">
              <Icon strokeWidth={1.75} />
            </div>
            <div className="workflow-showcase__panelContent">
              <p className="workflow-showcase__panelKicker">
                Step {step + 1} of {STEPS.length}
                <span className="workflow-showcase__panelStat">{item.stat}</span>
              </p>
              <h3 className="workflow-showcase__panelTitle">{item.label}</h3>
              <p className="workflow-showcase__panelDesc muted">{item.desc}</p>
              <div className="about-diorama__chips">
                {item.tags.map((t) => (
                  <span key={t} className="about-diorama__chip">{t}</span>
                ))}
              </div>
              <Link to={item.to} className="btn btn--primary workflow-showcase__cta">
                Try this step <ArrowRight size={16} />
              </Link>
            </div>
          </article>
        </div>

        <nav className="about-diorama__controls workflow-showcase__controls" aria-label="Workflow navigation">
          <button
            type="button"
            className="about-diorama__control"
            disabled={step === 0}
            aria-label="Previous step"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H6m5-5-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
          </button>
          <span className="about-diorama__step">{step + 1} / {STEPS.length}</span>
          <button
            type="button"
            className="about-diorama__control"
            disabled={step >= STEPS.length - 1}
            aria-label="Next step"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
          </button>
        </nav>
      </div>
    </section>
  );
}

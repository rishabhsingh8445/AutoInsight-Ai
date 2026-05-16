import { createFileRoute, Link } from "@tanstack/react-router";
import { Upload, ArrowRight, BarChart3, MessageSquare, Database, LineChart, Zap, Shield, Cpu } from "lucide-react";
import { useRef, useEffect, useState, useCallback } from "react";

export const Route = createFileRoute("/")({ component: Home });

/* ━━━ ANIMATED TEXT — each char slides up from below ━━━ */
function AnimText({ text, delay = 0, className = "" }: { text: string; delay?: number; className?: string }) {
  return (
    <span className={className} style={{ display: "inline-flex", overflow: "hidden", perspective: "600px" }}>
      {text.split("").map((char, i) => (
        <span key={i} style={{
          display: "inline-block",
          animation: `char-reveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) both`,
          animationDelay: `${delay + i * 40}ms`,
          minWidth: char === " " ? "0.3em" : undefined,
        }}>{char}</span>
      ))}
    </span>
  );
}

/* ━━━ COUNT UP — numbers animate in when visible ━━━ */
function CountUp({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const dur = 2200, start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / dur, 1);
          setVal(Math.floor(target * (1 - Math.pow(1 - p, 4))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

/* ━━━ SCROLL REVEAL ━━━ */
function useScrollReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.animationDelay = `${delay}ms`;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add("visible"); obs.disconnect(); }
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return ref;
}

/* ━━━ BENTO CARD ━━━ */
function BentoCard({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useScrollReveal(delay);
  return <div ref={ref} className={`bento-card scroll-reveal ${className}`}>{children}</div>;
}

/* ━━━ HOME ━━━ */
function Home() {
  const statsRef = useScrollReveal();
  const trustRef = useScrollReveal(100);

  return (
    <div className="relative max-w-5xl mx-auto">

      {/* ── HERO ── */}
      <section className="min-h-[78vh] flex flex-col items-center justify-center text-center py-20">
        {/* Badge */}
        <div className="page-enter page-enter-stagger-1 mb-12">
          <div className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 text-[11px] font-medium text-[#888]"
            style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.06)", backdropFilter: "blur(10px)" }}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            AI-Powered Data Intelligence
          </div>
        </div>

        {/* Title */}
        <h1 className="leading-[0.85] tracking-[-0.04em]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <span className="block text-[clamp(3.5rem,10vw,7.5rem)] font-bold text-[#1a1a1a]">
            <AnimText text="Auto" delay={300} />
          </span>
          <span className="block text-[clamp(3.5rem,10vw,7.5rem)] font-bold gradient-text">
            <AnimText text="Insight" delay={550} />
          </span>
        </h1>

        {/* Tagline */}
        <p className="page-enter page-enter-stagger-4 mt-8 text-[17px] leading-relaxed text-[#888] max-w-md mx-auto">
          Upload your data. Get instant cleaning, analytics, and AI insights — <span className="text-[#555] font-medium">zero code.</span>
        </p>

        {/* CTA */}
        <div className="page-enter page-enter-stagger-5 mt-12 flex items-center gap-4">
          <Link to="/upload"
            className="btn-primary group inline-flex items-center gap-3 rounded-2xl px-8 py-4 text-sm font-semibold">
            <Upload className="h-4 w-4" />
            Get started
            <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* ── GRADIENT SEPARATOR ── */}
      <div className="gradient-line max-w-[200px] mx-auto my-4" />

      {/* ── STATS ── */}
      <section ref={statsRef} className="scroll-reveal py-16">
        <div className="flex items-center justify-center gap-16 md:gap-24 text-center">
          {[
            { target: 50000, suffix: "+", label: "Rows processed" },
            { target: 2, prefix: "<", suffix: "s", label: "Analysis time" },
            { target: 100, suffix: "%", label: "Client-side privacy" },
          ].map(({ target, suffix, prefix, label }) => (
            <div key={label}>
              <div className="text-3xl md:text-4xl font-bold text-[#1a1a1a] tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                <CountUp target={target} suffix={suffix || ""} prefix={prefix || ""} />
              </div>
              <div className="text-[11px] text-[#bbb] mt-2 tracking-wide uppercase">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES BENTO ── */}
      <section className="py-8">
        <div className="bento-grid">
          {/* Smart Upload — wide */}
          <BentoCard className="bento-wide" delay={0}>
            <div className="flex items-start justify-between h-full">
              <div className="flex-1">
                <div className="icon-float inline-flex h-11 w-11 items-center justify-center rounded-2xl mb-5 bg-emerald-50">
                  <Upload className="h-5 w-5 text-emerald-500" />
                </div>
                <h3 className="text-base font-bold text-[#1a1a1a] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Smart Upload</h3>
                <p className="text-[13px] text-[#999] leading-relaxed max-w-sm">
                  Drop your CSV or Excel. We auto-detect columns, clean empty rows, strip duplicates — all in under 2 seconds.
                </p>
              </div>
              <div className="hidden md:flex flex-col gap-2 ml-8">
                {[".csv", ".xlsx", ".xls"].map(ext => (
                  <div key={ext} className="rounded-xl px-3 py-1.5 text-[11px] font-mono text-emerald-600"
                    style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.1)" }}>{ext}</div>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* Chat — tall */}
          <BentoCard className="bento-tall" delay={120}>
            <div className="icon-float inline-flex h-11 w-11 items-center justify-center rounded-2xl mb-5 bg-amber-50">
              <MessageSquare className="h-5 w-5 text-amber-500" />
            </div>
            <h3 className="text-base font-bold text-[#1a1a1a] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Chat with Data</h3>
            <p className="text-[13px] text-[#999] leading-relaxed mb-6">Ask in plain English. AI understands your entire dataset.</p>
            <div className="space-y-3">
              <div className="rounded-2xl px-3.5 py-2.5 text-[12px] text-[#666] max-w-[85%]"
                style={{ background: "rgba(0,0,0,0.03)" }}>
                What's the top product by revenue?
              </div>
              <div className="rounded-2xl px-3.5 py-2.5 text-[12px] text-emerald-700 max-w-[85%] ml-auto typing-cursor"
                style={{ background: "rgba(16,185,129,0.06)" }}>
                Product X leads with $24.5K
              </div>
            </div>
          </BentoCard>

          {/* Visual Insights */}
          <BentoCard delay={240}>
            <div className="icon-float inline-flex h-11 w-11 items-center justify-center rounded-2xl mb-5 bg-sky-50">
              <BarChart3 className="h-5 w-5 text-sky-500" />
            </div>
            <h3 className="text-base font-bold text-[#1a1a1a] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Visual Insights</h3>
            <p className="text-[13px] text-[#999] leading-relaxed">Interactive charts, drill-down analytics, and exportable HD snapshots.</p>
          </BentoCard>

          {/* AI Dashboard */}
          <BentoCard delay={360}>
            <div className="icon-float inline-flex h-11 w-11 items-center justify-center rounded-2xl mb-5 bg-violet-50">
              <LineChart className="h-5 w-5 text-violet-500" />
            </div>
            <h3 className="text-base font-bold text-[#1a1a1a] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>AI Dashboard</h3>
            <p className="text-[13px] text-[#999] leading-relaxed">Auto-generated summaries, anomaly detection — powered by Groq.</p>
          </BentoCard>

          {/* Cloud & Export — wide */}
          <BentoCard className="bento-wide" delay={480}>
            <div className="flex items-center gap-8">
              <div className="flex-1">
                <div className="icon-float inline-flex h-11 w-11 items-center justify-center rounded-2xl mb-5 bg-blue-50">
                  <Database className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="text-base font-bold text-[#1a1a1a] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Cloud Sync & Export</h3>
                <p className="text-[13px] text-[#999] leading-relaxed max-w-md">
                  Uploads saved to your cloud (auto-deleted 48h). Export as PDF, Excel, or chart snapshots.
                </p>
              </div>
              <div className="hidden md:grid grid-cols-2 gap-2">
                {["PDF", "Excel", "PNG", "CSV"].map(fmt => (
                  <div key={fmt} className="hover-lift flex items-center justify-center rounded-xl px-4 py-2.5 text-[11px] font-semibold text-[#888]"
                    style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)" }}>
                    {fmt}
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section ref={trustRef} className="scroll-reveal py-14 max-w-4xl mx-auto">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { icon: Zap, label: "Lightning fast", detail: "Client-side processing", bg: "emerald" },
            { icon: Shield, label: "Privacy first", detail: "Data never leaves your browser", bg: "sky" },
            { icon: Cpu, label: "AI-powered", detail: "Groq LLM for natural language", bg: "amber" },
          ].map(({ icon: Icon, label, detail, bg }) => (
            <div key={label} className="hover-lift flex items-start gap-3.5 rounded-2xl px-5 py-4 transition-all"
              style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.04)", backdropFilter: "blur(10px)" }}>
              <div className={`shrink-0 mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-${bg}-50`}>
                <Icon className={`h-4 w-4 text-${bg}-500`} />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#1a1a1a]">{label}</div>
                <div className="text-[11px] text-[#bbb] mt-0.5">{detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <div className="gradient-line max-w-[160px] mx-auto mb-10" />
          <p className="text-[13px] text-[#bbb] mb-6">Ready to explore your data?</p>
          <Link to="/upload" className="btn-primary group inline-flex items-center gap-2.5 rounded-2xl px-7 py-3.5 text-sm font-semibold">
            Start analyzing <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  );
}

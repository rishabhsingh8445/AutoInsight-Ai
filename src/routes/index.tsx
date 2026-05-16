import { createFileRoute, Link } from "@tanstack/react-router";
import { Upload, ArrowRight, BarChart3, MessageSquare, Zap, Shield, Cpu, Database, FileSpreadsheet, LineChart } from "lucide-react";
import { useRef, useEffect, useState, useCallback } from "react";

export const Route = createFileRoute("/")(
  { component: Home }
);

/* ━━━ PARTICLE CONSTELLATION ━━━ */
interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; opacity: number; hue: number;
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio, 2);

    const resize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Init particles
    const COUNT = 70;
    particlesRef.current = Array.from({ length: COUNT }, () => ({
      x: Math.random() * (w || 800),
      y: Math.random() * (h || 600),
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
      hue: Math.random() > 0.5 ? 160 : 185,
    }));

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleLeave = () => { mouseRef.current = { x: -1000, y: -1000 }; };
    canvas.addEventListener("mousemove", handleMouse);
    canvas.addEventListener("mouseleave", handleLeave);

    const animate = () => {
      if (!w) { w = canvas.offsetWidth; h = canvas.offsetHeight; }
      ctx.clearRect(0, 0, w, h);
      const ps = particlesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Update + draw particles
      for (const p of ps) {
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          const force = (180 - dist) / 180;
          p.vx -= (dx / dist) * force * 0.015;
          p.vy -= (dy / dist) * force * 0.015;
        }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        p.vx *= 0.995; p.vy *= 0.995;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${p.opacity})`;
        ctx.fill();
      }

      // Connections
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const dx = ps[i].x - ps[j].x;
          const dy = ps[i].y - ps[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const alpha = 0.08 * (1 - dist / 130);
            ctx.beginPath();
            ctx.moveTo(ps[i].x, ps[i].y);
            ctx.lineTo(ps[j].x, ps[j].y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Mouse glow
      if (mx > 0 && my > 0) {
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, 120);
        g.addColorStop(0, "rgba(16, 185, 129, 0.06)");
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(mx, my, 120, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouse);
      canvas.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" />;
}

/* ━━━ ANIMATED TEXT (per-character reveal) ━━━ */
function AnimText({ text, delay = 0, className = "" }: { text: string; delay?: number; className?: string }) {
  return (
    <span className={className} style={{ display: "inline-block", perspective: "600px" }}>
      {text.split("").map((char, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            animation: `char-reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) both`,
            animationDelay: `${delay + i * 35}ms`,
            minWidth: char === " " ? "0.25em" : undefined,
          }}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

/* ━━━ COUNTING NUMBER ━━━ */
function CountUp({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const dur = 2000;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 4);
          setVal(Math.floor(target * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="number-glow">
      {prefix}{val.toLocaleString()}{suffix}
    </span>
  );
}

/* ━━━ SCROLL REVEAL HOOK ━━━ */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.classList.add("visible");
        obs.disconnect();
      }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ━━━ BENTO CARD with mouse tracking ━━━ */
function BentoCard({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useScrollReveal();
  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const rx = ((e.clientY - rect.top) / rect.height - 0.5) * -8;
    const ry = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    e.currentTarget.style.setProperty("--mouse-x", `${x}%`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}%`);
    e.currentTarget.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  }, []);
  const handleLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "perspective(800px) rotateX(0) rotateY(0)";
  }, []);

  return (
    <div
      ref={ref}
      className={`bento-card scroll-reveal ${className}`}
      style={{ animationDelay: `${delay}ms` }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </div>
  );
}

/* ━━━ HOME PAGE ━━━ */
function Home() {
  const statsRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  return (
    <div className="relative">
      {/* ━━ HERO SECTION ━━ */}
      <div className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <ParticleCanvas />

        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          {/* Badge */}
          <div className="mb-10 page-enter page-enter-stagger-1">
            <div className="mx-auto inline-flex items-center gap-2.5 rounded-full border border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-sm px-5 py-2 text-xs font-medium text-[#888]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              AI-Powered Data Intelligence Platform
            </div>
          </div>

          {/* Title */}
          <h1 className="text-7xl md:text-9xl font-extrabold tracking-tighter leading-[0.85]">
            <AnimText text="Auto" delay={200} className="text-[#f0f0f0]" />
            <br />
            <AnimText text="Insight" delay={500} className="gradient-text" />
          </h1>

          {/* Decorative line */}
          <div className="mt-5 flex items-center justify-center gap-3 page-enter page-enter-stagger-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#10b981]/50" />
            <span className="text-[10px] font-bold tracking-[0.4em] text-[#10b981]/70 uppercase">Artificial Intelligence</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#10b981]/50" />
          </div>

          {/* Subtitle */}
          <p className="mt-8 text-lg md:text-xl text-[#777] max-w-xl mx-auto leading-relaxed page-enter page-enter-stagger-4">
            Upload your data. Get instant cleaning, visual analytics, and AI-powered insights — <span className="text-[#ccc] font-medium">zero code required.</span>
          </p>

          {/* CTA */}
          <div className="mt-10 page-enter page-enter-stagger-5">
            <Link
              to="/upload"
              className="btn-primary group inline-flex items-center gap-3 rounded-2xl px-10 py-4.5 text-sm font-bold text-black transition-all hover:gap-4"
            >
              <Upload className="h-4.5 w-4.5" />
              Get started free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Gradient line separator */}
          <div className="gradient-line mt-20 max-w-xs mx-auto" />
        </div>
      </div>

      {/* ━━ STATS SECTION ━━ */}
      <div ref={statsRef} className="scroll-reveal py-12">
        <div className="flex items-center justify-center gap-12 md:gap-20 text-center">
          {[
            { target: 50000, suffix: "+", label: "Rows processed" },
            { target: 2, prefix: "<", suffix: "s", label: "Analysis time" },
            { target: 100, suffix: "%", label: "Client-side privacy" },
          ].map(({ target, suffix, prefix, label }) => (
            <div key={label}>
              <div className="text-3xl md:text-4xl font-extrabold text-[#f0f0f0] tabular-nums">
                <CountUp target={target} suffix={suffix || ""} prefix={prefix || ""} />
              </div>
              <div className="text-xs text-[#555] mt-1.5 tracking-wide">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ━━ BENTO FEATURES ━━ */}
      <div className="py-8 max-w-5xl mx-auto">
        <div className="bento-grid">
          {/* Card 1: Smart Upload — WIDE */}
          <BentoCard className="bento-wide" delay={0}>
            <div className="flex items-start justify-between h-full">
              <div className="flex-1">
                <div className="icon-float inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-5"
                  style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <Upload className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-[#f0f0f0] mb-2">Smart Upload</h3>
                <p className="text-sm text-[#666] leading-relaxed max-w-sm">
                  Drop your CSV or Excel file. We auto-detect columns, remove empty rows, strip duplicates, and fix formatting — all in under 2 seconds.
                </p>
              </div>
              <div className="hidden md:flex flex-col gap-2 ml-6">
                {[".csv", ".xlsx", ".xls"].map(ext => (
                  <div key={ext} className="rounded-lg border border-[#1a1a1a] bg-[#050505] px-3 py-1.5 text-xs font-mono text-[#10b981]">{ext}</div>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* Card 2: AI Chat — TALL */}
          <BentoCard className="bento-tall" delay={100}>
            <div className="icon-float inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-5"
              style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))", border: "1px solid rgba(245,158,11,0.2)" }}>
              <MessageSquare className="h-5 w-5 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-[#f0f0f0] mb-2">Chat with Data</h3>
            <p className="text-sm text-[#666] leading-relaxed mb-6">Ask questions in plain English. The AI understands your entire dataset.</p>
            {/* Fake chat preview */}
            <div className="space-y-3">
              <div className="rounded-xl bg-[#111] border border-[#1a1a1a] px-3.5 py-2.5 text-xs text-[#999] max-w-[85%]">
                What's the top product by revenue?
              </div>
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 text-xs text-emerald-300 max-w-[85%] ml-auto typing-cursor">
                Product X leads with $24.5K
              </div>
            </div>
          </BentoCard>

          {/* Card 3: Analytics */}
          <BentoCard delay={200}>
            <div className="icon-float inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-5"
              style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(34,211,238,0.05))", border: "1px solid rgba(34,211,238,0.2)" }}>
              <BarChart3 className="h-5 w-5 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-[#f0f0f0] mb-2">Visual Insights</h3>
            <p className="text-sm text-[#666] leading-relaxed">Interactive charts, drill-down analytics, and exportable HD snapshots.</p>
          </BentoCard>

          {/* Card 4: Dashboard */}
          <BentoCard delay={300}>
            <div className="icon-float inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-5"
              style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))", border: "1px solid rgba(168,85,247,0.2)" }}>
              <LineChart className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-[#f0f0f0] mb-2">AI Dashboard</h3>
            <p className="text-sm text-[#666] leading-relaxed">Auto-generated summaries, anomaly detection, and key findings — powered by Groq LLM.</p>
          </BentoCard>

          {/* Card 5: Cloud + Export — WIDE */}
          <BentoCard className="bento-wide" delay={400}>
            <div className="flex items-center gap-8">
              <div className="flex-1">
                <div className="icon-float inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-5"
                  style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))", border: "1px solid rgba(59,130,246,0.2)" }}>
                  <Database className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-[#f0f0f0] mb-2">Cloud Sync & Export</h3>
                <p className="text-sm text-[#666] leading-relaxed max-w-md">
                  Every upload is saved to your personal cloud (auto-deleted after 48h). Export reports as PDF, Excel, or high-res chart snapshots.
                </p>
              </div>
              <div className="hidden md:grid grid-cols-2 gap-2">
                {["PDF", "Excel", "PNG", "CSV"].map(fmt => (
                  <div key={fmt} className="hover-lift flex items-center justify-center rounded-xl border border-[#1a1a1a] bg-[#050505] px-4 py-2.5 text-xs font-semibold text-[#888]">
                    {fmt}
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>
        </div>
      </div>

      {/* ━━ TRUST STRIP ━━ */}
      <div ref={ctaRef} className="scroll-reveal py-16 max-w-4xl mx-auto">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { icon: Zap, label: "Lightning fast", detail: "Client-side processing, no server round-trips", color: "#10b981" },
            { icon: Shield, label: "Privacy first", detail: "Data never leaves your browser", color: "#22d3ee" },
            { icon: Cpu, label: "AI-powered", detail: "Groq LLM for natural language insights", color: "#f59e0b" },
          ].map(({ icon: Icon, label, detail, color }, i) => (
            <div key={label}
              className="hover-lift flex items-start gap-3.5 rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] px-5 py-4 transition-all hover:border-[#2a2a2a]"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="shrink-0 mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#e0e0e0]">{label}</div>
                <div className="text-xs text-[#555] mt-0.5 leading-relaxed">{detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div className="mt-16 text-center">
          <div className="gradient-line max-w-xs mx-auto mb-10" />
          <p className="text-sm text-[#555] mb-6">Ready to explore your data?</p>
          <Link
            to="/upload"
            className="btn-primary group inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-sm font-bold text-black"
          >
            Start analyzing
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}

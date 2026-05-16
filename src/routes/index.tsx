import { createFileRoute, Link } from "@tanstack/react-router";
import { Upload, ArrowRight, BarChart3, MessageSquare, Zap, Shield, Cpu, Database, LineChart } from "lucide-react";
import { useRef, useEffect, useState, useCallback } from "react";

export const Route = createFileRoute("/")(
  { component: Home }
);

/* ━━━ PARTICLE CONSTELLATION (light version) ━━━ */
interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; opacity: number;
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

    const COUNT = 50;
    particlesRef.current = Array.from({ length: COUNT }, () => ({
      x: Math.random() * (w || 800),
      y: Math.random() * (h || 600),
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.15 + 0.05,
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
      const mx = mouseRef.current.x, my = mouseRef.current.y;

      for (const p of ps) {
        const dx = mx - p.x, dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 160) {
          const force = (160 - dist) / 160;
          p.vx -= (dx / dist) * force * 0.01;
          p.vy -= (dy / dist) * force * 0.01;
        }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        p.vx *= 0.997; p.vy *= 0.997;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, 185, 129, ${p.opacity})`;
        ctx.fill();
      }

      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const dx = ps[i].x - ps[j].x, dy = ps[i].y - ps[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(ps[i].x, ps[i].y);
            ctx.lineTo(ps[j].x, ps[j].y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      if (mx > 0 && my > 0) {
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, 100);
        g.addColorStop(0, "rgba(16, 185, 129, 0.04)");
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(mx, my, 100, 0, Math.PI * 2); ctx.fill();
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

  return <canvas ref={canvasRef} className="particle-canvas" style={{ opacity: 0.6 }} />;
}

/* ━━━ ANIMATED TEXT ━━━ */
function AnimText({ text, delay = 0, className = "" }: { text: string; delay?: number; className?: string }) {
  return (
    <span className={className} style={{ display: "inline-block" }}>
      {text.split("").map((char, i) => (
        <span key={i} style={{
          display: "inline-block",
          animation: `char-reveal 0.5s cubic-bezier(0.16, 1, 0.3, 1) both`,
          animationDelay: `${delay + i * 30}ms`,
          minWidth: char === " " ? "0.25em" : undefined,
        }}>{char}</span>
      ))}
    </span>
  );
}

/* ━━━ COUNT UP ━━━ */
function CountUp({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const dur = 2000, start = performance.now();
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
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add("visible"); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ━━━ BENTO CARD ━━━ */
function BentoCard({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useScrollReveal();
  return (
    <div ref={ref} className={`bento-card scroll-reveal ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ━━━ HOME ━━━ */
function Home() {
  const statsRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  return (
    <div className="relative">
      {/* Hero */}
      <div className="relative min-h-[82vh] flex items-center justify-center overflow-hidden rounded-2xl bg-white border border-gray-200" style={{ margin: "-8px -16px 0", padding: "0 16px" }}>
        <ParticleCanvas />

        <div className="relative z-10 text-center max-w-3xl mx-auto px-4">
          <div className="mb-8 page-enter page-enter-stagger-1">
            <div className="mx-auto inline-flex items-center gap-2.5 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-500 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              AI-Powered Data Intelligence
            </div>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
            <AnimText text="Auto" delay={200} className="text-gray-900" />
            <br />
            <AnimText text="Insight" delay={400} className="gradient-text" />
          </h1>

          <div className="mt-4 flex items-center justify-center gap-3 page-enter page-enter-stagger-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-emerald-300" />
            <span className="text-[10px] font-bold tracking-[0.3em] text-emerald-500 uppercase">Artificial Intelligence</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-emerald-300" />
          </div>

          <p className="mt-8 text-lg text-gray-500 max-w-lg mx-auto leading-relaxed page-enter page-enter-stagger-4">
            Upload your data. Get instant cleaning, visual analytics, and AI-powered insights — <span className="text-gray-800 font-medium">zero code required.</span>
          </p>

          <div className="mt-10 page-enter page-enter-stagger-5">
            <Link to="/upload"
              className="btn-primary group inline-flex items-center gap-3 rounded-xl px-8 py-3.5 text-sm font-bold transition-all hover:gap-4">
              <Upload className="h-4 w-4" />
              Get started free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div ref={statsRef} className="scroll-reveal py-14">
        <div className="flex items-center justify-center gap-12 md:gap-20 text-center">
          {[
            { target: 50000, suffix: "+", label: "Rows processed" },
            { target: 2, prefix: "<", suffix: "s", label: "Analysis time" },
            { target: 100, suffix: "%", label: "Client-side privacy" },
          ].map(({ target, suffix, prefix, label }) => (
            <div key={label}>
              <div className="text-3xl font-extrabold text-gray-900 tabular-nums">
                <CountUp target={target} suffix={suffix || ""} prefix={prefix || ""} />
              </div>
              <div className="text-xs text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bento */}
      <div className="py-4 max-w-5xl mx-auto">
        <div className="bento-grid">
          <BentoCard className="bento-wide" delay={0}>
            <div className="flex items-start justify-between h-full">
              <div className="flex-1">
                <div className="icon-float inline-flex h-11 w-11 items-center justify-center rounded-xl mb-4 bg-emerald-50 border border-emerald-100">
                  <Upload className="h-5 w-5 text-emerald-500" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">Smart Upload</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
                  Drop your CSV or Excel. Auto-detect columns, remove empty rows, strip duplicates — all in under 2 seconds.
                </p>
              </div>
              <div className="hidden md:flex flex-col gap-2 ml-6">
                {[".csv", ".xlsx", ".xls"].map(ext => (
                  <div key={ext} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-mono text-emerald-600">{ext}</div>
                ))}
              </div>
            </div>
          </BentoCard>

          <BentoCard className="bento-tall" delay={100}>
            <div className="icon-float inline-flex h-11 w-11 items-center justify-center rounded-xl mb-4 bg-amber-50 border border-amber-100">
              <MessageSquare className="h-5 w-5 text-amber-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1.5">Chat with Data</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">Ask questions in plain English. AI understands your entire dataset.</p>
            <div className="space-y-2.5">
              <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 text-xs text-gray-600 max-w-[85%]">
                What's the top product by revenue?
              </div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5 text-xs text-emerald-700 max-w-[85%] ml-auto typing-cursor">
                Product X leads with $24.5K
              </div>
            </div>
          </BentoCard>

          <BentoCard delay={200}>
            <div className="icon-float inline-flex h-11 w-11 items-center justify-center rounded-xl mb-4 bg-sky-50 border border-sky-100">
              <BarChart3 className="h-5 w-5 text-sky-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1.5">Visual Insights</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Interactive charts, drill-down analytics, and exportable HD snapshots.</p>
          </BentoCard>

          <BentoCard delay={300}>
            <div className="icon-float inline-flex h-11 w-11 items-center justify-center rounded-xl mb-4 bg-purple-50 border border-purple-100">
              <LineChart className="h-5 w-5 text-purple-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1.5">AI Dashboard</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Auto-generated summaries, anomaly detection, and key findings — powered by Groq.</p>
          </BentoCard>

          <BentoCard className="bento-wide" delay={400}>
            <div className="flex items-center gap-8">
              <div className="flex-1">
                <div className="icon-float inline-flex h-11 w-11 items-center justify-center rounded-xl mb-4 bg-blue-50 border border-blue-100">
                  <Database className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">Cloud Sync & Export</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-md">
                  Every upload saved to your cloud (auto-deleted after 48h). Export as PDF, Excel, or chart snapshots.
                </p>
              </div>
              <div className="hidden md:grid grid-cols-2 gap-2">
                {["PDF", "Excel", "PNG", "CSV"].map(fmt => (
                  <div key={fmt} className="hover-lift flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
                    {fmt}
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>
        </div>
      </div>

      {/* Trust */}
      <div ref={ctaRef} className="scroll-reveal py-12 max-w-4xl mx-auto">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { icon: Zap, label: "Lightning fast", detail: "Client-side processing, no server round-trips", color: "emerald" },
            { icon: Shield, label: "Privacy first", detail: "Data never leaves your browser", color: "sky" },
            { icon: Cpu, label: "AI-powered", detail: "Groq LLM for natural language insights", color: "amber" },
          ].map(({ icon: Icon, label, detail, color }) => (
            <div key={label} className="hover-lift flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 transition-all hover:shadow-md">
              <div className={`shrink-0 mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-${color}-50 border border-${color}-100`}>
                <Icon className={`h-4 w-4 text-${color}-500`} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{detail}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <div className="gradient-line max-w-xs mx-auto mb-8" />
          <p className="text-sm text-gray-400 mb-5">Ready to explore your data?</p>
          <Link to="/upload" className="btn-primary group inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold">
            Start analyzing <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}

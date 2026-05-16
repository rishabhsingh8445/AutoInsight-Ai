import { createFileRoute, Link } from "@tanstack/react-router";
import { Upload, ArrowRight, BarChart3, MessageSquare, Zap, Shield, Cpu, MousePointerClick } from "lucide-react";
import { useRef } from "react";

export const Route = createFileRoute("/")(
  { component: Home }
);

function Home() {
  const heroRef = useRef<HTMLDivElement>(null);

  const handleHeroMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const r = heroRef.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    heroRef.current.style.setProperty("--rx", `${-y * 5}deg`);
    heroRef.current.style.setProperty("--ry", `${x * 5}deg`);
  };

  const handleHeroLeave = () => {
    if (!heroRef.current) return;
    heroRef.current.style.setProperty("--rx", "0deg");
    heroRef.current.style.setProperty("--ry", "0deg");
  };

  return (
    <div className="mx-auto max-w-5xl py-12">
      {/* 3D Hero Section */}
      <div
        ref={heroRef}
        onMouseMove={handleHeroMove}
        onMouseLeave={handleHeroLeave}
        className="text-center hero-spotlight"
        style={{
          transformStyle: "preserve-3d",
          transform: "perspective(1200px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))",
          transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Badge */}
        <div className="page-enter page-enter-stagger-1">
          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-1.5 text-xs font-medium text-[#888]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Now with AI-powered insights
          </div>
        </div>

        {/* Title */}
        <div className="page-enter page-enter-stagger-2">
          <h1 className="text-6xl font-bold tracking-tight md:text-8xl leading-none">
            <span className="block text-[#f0f0f0]" style={{ transform: "translateZ(40px)" }}>Auto</span>
            <span className="block gradient-text" style={{ transform: "translateZ(60px)" }}>Insight</span>
          </h1>
          <div className="mt-3 flex items-center justify-center gap-2" style={{ transform: "translateZ(30px)" }}>
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#10b981]" />
            <span className="text-xs font-semibold tracking-[0.3em] text-[#10b981] uppercase">Artificial Intelligence</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#10b981]" />
          </div>
        </div>

        {/* Description */}
        <div className="page-enter page-enter-stagger-3" style={{ transform: "translateZ(20px)" }}>
          <p className="mt-8 text-lg text-[#888] max-w-lg mx-auto leading-relaxed">
            Upload your CSV or Excel files. Get instant cleaning, exploration, and intelligence — without writing a line of code.
          </p>
        </div>

        {/* CTA */}
        <div className="page-enter page-enter-stagger-4 mt-10 flex items-center justify-center gap-4" style={{ transform: "translateZ(50px)" }}>
          <Link
            to="/upload"
            className="btn-primary inline-flex items-center gap-2.5 rounded-xl px-7 py-3.5 text-sm font-bold text-black transition-all"
          >
            <Upload className="h-4 w-4" />
            Upload your data
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-[#222] bg-[#0a0a0a] px-6 py-3.5 text-sm font-medium text-[#ccc] hover:border-[#333] hover:text-white transition-all"
          >
            <MousePointerClick className="h-4 w-4" />
            View demo
          </Link>
        </div>
      </div>

      {/* Stats strip */}
      <div className="mt-20 flex items-center justify-center gap-8 text-center page-enter page-enter-stagger-5">
        {[
          { value: "50K+", label: "Rows processed" },
          { value: "<2s", label: "Avg. analysis time" },
          { value: "100%", label: "Client-side privacy" },
        ].map(({ value, label }) => (
          <div key={label} className="px-4">
            <div className="text-2xl font-bold text-[#f0f0f0] count-up">{value}</div>
            <div className="text-xs text-[#555] mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Feature cards */}
      <div className="mt-16 grid gap-4 md:grid-cols-3 page-enter page-enter-stagger-6">
        {[
          { icon: Upload, title: "Smart Upload", desc: "Auto-clean CSV & Excel files. Removes duplicates, empty rows, and fixes formatting instantly.", color: "#10b981" },
          { icon: BarChart3, title: "Visual Insights", desc: "Beautiful interactive charts, drill-down analytics, and exportable dashboards from raw data.", color: "#22d3ee" },
          { icon: MessageSquare, title: "Chat with Data", desc: "Ask questions in plain English. AI understands your dataset and responds with precise answers.", color: "#f59e0b" },
        ].map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="glass-card card-3d aurora-border group cursor-default p-6"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width;
              const y = (e.clientY - rect.top) / rect.height;
              e.currentTarget.style.transform = `perspective(800px) rotateX(${(0.5 - y) * 12}deg) rotateY(${(x - 0.5) * 12}deg)`;
              e.currentTarget.style.setProperty('--mouse-x', `${x * 100}%`);
              e.currentTarget.style.setProperty('--mouse-y', `${y * 100}%`);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
            }}
          >
            <div className="specular-highlight" />
            <div className="relative z-10">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
                style={{
                  background: `linear-gradient(135deg, ${color}20, ${color}10)`,
                  border: `1px solid ${color}30`,
                  boxShadow: `0 0 20px -8px ${color}40`,
                }}
              >
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <h3 className="font-semibold text-[#f0f0f0] text-base">{title}</h3>
              <p className="mt-2 text-sm text-[#666] leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom features row */}
      <div className="mt-8 grid gap-4 md:grid-cols-3 page-enter page-enter-stagger-6">
        {[
          { icon: Zap, label: "Lightning fast", detail: "Client-side processing" },
          { icon: Shield, label: "Privacy first", detail: "Data never leaves your browser" },
          { icon: Cpu, label: "AI-powered", detail: "Groq LLM integration" },
        ].map(({ icon: Icon, label, detail }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 transition-all hover:border-[#2a2a2a]">
            <Icon className="h-4 w-4 text-[#10b981] shrink-0" />
            <div>
              <div className="text-sm font-medium text-[#ccc]">{label}</div>
              <div className="text-[11px] text-[#555]">{detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

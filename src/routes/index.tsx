import { createFileRoute, Link } from "@tanstack/react-router";
import { Upload, Sparkles, ArrowRight, BarChart3, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="mx-auto max-w-5xl py-16">
      <div className="text-center hero-spotlight">
        <div className="page-enter page-enter-stagger-1">
          <div className="glass-card mx-auto mb-8 inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-[#71717a]">
            <Sparkles className="h-3.5 w-3.5 text-[#6366f1]" />
            Powered by AI
          </div>
        </div>
        <div className="page-enter page-enter-stagger-2">
          <h1 className="text-6xl font-bold tracking-tight md:text-7xl">
            <span className="gradient-text">AutoInsight</span>
            <span className="text-[#e8e8f0]"> AI</span>
          </h1>
        </div>
        <div className="page-enter page-enter-stagger-3">
          <p className="mt-6 text-xl text-[#71717a]">AI-Powered Data Analysis</p>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[#52525b]">
            Upload your CSV or Excel files. Get instant cleaning, exploration, and intelligence — without writing a line of code.
          </p>
        </div>

        <div className="page-enter page-enter-stagger-4">
          <Link
            to="/upload"
            className="btn-primary mt-10 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 font-semibold text-white shadow-[0_0_40px_-8px_rgba(99,102,241,0.5)] transition-transform hover:scale-105"
          >
            <Upload className="h-5 w-5" />
            Upload your data
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-20 grid gap-4 md:grid-cols-3 page-enter page-enter-stagger-5">
        {[
          { icon: Upload, title: "Smart Upload", desc: "Auto-clean CSV & Excel files instantly.", color: "#6366f1" },
          { icon: BarChart3, title: "Visual Insights", desc: "Beautiful dashboards from raw data.", color: "#06b6d4" },
          { icon: MessageSquare, title: "Chat with Data", desc: "Ask questions in plain English.", color: "#f59e0b" },
        ].map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="glass-card card-3d p-6 group cursor-default"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width;
              const y = (e.clientY - rect.top) / rect.height;
              const rotateY = (x - 0.5) * 16;
              const rotateX = (0.5 - y) * 16;
              e.currentTarget.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
              e.currentTarget.style.setProperty('--mouse-x', `${x * 100}%`);
              e.currentTarget.style.setProperty('--mouse-y', `${y * 100}%`);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
            }}
          >
            <div className="specular-highlight" />
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 0 20px -4px ${color}80` }}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-[#e8e8f0]">{title}</h3>
            <p className="mt-1 text-sm text-[#71717a]">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

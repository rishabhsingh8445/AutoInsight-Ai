import { createFileRoute, Link } from "@tanstack/react-router";
import { Upload, Sparkles, ArrowRight, BarChart3, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="mx-auto max-w-5xl py-16">
      <div className="text-center">
        <div className="glass-card mx-auto mb-8 inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Powered by AI
        </div>
        <h1 className="text-6xl font-bold tracking-tight md:text-7xl">
          <span className="gradient-text">AutoInsight</span>
          <span className="text-foreground"> AI</span>
        </h1>
        <p className="mt-6 text-xl text-muted-foreground">AI-Powered Data Analysis</p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground/80">
          Upload your CSV or Excel files. Get instant cleaning, exploration, and intelligence — without writing a line of code.
        </p>

        <Link
          to="/upload"
          className="gradient-bg mt-10 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-105"
        >
          <Upload className="h-5 w-5" />
          Upload your data
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-20 grid gap-4 md:grid-cols-3">
        {[
          { icon: Upload, title: "Smart Upload", desc: "Auto-clean CSV & Excel files instantly." },
          { icon: BarChart3, title: "Visual Insights", desc: "Beautiful dashboards from raw data." },
          { icon: MessageSquare, title: "Chat with Data", desc: "Ask questions in plain English." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="glass-card p-6">
            <div className="gradient-bg mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg">
              <Icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

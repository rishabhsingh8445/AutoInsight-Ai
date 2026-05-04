import { T as jsxRuntimeExports } from "./worker-entry-klvM4nWa.js";
import { S as Sparkles, L as Link, U as Upload, C as ChartColumn, M as MessageSquare } from "./router-UXS1IWPM.js";
import { A as ArrowRight } from "./arrow-right-xVkxWqYp.js";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
function Home() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-5xl py-16", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card mx-auto mb-8 inline-flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3.5 w-3.5 text-primary" }),
        "Powered by AI"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-6xl font-bold tracking-tight md:text-7xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "gradient-text", children: "AutoInsight" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground", children: " AI" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 text-xl text-muted-foreground", children: "AI-Powered Data Analysis" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-3 max-w-xl text-sm text-muted-foreground/80", children: "Upload your CSV or Excel files. Get instant cleaning, exploration, and intelligence — without writing a line of code." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/upload", className: "gradient-bg mt-10 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:scale-105", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-5 w-5" }),
        "Upload your data",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-20 grid gap-4 md:grid-cols-3", children: [{
      icon: Upload,
      title: "Smart Upload",
      desc: "Auto-clean CSV & Excel files instantly."
    }, {
      icon: ChartColumn,
      title: "Visual Insights",
      desc: "Beautiful dashboards from raw data."
    }, {
      icon: MessageSquare,
      title: "Chat with Data",
      desc: "Ask questions in plain English."
    }].map(({
      icon: Icon,
      title,
      desc
    }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "gradient-bg mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5 text-primary-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: desc })
    ] }, title)) })
  ] });
}
export {
  Home as component
};

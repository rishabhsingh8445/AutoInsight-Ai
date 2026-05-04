import { r as reactExports, T as jsxRuntimeExports } from "./worker-entry-klvM4nWa.js";
import { c as createLucideIcon, u as useNavigate, s as supabase, U as Upload, L as Link } from "./router-UXS1IWPM.js";
import { p as parseFile } from "./parseFile-HaCfDFIn.js";
import { u as useDataStore } from "./dataStore-A-6e1uaD.js";
import { C as CircleAlert } from "./circle-alert-ceUcu8xR.js";
import { A as ArrowRight } from "./arrow-right-xVkxWqYp.js";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "stream";
const __iconNode$1 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }]
];
const CircleCheck = createLucideIcon("circle-check", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
      key: "1oefj6"
    }
  ],
  ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5", key: "wfsgrz" }],
  ["path", { d: "M8 13h2", key: "yr2amv" }],
  ["path", { d: "M14 13h2", key: "un5t4a" }],
  ["path", { d: "M8 17h2", key: "2yhykz" }],
  ["path", { d: "M14 17h2", key: "10kma7" }]
];
const FileSpreadsheet = createLucideIcon("file-spreadsheet", __iconNode);
function LoginGate() {
  const [loading, setLoading] = reactExports.useState(false);
  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/upload`
      }
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card w-full max-w-sm p-10 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl", style: {
      background: "linear-gradient(135deg, #6366f1, #8b5cf6)"
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8 text-white", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold mb-1", children: "Login to Continue" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-8", children: "Sign in to upload and analyze your data" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: handleGoogleLogin, disabled: loading, className: "w-full flex items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 transition-all disabled:opacity-50", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "h-5 w-5", viewBox: "0 0 24 24", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fill: "#4285F4", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fill: "#34A853", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fill: "#FBBC05", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fill: "#EA4335", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })
      ] }),
      loading ? "Redirecting..." : "Continue with Google"
    ] })
  ] }) });
}
function UploadPage() {
  const [user, setUser] = reactExports.useState(null);
  const [checkingAuth, setCheckingAuth] = reactExports.useState(true);
  const [dragging, setDragging] = reactExports.useState(false);
  const [busy, setBusy] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const inputRef = reactExports.useRef(null);
  const {
    report,
    setData
  } = useDataStore();
  const navigate = useNavigate();
  reactExports.useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUser(session?.user ?? null);
    }).catch(() => {
      setUser(null);
    }).finally(() => {
      setCheckingAuth(false);
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);
  const handleFile = reactExports.useCallback(async (file) => {
    setBusy(true);
    setError(null);
    try {
      const {
        columns,
        rows,
        report: report2
      } = await parseFile(file);
      setData(columns, rows, report2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse file");
    } finally {
      setBusy(false);
    }
  }, [setData]);
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void handleFile(f);
  };
  if (checkingAuth) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground text-sm", children: "Loading..." }) });
  }
  if (!user) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(LoginGate, {});
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl py-12", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-4xl font-bold", children: [
      "Upload ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "gradient-text", children: "data" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground", children: "CSV or Excel — we'll clean it automatically." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onDragOver: (e) => {
      e.preventDefault();
      setDragging(true);
    }, onDragLeave: () => setDragging(false), onDrop, onClick: () => inputRef.current?.click(), className: `glass-card mt-8 cursor-pointer p-12 text-center transition-all ${dragging ? "border-primary/60 bg-primary/5 scale-[1.01]" : "hover:border-white/20"}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: inputRef, type: "file", accept: ".csv,.xlsx,.xls", className: "hidden", onChange: (e) => {
        const f = e.target.files?.[0];
        if (f) void handleFile(f);
      } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "gradient-bg mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-[var(--shadow-glow)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-8 w-8 text-primary-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-6 text-lg font-semibold", children: busy ? "Processing..." : "Drop your file here" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "or click to browse — .csv, .xlsx, .xls" })
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card mt-6 flex items-start gap-3 border-destructive/40 p-4 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mt-0.5 h-4 w-4 text-destructive" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: error })
    ] }),
    report && !busy && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card mt-6 p-6 animate-fade-in", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-5 w-5 text-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold", children: "Data Quality Report" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 flex items-center gap-2 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FileSpreadsheet, { className: "h-4 w-4" }),
        " ",
        report.fileName
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 grid grid-cols-2 gap-3 md:grid-cols-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Original rows", value: report.originalRows }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Cleaned rows", value: report.cleanedRows, highlight: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Columns", value: report.columns }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Issues fixed", value: report.emptyRowsRemoved + report.duplicatesRemoved })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid gap-2 text-sm text-muted-foreground md:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-white/5 bg-white/5 px-3 py-2", children: [
          "Empty rows removed: ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-foreground", children: report.emptyRowsRemoved })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-white/5 bg-white/5 px-3 py-2", children: [
          "Duplicates removed: ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-foreground", children: report.duplicatesRemoved })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => navigate({
        to: "/tables"
      }), className: "gradient-bg mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-primary-foreground", children: [
        "View data ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/dashboard", className: "ml-2 inline-flex items-center gap-2 rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium hover:bg-white/5", children: "Open dashboard" })
    ] })
  ] });
}
function Stat({
  label,
  value,
  highlight
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-xl border border-white/10 p-4 ${highlight ? "bg-primary/10" : "bg-white/5"}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase tracking-wider text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `mt-1 text-2xl font-bold ${highlight ? "gradient-text" : ""}`, children: value.toLocaleString() })
  ] });
}
export {
  UploadPage as component
};

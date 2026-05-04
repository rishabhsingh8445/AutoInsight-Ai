import { r as reactExports, T as jsxRuntimeExports } from "./worker-entry-klvM4nWa.js";
import { u as useDataStore, a as useSettingsStore } from "./dataStore-A-6e1uaD.js";
import { c as cn, M as MissingKeysBanner, B as Button } from "./button-C7dPF7cb.js";
import { c as createLucideIcon, M as MessageSquare, S as Sparkles } from "./router-UXS1IWPM.js";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "./clsx-DgYk2OaC.js";
const __iconNode = [
  [
    "path",
    {
      d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",
      key: "1ffxy3"
    }
  ],
  ["path", { d: "m21.854 2.147-10.94 10.939", key: "12cjpa" }]
];
const Send = createLucideIcon("send", __iconNode);
const Input = reactExports.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type,
        className: cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";
function renderMarkdown(text) {
  return text.split("\n").map((line, i) => {
    const formatted = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`(.+?)`/g, "<code class='bg-white/10 px-1 rounded text-xs'>$1</code>");
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { dangerouslySetInnerHTML: {
      __html: formatted
    }, className: "block" }, i);
  });
}
function ChatPage() {
  const {
    columns,
    rows
  } = useDataStore();
  const {
    groqKey
  } = useSettingsStore();
  const [messages, setMessages] = reactExports.useState([]);
  const [input, setInput] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const scrollRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, loading]);
  const missing = !groqKey ? ["Groq"] : [];
  const hasData = columns.length > 0 && rows.length > 0;
  const send = async () => {
    if (!input.trim() || loading) return;
    if (!groqKey) {
      setError("Add your Groq API key in Settings.");
      return;
    }
    if (!hasData) {
      setError("Please upload a dataset first");
      return;
    }
    setError(null);
    const userMsg = {
      role: "user",
      content: input.trim()
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    const sample = rows.slice(0, 20);
    const system = `You are a helpful data analyst. The user has uploaded a dataset with these columns: ${JSON.stringify(columns)}.
Here are the first 20 rows as JSON:
${JSON.stringify(sample)}
Answer questions about this data clearly and concisely. Use plain text formatting only — no markdown asterisks or symbols.`;
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{
            role: "system",
            content: system
          }, ...next.map((m) => ({
            role: m.role,
            content: m.content
          }))]
        })
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Groq error ${res.status}: ${t.slice(0, 200)}`);
      }
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content ?? "(no response)";
      setMessages((m) => [...m, {
        role: "assistant",
        content: reply
      }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-[calc(100vh-4rem)] flex-col py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "Chat" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Ask questions about your data in plain English." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MissingKeysBanner, { missing }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "glass-card mt-2 flex flex-1 flex-col overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: scrollRef, className: "flex-1 space-y-4 overflow-y-auto p-6", children: [
        messages.length === 0 && !loading && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-full flex-col items-center justify-center text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "gradient-bg flex h-14 w-14 items-center justify-center rounded-2xl shadow-[var(--shadow-glow)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-7 w-7 text-primary-foreground" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-lg font-semibold", children: hasData ? "Ask anything about your dataset" : "Please upload a dataset first" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 max-w-md text-sm text-muted-foreground", children: hasData ? `${rows.length.toLocaleString()} rows · ${columns.length} columns ready to analyze.` : "Head to Upload to add a CSV or Excel file." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3 w-3" }),
            " Powered by Groq"
          ] })
        ] }),
        messages.map((m, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex ${m.role === "user" ? "justify-end" : "justify-start"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "gradient-bg text-primary-foreground" : "border border-white/10 bg-white/5 text-foreground"}`, children: m.role === "assistant" ? renderMarkdown(m.content) : m.content }) }, i)),
        loading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-start", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 animate-bounce rounded-full bg-primary" })
        ] }) })
      ] }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-destructive/30 bg-destructive/10 px-6 py-2 text-xs text-destructive", children: error }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 border-t border-white/10 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }, placeholder: hasData ? "Ask about your data..." : "Upload a dataset to start chatting", disabled: loading }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: send, disabled: loading || !input.trim(), className: "gradient-bg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" }) })
      ] })
    ] })
  ] });
}
export {
  ChatPage as component
};

import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { Send, MessageSquare, Sparkles } from "lucide-react";
import { useDataStore } from "@/store/dataStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
});

type Msg = { role: "user" | "assistant"; content: string };

// XSS-safe markdown renderer — no dangerouslySetInnerHTML
// AI messages get word-by-word fade-in
function SafeMarkdown({ text, animate }: { text: string; animate?: boolean }) {
  if (animate) {
    const words = text.split(/(\s+)/);
    let wordIndex = 0;
    return (
      <span className="space-y-0.5">
        {text.split("\n").map((line, i) => {
          const lineWords = line.split(/(\s+)/);
          return (
            <span key={i} className="block">
              {lineWords.map((word, j) => {
                const currentIndex = wordIndex++;
                if (/^\s+$/.test(word)) return <span key={j}>{word}</span>;
                return (
                  <span
                    key={j}
                    className="ai-word"
                    style={{ animationDelay: `${currentIndex * 30}ms` }}
                  >
                    {formatWord(word)}
                  </span>
                );
              })}
            </span>
          );
        })}
      </span>
    );
  }

  return (
    <span className="space-y-0.5">
      {text.split("\n").map((line, i) => {
        const parts: React.ReactNode[] = [];
        let remaining = line;
        let key = 0;

        // Parse bold (**text**), italic (*text*), inline code (`text`)
        const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
        let lastIndex = 0;
        let match;

        pattern.lastIndex = 0;
        while ((match = pattern.exec(remaining)) !== null) {
          if (match.index > lastIndex) {
            parts.push(<span key={key++}>{remaining.slice(lastIndex, match.index)}</span>);
          }
          if (match[0].startsWith("**")) {
            parts.push(<strong key={key++}>{match[2]}</strong>);
          } else if (match[0].startsWith("`")) {
            parts.push(
              <code key={key++} className="bg-white/[0.06] px-1.5 py-0.5 rounded text-xs font-mono text-cyan-400">
                {match[4]}
              </code>
            );
          } else {
            parts.push(<em key={key++}>{match[3]}</em>);
          }
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < remaining.length) {
          parts.push(<span key={key++}>{remaining.slice(lastIndex)}</span>);
        }

        return <span key={i} className="block">{parts}</span>;
      })}
    </span>
  );
}

function formatWord(word: string): React.ReactNode {
  if (word.startsWith("**") && word.endsWith("**")) {
    return <strong>{word.slice(2, -2)}</strong>;
  }
  if (word.startsWith("`") && word.endsWith("`")) {
    return <code className="bg-white/[0.06] px-1 rounded text-xs font-mono text-cyan-400">{word.slice(1, -1)}</code>;
  }
  return word;
}

/**
 * Builds a rich dataset context for the LLM without hitting token limits.
 * Strategy:
 *  - Column-level stats (min, max, mean, nulls, top values) for ALL columns
 *  - Up to 40 sample rows: first 20 + last 10 + 10 random from middle
 *  - Total row count always included so AI knows full dataset size
 */
function buildDataContext(
  columns: string[],
  rows: Record<string, unknown>[]
): string {
  const totalRows = rows.length;

  // Column stats
  const colStats = columns.map((col) => {
    const vals = rows.map((r) => r[col]);
    const nonNull = vals.filter((v) => v !== null && v !== "" && v !== undefined);
    const nullCount = totalRows - nonNull.length;
    const numeric = nonNull.filter((v) => !isNaN(Number(v))).map(Number);
    const isNumeric = numeric.length > nonNull.length * 0.7;

    if (isNumeric && numeric.length > 0) {
      const sorted = [...numeric].sort((a, b) => a - b);
      const mean = numeric.reduce((a, b) => a + b, 0) / numeric.length;
      const median = sorted[Math.floor(sorted.length / 2)];
      return {
        name: col,
        type: "numeric",
        count: nonNull.length,
        nulls: nullCount,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        mean: Math.round(mean * 100) / 100,
        median,
      };
    } else {
      const freq: Record<string, number> = {};
      nonNull.forEach((v) => {
        const k = String(v);
        freq[k] = (freq[k] ?? 0) + 1;
      });
      const topValues = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([v, c]) => `${v.length > 30 ? v.substring(0, 30) + "..." : v}(${c})`);
      const uniqueCount = Object.keys(freq).length;
      return {
        name: col,
        type: "categorical",
        count: nonNull.length,
        nulls: nullCount,
        uniqueValues: uniqueCount,
        topValues,
      };
    }
  });

  // Minimal row sampling: just first 3 rows with truncated strings to save tokens
  const sampleRows = rows.slice(0, 3).map(r => {
    const truncated: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) {
      truncated[k] = typeof v === 'string' && v.length > 50 ? v.substring(0, 50) + '...' : v;
    }
    return truncated;
  });

  return `Dataset overview:
- Total rows: ${totalRows.toLocaleString()}
- Columns (${columns.length}): ${columns.join(", ")}

Column statistics (computed over ALL ${totalRows} rows):
${JSON.stringify(colStats, null, 2)}

Sample rows (${sampleRows.length} rows):
${JSON.stringify(sampleRows)}`;
}

function ChatPage() {
  const { columns, rows } = useDataStore();
  const groqKey = import.meta.env.VITE_GROQ_API_KEY || "";
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestAiIndex, setLatestAiIndex] = useState<number>(-1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const hasData = columns.length > 0 && rows.length > 0;

  const send = async () => {
    if (!input.trim() || loading) return;
    if (!hasData) { setError("Please upload a dataset first"); return; }
    setError(null);
    const userMsg: Msg = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    const dataContext = buildDataContext(columns, rows);
    const system = `You are a helpful data analyst. The user has uploaded a dataset.
${dataContext}

Answer questions about this data clearly and concisely.
When the user asks about counts, averages, distributions or trends — use the column statistics above which reflect the FULL dataset.
Use plain text formatting only — no markdown asterisks or symbols.`;

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: system },
            ...next.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Groq error ${res.status}: ${t.slice(0, 200)}`);
      }
      const data = await res.json();
      const reply: string = data.choices?.[0]?.message?.content ?? "(no response)";
      setMessages((m) => {
        setLatestAiIndex(m.length);
        return [...m, { role: "assistant", content: reply }];
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="about page chat-layout">
      <div className="page__hero about__hero page-enter">
        <div className="about__badge"><span>Assistant</span></div>
        <h1 className="about__title">Data <span className="about__titleAccent">chat</span></h1>
        <p className="about__lead">Ask questions about your data in plain English.</p>
      </div>



      <div className="glass-card mt-2 flex flex-1 flex-col overflow-hidden page-enter page-enter-stagger-3">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.length === 0 && !loading && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg shadow-[0_0_40px_-8px_rgba(52,211,153,0.45)]">
                <MessageSquare className="h-7 w-7 text-[#050508]" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                {hasData ? "Ask anything about your dataset" : "Please upload a dataset first"}
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {hasData
                  ? `${rows.length.toLocaleString()} rows · ${columns.length} columns ready to analyze.`
                  : "Head to Upload to add a CSV or Excel file."}
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <Sparkles className="h-3 w-3" /> Powered by Groq
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "chat-user-bubble text-foreground"
                    : "chat-assistant-bubble text-foreground/90"
                }`}
              >
                {m.role === "assistant"
                  ? <SafeMarkdown text={m.content} animate={i === latestAiIndex} />
                  : m.content
                }
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-1.5 rounded-2xl chat-assistant-bubble px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#10b981] [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#06b6d4] [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#a855f7]" />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="border-t border-red-500/30 bg-[#f43f5e]/10 px-6 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-2 border-t border-border p-4 chat-input-glow">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={hasData ? "Ask about your data..." : "Upload a dataset to start chatting"}
            disabled={loading}
            className="border-border bg-white/[0.04] text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:ring-[#10b981]/20"
          />
          <Button onClick={send} disabled={loading || !input.trim()}
            className="btn-primary text-white border-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  Upload as UploadIcon, FileSpreadsheet, CheckCircle2,
  AlertCircle, ArrowRight, Clock, Trash2, RefreshCw,
} from "lucide-react";
import { parseFile } from "@/lib/parseFile";
import { useDataStore } from "@/store/dataStore";
import {
  supabase,
  uploadFileToStorage,
  saveDatasetMetadata,
  fetchUserDatasets,
  downloadDatasetFile,
  deleteDataset,
  cleanupExpiredDatasets,
  hoursUntilExpiry,
  type DatasetRecord,
} from "@/lib/supabase";

export const Route = createFileRoute("/upload")({
  component: UploadPage,
});

function LoginGate() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/upload` },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card card-3d w-full max-w-sm p-10 text-center"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width;
          const y = (e.clientY - r.top) / r.height;
          e.currentTarget.style.transform = `perspective(800px) rotateX(${(0.5 - y) * 10}deg) rotateY(${(x - 0.5) * 10}deg)`;
          e.currentTarget.style.setProperty('--mouse-x', `${x * 100}%`);
          e.currentTarget.style.setProperty('--mouse-y', `${y * 100}%`);
        }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'perspective(800px) rotateX(0) rotateY(0)'; }}
      >
        <div className="specular-highlight" />
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl relative z-10"
          style={{ background: "linear-gradient(135deg, #10b981, #22d3ee)", boxShadow: "0 0 40px -8px rgba(16,185,129,0.5)" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-1 text-[#f0f0f0] relative z-10">Login to Continue</h1>
        <p className="text-sm text-[#888] mb-8 relative z-10">Sign in to upload and analyze your data</p>
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="relative z-10 w-full flex items-center justify-center gap-3 rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-sm font-medium text-white hover:bg-[#111111] transition-all disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? "Redirecting..." : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}

function UploadPage() {
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");

  const [history, setHistory] = useState<DatasetRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const { report, setData, clear, columns } = useDataStore();
  const hasExistingData = columns.length > 0;
  const navigate = useNavigate();

  // Auth
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setUser(session?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setCheckingAuth(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load history + cleanup expired on login
  useEffect(() => {
    if (!user) return;
    setHistoryLoading(true);
    // Silently clean expired records first, then fetch fresh list
    cleanupExpiredDatasets(user.id)
      .then(() => fetchUserDatasets(user.id))
      .then(setHistory)
      .finally(() => setHistoryLoading(false));
  }, [user]);

  const handleFile = useCallback(
    async (file: File) => {
      if (!user) return;
      setBusy(true);
      setError(null);
      setCloudStatus("idle");

      try {
        // Step 1: parse + clean locally
        const { columns, rows, report } = await parseFile(file);
        setData(columns, rows, report);

        // Step 2: upload to Supabase Storage
        setCloudStatus("saving");
        const storagePath = await uploadFileToStorage(file, user.id);

        if (storagePath) {
          // Step 3: save metadata to DB
          const record = await saveDatasetMetadata({
            userId: user.id,
            fileName: file.name,
            storagePath,
            rowCount: rows.length,
            columnCount: columns.length,
            columns,
          });
          if (record) {
            setHistory(prev => [record, ...prev]);
            setCloudStatus("saved");
          } else {
            setCloudStatus("failed");
          }
        } else {
          setCloudStatus("failed");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to parse file");
        setCloudStatus("failed");
      } finally {
        setBusy(false);
      }
    },
    [user, setData],
  );

  const handleFileWithConfirm = useCallback(
    (file: File) => {
      if (hasExistingData && report) {
        if (!window.confirm(`Replace "${report.fileName}" with "${file.name}"?`)) return;
      }
      void handleFile(file);
    },
    [hasExistingData, report, handleFile],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileWithConfirm(f);
  };

  const handleLoadFromHistory = async (record: DatasetRecord) => {
    setLoadingId(record.id);
    setError(null);
    try {
      const file = await downloadDatasetFile(record.storage_path, record.file_name);
      if (!file) throw new Error("Could not download file from cloud.");
      const { columns, rows, report } = await parseFile(file);
      setData(columns, rows, report);
      navigate({ to: "/tables" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dataset");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (record: DatasetRecord) => {
    if (!window.confirm(`Delete "${record.file_name}" from your history?`)) return;
    setDeletingId(record.id);
    const ok = await deleteDataset(record.id, record.storage_path);
    if (ok) {
      setHistory(prev => prev.filter(r => r.id !== record.id));
    } else {
      setError("Failed to delete dataset.");
    }
    setDeletingId(null);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#888] text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) return <LoginGate />;

  return (
    <div className="mx-auto max-w-3xl py-12">
      <div className="page-enter page-enter-stagger-1 hero-spotlight">
        <h1 className="text-4xl font-bold text-[#f0f0f0]">Upload <span className="gradient-text">data</span></h1>
        <p className="mt-2 text-[#888]">CSV or Excel — we'll clean it and save it to your account.</p>
      </div>

      {/* Existing data banner */}
      {hasExistingData && !report && (
        <div className="glass-card mt-6 flex items-center justify-between gap-4 border-[#10b981]/20 px-5 py-4 page-enter page-enter-stagger-2">
          <div className="flex items-center gap-3 text-sm">
            <FileSpreadsheet className="h-4 w-4 text-[#10b981] shrink-0" />
            <span className="text-[#888]">
              Dataset loaded: <span className="font-medium text-[#f0f0f0]">{columns.length} columns</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate({ to: "/tables" })} className="text-xs text-[#10b981] hover:underline">
              View data
            </button>
            <span className="text-[#1a1a1a]">·</span>
            <button
              onClick={() => { if (window.confirm("Clear existing dataset?")) clear(); }}
              className="text-xs text-[#f43f5e] hover:text-[#fb7185]"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Drop zone with rotating dashed border */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`upload-zone glass-card mt-8 cursor-pointer p-12 text-center rounded-2xl transition-all page-enter page-enter-stagger-3 ${dragging ? "dragging" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileWithConfirm(f); }}
        />
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl upload-icon"
          style={{ background: "linear-gradient(135deg, #10b981, #22d3ee)", boxShadow: "0 0 40px -8px rgba(16,185,129,0.5)" }}
        >
          <UploadIcon className="h-8 w-8 text-white" />
        </div>
        <h3 className="mt-6 text-lg font-semibold text-[#f0f0f0]">
          {busy ? "Processing..." : "Drop your file here"}
        </h3>
        <p className="mt-1 text-sm text-[#888]">or click to browse — .csv, .xlsx, .xls</p>
      </div>

      {/* Cloud save status */}
      {cloudStatus === "saving" && (
        <div className="mt-4 flex items-center gap-2 text-sm text-[#888]">
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#10b981]" /> Saving to cloud...
        </div>
      )}
      {cloudStatus === "saved" && (
        <div className="mt-4 flex items-center gap-2 text-sm text-[#10b981]">
          <CheckCircle2 className="h-3.5 w-3.5" /> Saved to your account
        </div>
      )}
      {cloudStatus === "failed" && (
        <div className="mt-4 flex items-center gap-2 text-sm text-[#f59e0b]">
          <AlertCircle className="h-3.5 w-3.5" /> Cloud save failed — data available locally only
        </div>
      )}

      {/* Parse error */}
      {error && (
        <div className="glass-card mt-6 flex items-start gap-3 border-[#f43f5e]/40 p-4 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 text-[#f43f5e]" />
          <span className="text-[#f0f0f0]">{error}</span>
        </div>
      )}

      {/* Quality report */}
      {report && !busy && (
        <div className="glass-card mt-6 p-6 page-enter page-enter-stagger-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#10b981]" />
            <h2 className="text-lg font-semibold text-[#f0f0f0]">Data Quality Report</h2>
          </div>
          <p className="mt-1 flex items-center gap-2 text-sm text-[#888]">
            <FileSpreadsheet className="h-4 w-4" /> {report.fileName}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Original rows" value={report.originalRows} />
            <Stat label="Cleaned rows" value={report.cleanedRows} highlight />
            <Stat label="Columns" value={report.columns} />
            <Stat label="Issues fixed" value={report.emptyRowsRemoved + report.duplicatesRemoved} />
          </div>

          <div className="mt-4 grid gap-2 text-sm text-[#999] md:grid-cols-2">
            <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2">
              Empty rows removed: <span className="font-mono text-[#06b6d4]">{report.emptyRowsRemoved}</span>
            </div>
            <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2">
              Duplicates removed: <span className="font-mono text-[#06b6d4]">{report.duplicatesRemoved}</span>
            </div>
          </div>

          <button
            onClick={() => navigate({ to: "/tables" })}
            className="btn-primary mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-black"
          >
            View data <ArrowRight className="h-4 w-4" />
          </button>
          <Link to="/dashboard" className="ml-2 inline-flex items-center gap-2 rounded-lg border border-[#1a1a1a] px-5 py-2.5 text-sm font-medium text-[#999] hover:bg-[#111111] hover:text-white transition-all">
            Open dashboard
          </Link>
        </div>
      )}

      {/* Dataset history */}
      <div className="mt-10 page-enter page-enter-stagger-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[#f0f0f0]">
          <Clock className="h-4 w-4 text-[#10b981]" /> Your previous uploads
        </h2>

        {historyLoading && (
          <div className="mt-4 text-sm text-[#888]">Loading history...</div>
        )}

        {!historyLoading && history.length === 0 && (
          <p className="mt-4 text-sm text-[#555]">
            No uploads yet — your datasets will appear here after upload.
          </p>
        )}

        {!historyLoading && history.length > 0 && (
          <div className="mt-4 space-y-3">
            {history.map(record => (
              <div key={record.id} className="glass-card flex items-center justify-between gap-4 px-5 py-4 transition-all hover:border-[#2a2a2a]">
                <div className="flex items-center gap-3 min-w-0">
                  <FileSpreadsheet className="h-4 w-4 text-[#10b981] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate text-[#f0f0f0]">{record.file_name}</div>
                    <div className="text-xs text-[#888] mt-0.5 font-mono">
                      {record.row_count.toLocaleString()} rows · {record.column_count} columns · {new Date(record.uploaded_at).toLocaleDateString()}
                    </div>
                    <div className={`mt-1 text-[10px] font-medium font-mono ${
                      hoursUntilExpiry(record) <= 6
                        ? "text-[#f43f5e]"
                        : hoursUntilExpiry(record) <= 24
                        ? "text-[#f59e0b]"
                        : "text-[#555]"
                    }`}>
                      ⏳ {hoursUntilExpiry(record) > 0
                        ? `Deletes in ${hoursUntilExpiry(record)}h`
                        : "Expiring soon"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleLoadFromHistory(record)}
                    disabled={loadingId === record.id}
                    className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
                  >
                    {loadingId === record.id
                      ? <><RefreshCw className="h-3 w-3 animate-spin" /> Loading...</>
                      : <>Load</>
                    }
                  </button>
                  <button
                    onClick={() => handleDelete(record)}
                    disabled={deletingId === record.id}
                    className="rounded-lg border border-[#1a1a1a] p-1.5 text-[#888] hover:text-[#f43f5e] hover:border-[#f43f5e]/30 transition-all disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border border-[#1a1a1a] p-4 card-3d ${highlight ? "bg-[#10b981]/10" : "bg-[#0a0a0a]"}`}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        e.currentTarget.style.transform = `perspective(800px) rotateX(${(0.5 - y) * 12}deg) rotateY(${(x - 0.5) * 12}deg)`;
      }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'perspective(800px) rotateX(0) rotateY(0)'; }}
    >
      <div className="text-xs uppercase tracking-wider text-[#555] font-mono">{label}</div>
      <div className={`mt-1 text-2xl font-bold font-mono ${highlight ? "text-[#10b981]" : "text-[#06b6d4]"}`}>{value.toLocaleString()}</div>
    </div>
  );
}

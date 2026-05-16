import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "placeholder_key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DatasetRecord {
  id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  row_count: number;
  column_count: number;
  columns: string[];
  uploaded_at: string;
  expires_at: string;
}

/** Returns hours remaining until expiry. Negative = already expired. */
export function hoursUntilExpiry(record: DatasetRecord): number {
  const diff = new Date(record.expires_at).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60));
}

/**
 * Deletes expired records from DB + Storage.
 * Call this on login — runs silently in background.
 */
export async function cleanupExpiredDatasets(userId: string): Promise<void> {
  const now = new Date().toISOString();
  const { data: expired } = await supabase
    .from("datasets")
    .select("id, storage_path")
    .eq("user_id", userId)
    .lt("expires_at", now);

  if (!expired || expired.length === 0) return;

  const paths = expired.map((r: { storage_path: string }) => r.storage_path);
  const ids = expired.map((r: { id: string }) => r.id);

  await Promise.all([
    supabase.storage.from("datasets").remove(paths),
    supabase.from("datasets").delete().in("id", ids),
  ]);
}

// ── Storage helpers ───────────────────────────────────────────────────────────

export async function uploadFileToStorage(
  file: File,
  userId: string
): Promise<string | null> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${timestamp}_${safeName}`;

  const { error } = await supabase.storage
    .from("datasets")
    .upload(path, file, { upsert: false });

  if (error) { console.error("Storage upload failed:", error.message); return null; }
  return path;
}

export async function downloadDatasetFile(
  storagePath: string,
  fileName: string
): Promise<File | null> {
  const { data, error } = await supabase.storage
    .from("datasets")
    .download(storagePath);

  if (error || !data) { console.error("Storage download failed:", error?.message); return null; }
  return new File([data], fileName);
}

// ── Database helpers ──────────────────────────────────────────────────────────

export async function saveDatasetMetadata(params: {
  userId: string;
  fileName: string;
  storagePath: string;
  rowCount: number;
  columnCount: number;
  columns: string[];
}): Promise<DatasetRecord | null> {
  const { data, error } = await supabase
    .from("datasets")
    .insert({
      user_id: params.userId,
      file_name: params.fileName,
      storage_path: params.storagePath,
      row_count: params.rowCount,
      column_count: params.columnCount,
      columns: params.columns,
    })
    .select()
    .single();

  if (error) { console.error("DB insert failed:", error.message); return null; }
  return data as DatasetRecord;
}

export async function fetchUserDatasets(userId: string): Promise<DatasetRecord[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("datasets")
    .select("*")
    .eq("user_id", userId)
    .gt("expires_at", now)           // only non-expired
    .order("uploaded_at", { ascending: false });

  if (error) { console.error("DB fetch failed:", error.message); return []; }
  return (data ?? []) as DatasetRecord[];
}

export async function deleteDataset(
  id: string,
  storagePath: string
): Promise<boolean> {
  const [{ error: dbError }, { error: storageError }] = await Promise.all([
    supabase.from("datasets").delete().eq("id", id),
    supabase.storage.from("datasets").remove([storagePath]),
  ]);
  if (dbError) console.error("DB delete failed:", dbError.message);
  if (storageError) console.error("Storage delete failed:", storageError.message);
  return !dbError && !storageError;
}
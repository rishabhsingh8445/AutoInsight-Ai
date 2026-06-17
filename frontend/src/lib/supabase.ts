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

// ── Python API Fetchers ──────────────────────────────────────────────────────

export async function cleanupExpiredDatasets() {
  // Can be implemented similarly in python if needed. For now, handled internally or omitted.
  return true;
}

export async function uploadFileToStorage(formData: FormData) {
  const res = await fetch("/api/datasets/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data;
}

export async function fetchUserDatasets() {
  const res = await fetch("/api/datasets/fetch", { credentials: "include" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.datasets as DatasetRecord[];
}

export async function deleteDataset(params: { id: string, storagePath: string }) {
  const res = await fetch("/api/datasets/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    credentials: "include",
  });
  return res.ok;
}

export async function downloadDatasetFile(params: { storagePath: string, fileName: string }) {
  const res = await fetch("/api/datasets/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    credentials: "include",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.base64Data;
}
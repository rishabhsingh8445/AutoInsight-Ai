import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { QualityReport, Row } from "@/store/dataStore";

function normalizeColumnName(col: string): string {
  return col
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\w\S*/g, (word) =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
}

function normalizeValue(val: unknown): unknown {
  if (val === null || val === undefined) return "";
  const str = String(val).trim();
  if (str === "") return "";
  if (isNaN(Number(str)) && str.length < 50) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
  return str;
}

function clean(rawRows: Row[], rawColumns: string[], fileName: string) {
  const original = rawRows.length;
  const columns = rawColumns.map(normalizeColumnName);
  const colMap: Record<string, string> = {};
  rawColumns.forEach((raw, i) => { colMap[raw] = columns[i]; });

  const renamedRows: Row[] = rawRows.map(r => {
    const newRow: Row = {};
    rawColumns.forEach(raw => { newRow[colMap[raw]] = normalizeValue(r[raw]); });
    return newRow;
  });

  const nonEmpty = renamedRows.filter(r =>
    columns.some(c => {
      const v = r[c];
      return v !== null && v !== undefined && String(v).trim() !== "";
    })
  );
  const emptyRowsRemoved = original - nonEmpty.length;

  const seen = new Set<string>();
  const deduped: Row[] = [];
  for (const r of nonEmpty) {
    const key = columns.map(c => String(r[c] ?? "")).join("|");
    if (!seen.has(key)) { seen.add(key); deduped.push(r); }
  }
  const duplicatesRemoved = nonEmpty.length - deduped.length;

  const report: QualityReport = {
    originalRows: original,
    cleanedRows: deduped.length,
    columns: columns.length,
    emptyRowsRemoved,
    duplicatesRemoved,
    fileName,
  };

  return { rows: deduped, columns, report };
}

export async function parseFile(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") {
    return new Promise<{ rows: Row[]; columns: string[]; report: QualityReport }>(
      (resolve, reject) => {
        Papa.parse<Row>(file, {
          header: true,
          skipEmptyLines: false,
          complete: (res) => {
            const cols = res.meta.fields ?? [];
            resolve(clean(res.data, cols, file.name));
          },
          error: reject,
        });
      }
    );
  }
  if (ext === "xlsx" || ext === "xls") {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Row>(ws, { defval: "" });
    const cols = json.length ? Object.keys(json[0]) : [];
    return clean(json, cols, file.name);
  }
  throw new Error("Unsupported file type. Please upload CSV or Excel.");
}

export async function downloadCSV(columns: string[], rows: Row[], fileName = "cleaned_data.xlsx") {
  const ExcelJS = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Cleaned Data");

  // Detect numeric columns
  const numericCols = new Set(
    columns.filter(col => {
      const vals = rows.slice(0, 20).map(r => r[col]);
      return vals.filter(v => v !== null && v !== "" && !isNaN(Number(v))).length > 12;
    })
  );

  // Per-column min/max
  const colStats: Record<string, { min: number; max: number }> = {};
  numericCols.forEach(col => {
    const vals = rows.map(r => Number(r[col])).filter(v => !isNaN(v));
    if (vals.length) colStats[col] = { min: Math.min(...vals), max: Math.max(...vals) };
  });

  // Header row
  ws.addRow(columns);
  const headerRow = ws.getRow(1);
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6366F1" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  headerRow.height = 20;

  // Auto column width
  ws.columns = columns.map(col => {
    const maxLen = Math.max(col.length, ...rows.slice(0, 100).map(r => String(r[col] ?? "").length));
    return { header: col, key: col, width: Math.min(maxLen + 2, 30) };
  });

  // Data rows with conditional formatting
  rows.forEach(r => {
    const rowData = columns.map(c => r[c] ?? "");
    const excelRow = ws.addRow(rowData);

    columns.forEach((col, i) => {
      const cell = excelRow.getCell(i + 1);
      cell.alignment = { vertical: "middle" };

      if (numericCols.has(col)) {
        const stats = colStats[col];
        if (stats && stats.max !== stats.min) {
          const num = Number(r[col]);
          if (!isNaN(num)) {
            const ratio = (num - stats.min) / (stats.max - stats.min);
            let argb = "FFEF4444"; // red
            if (ratio >= 0.75) argb = "FF22C55E"; // green
            else if (ratio >= 0.45) argb = "FFEAB308"; // yellow
            cell.font = { color: { argb } };
          }
        }
      }
    });
  });

  // Download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.replace(".csv", ".xlsx");
  a.click();
  URL.revokeObjectURL(url);
}
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Row = Record<string, unknown>;

export interface QualityReport {
  originalRows: number;
  cleanedRows: number;
  columns: number;
  emptyRowsRemoved: number;
  duplicatesRemoved: number;
  fileName: string;
}

interface DataState {
  columns: string[];
  rows: Row[];
  report: QualityReport | null;
  setData: (columns: string[], rows: Row[], report: QualityReport) => void;
  clear: () => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      columns: [],
      rows: [],
      report: null,
      setData: (columns, rows, report) => set({ columns, rows, report }),
      clear: () => set({ columns: [], rows: [], report: null }),
    }),
    {
      name: "autoinsight-data",
      // Large datasets can exceed localStorage limits (~5MB).
      // Only persist report + columns; rows are re-hydrated if under 2000.
      // If you expect huge files, remove partialize and accept the risk.
      partialize: (state) => ({
        columns: state.columns,
        report: state.report,
        // Skip rows if dataset is very large to avoid localStorage quota errors
        rows: state.rows.length <= 5000 ? state.rows : [],
      }),
    }
  )
);

interface SettingsState {
  groqKey: string;
  setGroqKey: (groq: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      groqKey: import.meta.env.VITE_GROQ_API_KEY ?? "",
      setGroqKey: (groq) => set({ groqKey: groq }),
    }),
    {
      name: "autoinsight-settings",
      merge: (persistedState: any, currentState: SettingsState) => ({
        ...currentState,
        ...persistedState,
        groqKey: import.meta.env.VITE_GROQ_API_KEY || persistedState.groqKey || "",
      }),
    }
  )
);

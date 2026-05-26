import { create } from "zustand";
import { AnalysisResult } from "../types";
import { results } from "../data/mockData";

interface AppStore {
  results: AnalysisResult[];
  setResults: (results: AnalysisResult[]) => void;
  addResult: (result: AnalysisResult) => void;
  updateStatus: (id: string, status: AnalysisResult["status"]) => void;
  removeResult: (id: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  results: JSON.parse(localStorage.getItem("truthguard_results") || "null") || results,

  setResults: (results) => {
    localStorage.setItem("truthguard_results", JSON.stringify(results));
    set({ results });
  },

  addResult: (result) =>
    set((state) => {
      const next = [result, ...state.results];

      localStorage.setItem("truthguard_results", JSON.stringify(next));

      return { results: next };
    }),

  updateStatus: (id, status) =>
    set((state) => {
      const next = state.results.map((item) =>
        item.id === id ? { ...item, status } : item
      );

      localStorage.setItem("truthguard_results", JSON.stringify(next));

      return { results: next };
    }),

  removeResult: (id) =>
    set((state) => {
      const next = state.results.filter((item) => item.id !== id);

      localStorage.setItem("truthguard_results", JSON.stringify(next));

      return { results: next };
    }),
}));
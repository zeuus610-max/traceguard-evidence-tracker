import { create } from 'zustand'

export const useStore = create((set, get) => ({
  // Active tab
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Evidence files
  evidenceFiles: {},
  uploadEvidence: (id, data, columns, filename) => set((state) => ({
    evidenceFiles: {
      ...state.evidenceFiles,
      [id]: { data, columns, filename, uploadedAt: new Date().toISOString(), rowCount: data.length }
    }
  })),
  removeEvidence: (id) => set((state) => {
    const copy = { ...state.evidenceFiles }
    delete copy[id]
    return { evidenceFiles: copy }
  }),

  // Normalized data
  normalizedData: {},
  setNormalizedData: (id, data) => set((state) => ({
    normalizedData: { ...state.normalizedData, [id]: data }
  })),

  // E05 drift offset (seconds)
  driftOffset: 0,
  setDriftOffset: (v) => set({ driftOffset: v }),

  // Anomalies
  anomalies: [],
  setAnomalies: (a) => set({ anomalies: a }),
  addAnomaly: (a) => set((state) => ({ anomalies: [...state.anomalies, a] })),

  // Correlation results
  correlations: [],
  setCorrelations: (c) => set({ correlations: c }),

  // Timeline events
  timelineEvents: [],
  setTimelineEvents: (e) => set({ timelineEvents: e }),

  // Report data
  reportFindings: [],
  setReportFindings: (f) => set({ reportFindings: f }),
}))

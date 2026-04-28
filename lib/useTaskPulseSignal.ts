'use client'

import { create } from 'zustand'

/**
 * Lightweight attention signal for dashboard ↔ Task Pulse (e.g. “jump to project”).
 * CRM context for the selected vault project is `Project.clientId` from `msc_loadVaultProjects` — use that,
 * not an extra round-trip.
 */
type TaskPulseSignalState = {
  needsAttention: boolean
  targetProjectId: string | null
  setSignal: (needsAttention: boolean, targetProjectId: string | null) => void
}

export const useTaskPulseSignal = create<TaskPulseSignalState>((set) => ({
  needsAttention: false,
  targetProjectId: null,
  setSignal: (needsAttention, targetProjectId) => set({ needsAttention, targetProjectId }),
}))

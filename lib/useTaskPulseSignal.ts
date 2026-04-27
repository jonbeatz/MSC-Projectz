'use client'

import { create } from 'zustand'

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

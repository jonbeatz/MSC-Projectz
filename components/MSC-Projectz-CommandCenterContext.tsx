'use client'

import { createContext, useContext } from 'react'

type MscCommandCenterContextValue = {
  searchQuery: string
  onAddProject: () => void
}

const MscCommandCenterContext = createContext<MscCommandCenterContextValue | null>(null)

export function MSC_Projectz_CommandCenterProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: MscCommandCenterContextValue
}) {
  return (
    <MscCommandCenterContext.Provider value={value}>
      {children}
    </MscCommandCenterContext.Provider>
  )
}

export function useMSCProjectzCommandCenter() {
  const ctx = useContext(MscCommandCenterContext)
  if (!ctx) {
    throw new Error('useMSCProjectzCommandCenter must be used inside MSC_Projectz_CommandCenterProvider')
  }
  return ctx
}

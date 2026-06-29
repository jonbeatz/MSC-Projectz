'use client'

import { useState } from 'react'

import { AddProjectModal } from '@/components/add-project-modal'
import { AuthScreen } from '@/components/auth-screen'
import { DashboardLayout } from '@/components/dashboard-layout'
import {
  MSC_Projectz_CommandCenterProvider,
} from '@/components/MSC-Projectz-CommandCenterContext'
import { MSC_Projectz_VaultHydrator } from '@/components/MSC-Projectz-VaultHydrator'
import { MscErrorBoundary } from '@/components/MscErrorBoundary'
import { useAppStore } from '@/lib/store'

export function MSC_Projectz_CommandCenterShell({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const [addProjectOpen, setAddProjectOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  if (!isAuthenticated) {
    return <AuthScreen />
  }

  const handleAddProject = () => setAddProjectOpen(true)

  return (
    <MSC_Projectz_CommandCenterProvider value={{ searchQuery, onAddProject: handleAddProject }}>
      <DashboardLayout
        onAddProject={handleAddProject}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      >
        <MscErrorBoundary>
          <MSC_Projectz_VaultHydrator />
          {children}
          <AddProjectModal isOpen={addProjectOpen} onClose={() => setAddProjectOpen(false)} />
        </MscErrorBoundary>
      </DashboardLayout>
    </MSC_Projectz_CommandCenterProvider>
  )
}

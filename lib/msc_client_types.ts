import type { OnboardingChecklist } from '@/lib/msc_client_domain'

export type { OnboardingChecklist, OnboardingChecklistItem } from '@/lib/msc_client_domain'

export type MscClientListRow = {
  id: string
  name: string
  status: string
  updatedAt: string
}

export type MscClientPulseStats = {
  totalProjects: number
  totalTasks: number
  overdueTasks: number
  upcomingTasks: number
  activeSnippets: number
}

export type MscClientDetail = {
  id: string
  name: string
  status: string
  updatedAt: string
  primaryContact: {
    name: string
    email: string
    phone: string | null | undefined
  }
  projectIds: string[]
  onboardingChecklist: OnboardingChecklist
}

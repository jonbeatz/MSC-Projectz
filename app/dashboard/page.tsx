'use client'

import { AuthScreen } from '@/components/auth-screen'
import { Dashboard } from '@/components/dashboard'
import { useAppStore } from '@/lib/store'

export default function MSC_Projectz_DashboardPage() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  if (!isAuthenticated) {
    return <AuthScreen />
  }
  return <Dashboard />
}


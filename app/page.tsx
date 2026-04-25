'use client'

import { useAppStore } from '@/lib/store'
import { AuthScreen } from '@/components/auth-screen'
import { Dashboard } from '@/components/dashboard'

export default function Home() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)

  if (!isAuthenticated) {
    return <AuthScreen />
  }

  return <Dashboard />
}

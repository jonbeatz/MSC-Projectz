'use client'

import { cn } from '@/lib/utils'

export type SystemStatusState = 'Active' | 'Degraded' | 'Offline'

interface SystemStatusProps {
  status?: SystemStatusState
}

const mscStatusStyles: Record<SystemStatusState, string> = {
  Active: 'bg-primary ring-4 ring-primary/10',
  Degraded: 'bg-yellow-400 ring-4 ring-yellow-400/10',
  Offline: 'bg-destructive ring-4 ring-destructive/10',
}

const mscStatusLabels: Record<SystemStatusState, string> = {
  Active: 'System active',
  Degraded: 'System degraded',
  Offline: 'System offline',
}

export function SystemStatus({ status = 'Active' }: SystemStatusProps) {
  return (
    <div
      className="msc-system-status inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-2.5 py-1 text-xs text-muted-foreground"
      role="status"
      aria-label={mscStatusLabels[status]}
      title={mscStatusLabels[status]}
    >
      <span
        className={cn('msc-system-status__pulse h-2 w-2 rounded-full animate-pulse', mscStatusStyles[status])}
        aria-hidden
      />
      <span className="hidden sm:inline">{status}</span>
    </div>
  )
}

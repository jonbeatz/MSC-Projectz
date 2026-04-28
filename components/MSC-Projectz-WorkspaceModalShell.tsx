'use client'

import type { ReactNode } from 'react'

import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type MscWorkspaceModalShellProps = {
  title: string
  children: ReactNode
  className?: string
  bodyClassName?: string
  headerExtra?: ReactNode
  titleClassName?: string
}

export function MSC_Projectz_WorkspaceModalShell({
  title,
  children,
  className,
  bodyClassName,
  headerExtra,
  titleClassName,
}: MscWorkspaceModalShellProps) {
  return (
    <DialogContent
      className={cn(
        'msc-clients-glass-card flex max-h-[92vh] w-[min(100vw-1rem,56rem)] max-w-[min(100vw-2rem,56rem)] flex-col gap-0 overflow-hidden border-border bg-card p-0 sm:max-w-4xl',
        className,
      )}
    >
      <DialogHeader className="shrink-0 border-b border-border px-4 py-3 sm:px-6">
        <DialogTitle className={cn('text-left text-base', titleClassName)}>{title}</DialogTitle>
        {headerExtra}
      </DialogHeader>
      <div className={cn('min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6', bodyClassName)}>{children}</div>
    </DialogContent>
  )
}


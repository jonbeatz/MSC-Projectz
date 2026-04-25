'use client'

import { User } from 'lucide-react'

import { cn } from '@/lib/utils'

export function UserAvatar({
  src,
  fallback,
  className,
}: {
  src?: string | null
  fallback: string
  className?: string
}) {
  const imageSrc = src?.trim()

  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt={fallback}
        className={cn('h-7 w-7 rounded-lg border border-border object-cover', className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card',
        className,
      )}
      aria-label={fallback}
    >
      <User className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}

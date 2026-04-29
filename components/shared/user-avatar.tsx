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
        decoding="async"
        referrerPolicy="no-referrer"
        className={cn(
          'aspect-square h-7 w-7 shrink-0 rounded-lg border border-border bg-muted object-cover object-center',
          className,
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex aspect-square h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-card',
        className,
      )}
      aria-label={fallback}
    >
      <User className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}

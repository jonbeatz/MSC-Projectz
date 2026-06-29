import { cn } from '@/lib/utils'

// ============================================================================
// Reusable skeleton primitives
// ============================================================================

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

// ============================================================================
// Dashboard skeleton
// ============================================================================
export function DashboardSkeleton() {
  return (
    <div className="flex min-h-full w-full flex-col gap-4 px-4 sm:px-5 md:gap-6 md:px-6">
      {/* Toolbar skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="ml-auto h-9 w-32" />
      </div>

      {/* Project grid skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
            {/* Thumbnail */}
            <Skeleton className="h-32 w-full rounded-lg" />
            {/* Title */}
            <Skeleton className="h-5 w-3/4" />
            {/* Status badge */}
            <Skeleton className="h-4 w-16" />
            {/* Progress bar */}
            <Skeleton className="h-2 w-full" />
            {/* Meta row */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Calendar skeleton
// ============================================================================
export function CalendarSkeleton() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col gap-4 p-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-6 w-full" />
        ))}
        {/* Day cells */}
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={`cell-${i}`} className="flex flex-col gap-1 rounded-lg border border-border p-1 min-h-[80px]">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Tasks skeleton
// ============================================================================
export function TasksSkeleton() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col gap-3 p-4">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Settings skeleton
// ============================================================================
export function SettingsSkeleton() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col gap-6 p-4">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

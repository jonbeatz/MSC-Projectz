'use client'

import { useMemo, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MscPaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasPrev: boolean
  hasNext: boolean
}

export function msc_calculatePagination(total: number, page: number, pageSize: number): MscPaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const clampedPage = Math.max(1, Math.min(page, totalPages))
  return {
    page: clampedPage,
    pageSize,
    total,
    totalPages,
    hasPrev: clampedPage > 1,
    hasNext: clampedPage < totalPages,
  }
}

export function msc_paginateArray<T>(
  items: T[],
  page: number,
  pageSize: number,
): { items: T[]; meta: MscPaginationMeta } {
  const meta = msc_calculatePagination(items.length, page, pageSize)
  const start = (meta.page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    meta,
  }
}

export function useMscPagination<T>(items: T[], pageSize = 12) {
  const [page, setPage] = useState(1)

  const { items: pageItems, meta } = useMemo(() => msc_paginateArray(items, page, pageSize), [items, page, pageSize])

  const goToPage = useCallback(
    (p: number) => {
      const clamped = Math.max(1, Math.min(p, meta.totalPages))
      setPage(clamped)
    },
    [meta.totalPages],
  )

  const nextPage = useCallback(() => {
    if (meta.hasNext) setPage((p) => p + 1)
  }, [meta.hasNext])

  const prevPage = useCallback(() => {
    if (meta.hasPrev) setPage((p) => p - 1)
  }, [meta.hasPrev])

  const resetPage = useCallback(() => setPage(1), [])

  return {
    pageItems,
    meta,
    page,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
    setPage,
  }
}

interface MscPaginationBarProps {
  meta: MscPaginationMeta
  onPageChange: (page: number) => void
  className?: string
}

export function MscPaginationBar({ meta, onPageChange, className }: MscPaginationBarProps) {
  if (meta.totalPages <= 1) return null

  const pages = useMemo(() => {
    const range: number[] = []
    const maxVisible = 5
    let start = Math.max(1, meta.page - Math.floor(maxVisible / 2))
    const end = Math.min(meta.totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    for (let i = start; i <= end; i++) {
      range.push(i)
    }
    return range
  }, [meta.page, meta.totalPages])

  return (
    <nav className={cn('flex items-center justify-center gap-1', className)} aria-label="Pagination">
      <button
        type="button"
        disabled={!meta.hasPrev}
        onClick={() => onPageChange(meta.page - 1)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages[0] > 1 && (
        <>
          <button
            type="button"
            onClick={() => onPageChange(1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            1
          </button>
          {pages[0] > 2 && (
            <span className="inline-flex h-8 w-8 items-center justify-center text-xs text-muted-foreground">
              &hellip;
            </span>
          )}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors',
            p === meta.page
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-card hover:text-foreground',
          )}
          aria-current={p === meta.page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}

      {pages[pages.length - 1] < meta.totalPages && (
        <>
          {pages[pages.length - 1] < meta.totalPages - 1 && (
            <span className="inline-flex h-8 w-8 items-center justify-center text-xs text-muted-foreground">
              &hellip;
            </span>
          )}
          <button
            type="button"
            onClick={() => onPageChange(meta.totalPages)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            {meta.totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        disabled={!meta.hasNext}
        onClick={() => onPageChange(meta.page + 1)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  )
}

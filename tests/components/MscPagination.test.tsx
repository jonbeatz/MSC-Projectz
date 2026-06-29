import { describe, it, expect } from 'vitest'
import {
  msc_calculatePagination,
  msc_paginateArray,
  useMscPagination,
  MscPaginationBar,
} from '@/components/MscPagination'
import { render, screen } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'

describe('msc_calculatePagination', () => {
  it('returns correct meta for small dataset', () => {
    const meta = msc_calculatePagination(5, 1, 12)
    expect(meta.totalPages).toBe(1)
    expect(meta.page).toBe(1)
    expect(meta.hasPrev).toBe(false)
    expect(meta.hasNext).toBe(false)
  })

  it('returns correct meta for large dataset', () => {
    const meta = msc_calculatePagination(50, 2, 12)
    expect(meta.totalPages).toBe(5) // ceil(50/12) = 5
    expect(meta.page).toBe(2)
    expect(meta.hasPrev).toBe(true)
    expect(meta.hasNext).toBe(true)
  })

  it('clamps page to valid range', () => {
    const meta = msc_calculatePagination(10, 100, 5)
    expect(meta.page).toBe(2) // totalPages = 2
    expect(meta.totalPages).toBe(2)
  })

  it('clamps page below 1', () => {
    const meta = msc_calculatePagination(10, 0, 5)
    expect(meta.page).toBe(1)
  })

  it('handles empty dataset', () => {
    const meta = msc_calculatePagination(0, 1, 12)
    expect(meta.totalPages).toBe(1)
    expect(meta.page).toBe(1)
    expect(meta.total).toBe(0)
    expect(meta.hasPrev).toBe(false)
    expect(meta.hasNext).toBe(false)
  })
})

describe('msc_paginateArray', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

  it('returns first page', () => {
    const { items: page, meta } = msc_paginateArray(items, 1, 4)
    expect(page).toEqual([1, 2, 3, 4])
    expect(meta.page).toBe(1)
    expect(meta.hasNext).toBe(true)
  })

  it('returns second page', () => {
    const { items: page } = msc_paginateArray(items, 2, 4)
    expect(page).toEqual([5, 6, 7, 8])
  })

  it('returns last partial page', () => {
    const { items: page } = msc_paginateArray(items, 3, 4)
    expect(page).toEqual([9, 10])
  })

  it('returns last page exactly', () => {
    const { items: page } = msc_paginateArray(items, 2, 5)
    expect(page).toEqual([6, 7, 8, 9, 10])
  })
})

describe('useMscPagination', () => {
  const items = Array.from({ length: 25 }, (_, i) => `item-${i + 1}`)

  it('returns first 12 items by default', () => {
    const { result } = renderHook(() => useMscPagination(items))
    expect(result.current.pageItems).toHaveLength(12)
    expect(result.current.page).toBe(1)
    expect(result.current.meta.totalPages).toBe(3)
  })

  it('goes to next page', () => {
    const { result } = renderHook(() => useMscPagination(items))
    act(() => result.current.nextPage())
    expect(result.current.page).toBe(2)
    expect(result.current.pageItems[0]).toBe('item-13')
  })

  it('goes to previous page', () => {
    const { result } = renderHook(() => useMscPagination(items))
    act(() => result.current.goToPage(2))
    act(() => result.current.prevPage())
    expect(result.current.page).toBe(1)
  })

  it('resets to page 1', () => {
    const { result } = renderHook(() => useMscPagination(items))
    act(() => result.current.goToPage(3))
    act(() => result.current.resetPage())
    expect(result.current.page).toBe(1)
  })

  it('stays at page 1 when at start and clicking prev', () => {
    const { result } = renderHook(() => useMscPagination(items))
    act(() => result.current.prevPage())
    expect(result.current.page).toBe(1)
  })

  it('stays at last page when at end and clicking next', () => {
    const { result } = renderHook(() => useMscPagination(items))
    act(() => result.current.goToPage(3))
    act(() => result.current.nextPage())
    expect(result.current.page).toBe(3)
  })
})

describe('MscPaginationBar', () => {
  const meta = { page: 1, pageSize: 12, total: 50, totalPages: 5, hasPrev: false, hasNext: true }

  it('renders nothing when only one page', () => {
    const singleMeta = { page: 1, pageSize: 12, total: 5, totalPages: 1, hasPrev: false, hasNext: false }
    const { container } = render(<MscPaginationBar meta={singleMeta} onPageChange={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders page buttons', () => {
    render(<MscPaginationBar meta={meta} onPageChange={() => {}} />)
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument()
    expect(screen.getByLabelText('Next page')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('highlights current page', () => {
    const curMeta = { ...meta, page: 3 }
    render(<MscPaginationBar meta={curMeta} onPageChange={() => {}} />)
    const current = screen.getByText('3')
    expect(current.getAttribute('aria-current')).toBe('page')
  })

  it('disables prev button on first page', () => {
    render(<MscPaginationBar meta={meta} onPageChange={() => {}} />)
    expect(screen.getByLabelText('Previous page')).toBeDisabled()
  })

  it('disables next button on last page', () => {
    const lastMeta = { ...meta, page: 5, hasPrev: true, hasNext: false }
    render(<MscPaginationBar meta={lastMeta} onPageChange={() => {}} />)
    expect(screen.getByLabelText('Next page')).toBeDisabled()
  })
})

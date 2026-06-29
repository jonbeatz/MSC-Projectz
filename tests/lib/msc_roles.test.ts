import { describe, it, expect } from 'vitest'
import { msc_hasAdminAccess, msc_normalizeRole, type MscAppRole } from '@/lib/msc_roles'

describe('msc_roles', () => {
  describe('msc_hasAdminAccess', () => {
    it('returns true for master-admin', () => {
      expect(msc_hasAdminAccess('master-admin')).toBe(true)
    })

    it('returns true for admin', () => {
      expect(msc_hasAdminAccess('admin')).toBe(true)
    })

    it('returns false for user', () => {
      expect(msc_hasAdminAccess('user')).toBe(false)
    })

    it('returns false for undefined/null', () => {
      expect(msc_hasAdminAccess(undefined)).toBe(false)
      expect(msc_hasAdminAccess(null as unknown as MscAppRole)).toBe(false)
    })
  })

  describe('msc_normalizeRole', () => {
    it('returns master-admin when role is master-admin', () => {
      expect(msc_normalizeRole('master-admin')).toBe('master-admin')
    })

    it('returns admin when role is admin', () => {
      expect(msc_normalizeRole('admin')).toBe('admin')
    })

    it('returns user as default', () => {
      expect(msc_normalizeRole('unknown')).toBe('user')
      expect(msc_normalizeRole(undefined)).toBe('user')
      expect(msc_normalizeRole(null)).toBe('user')
    })
  })
})

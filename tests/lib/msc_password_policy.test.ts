import { describe, it, expect } from 'vitest'
import {
  msc_validateNewPassword,
  msc_isNewPasswordCompliant,
  msc_newPasswordRulesScore,
  msc_newPasswordPolicyHint,
} from '@/lib/msc_password_policy'

describe('msc_password_policy', () => {
  describe('msc_validateNewPassword', () => {
    it('rejects empty password', () => {
      const result = msc_validateNewPassword('')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.message).toContain('8')
    })

    it('rejects too short password', () => {
      const result = msc_validateNewPassword('Ab1!')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.message).toContain('8')
    })

    it('rejects password without uppercase', () => {
      const result = msc_validateNewPassword('abcdef1!@')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.message).toContain('uppercase')
    })

    it('rejects password without number', () => {
      const result = msc_validateNewPassword('Abcdefg!@')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.message).toContain('number')
    })

    it('rejects password without special character', () => {
      const result = msc_validateNewPassword('Abcdefg1')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.message).toContain('special character')
    })

    it('accepts valid password', () => {
      const result = msc_validateNewPassword('MyP@ssw0rd')
      expect(result.ok).toBe(true)
    })

    it('handles null/undefined gracefully', () => {
      const result = msc_validateNewPassword(null as unknown as string)
      expect(result.ok).toBe(false)
    })
  })

  describe('msc_isNewPasswordCompliant', () => {
    it('returns false for weak password', () => {
      expect(msc_isNewPasswordCompliant('weak')).toBe(false)
    })

    it('returns true for strong password', () => {
      expect(msc_isNewPasswordCompliant('Str0ng!Pass')).toBe(true)
    })
  })

  describe('msc_newPasswordRulesScore', () => {
    it('returns 0/4 for empty password', () => {
      const { met, total } = msc_newPasswordRulesScore('')
      expect(total).toBe(4)
      expect(met).toBe(0)
    })

    it('returns 1/4 for length-only password (no uppercase/special)', () => {
      const { met } = msc_newPasswordRulesScore('abcdefgh')
      expect(met).toBe(1)
    })

    it('returns 2/4 for length + uppercase', () => {
      const { met } = msc_newPasswordRulesScore('Abcdefgh')
      expect(met).toBe(2)
    })

    it('returns 3/4 for length + uppercase + digit', () => {
      const { met } = msc_newPasswordRulesScore('Abcdefg1')
      expect(met).toBe(3)
    })

    it('returns 4/4 for fully compliant password', () => {
      const { met } = msc_newPasswordRulesScore('MyP@ssw0rd')
      expect(met).toBe(4)
    })
  })

  describe('msc_newPasswordPolicyHint', () => {
    it('returns hint string', () => {
      expect(msc_newPasswordPolicyHint()).toContain('8 characters')
    })
  })
})

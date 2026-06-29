import { describe, it, expect } from 'vitest'
import { msc_encryptCredentialData, msc_decryptCredentialData } from '@/lib/msc_credential_crypto'

describe('msc_credential_crypto', () => {
  describe('msc_encryptCredentialData', () => {
    it('returns plain JSON when no master password', () => {
      const result = msc_encryptCredentialData({ key: 'value' }, null)
      expect(result).toBe(JSON.stringify({ key: 'value' }))
    })

    it('returns encrypted string when master password provided', () => {
      const result = msc_encryptCredentialData({ secret: 's3cret' }, 'mypassword')
      expect(result).not.toContain('s3cret')
      expect(result).not.toBe(JSON.stringify({ secret: 's3cret' }))
    })
  })

  describe('msc_decryptCredentialData', () => {
    it('returns parsed JSON when no master password', () => {
      const result = msc_decryptCredentialData(JSON.stringify({ key: 'value' }), null)
      expect(result).toEqual({ key: 'value' })
    })

    it('returns null for invalid JSON with no master password', () => {
      const result = msc_decryptCredentialData('not-json', null)
      expect(result).toBeNull()
    })

    it('round-trips data correctly with master password', () => {
      const original = { username: 'test', password: 'hunter2', url: 'https://example.com' }
      const encrypted = msc_encryptCredentialData(original, 'correct-password')
      const decrypted = msc_decryptCredentialData(encrypted, 'correct-password')
      expect(decrypted).toEqual(original)
    })

    it('returns null when wrong password used', () => {
      const encrypted = msc_encryptCredentialData({ secret: 'data' }, 'right-password')
      const result = msc_decryptCredentialData(encrypted, 'wrong-password')
      expect(result).toBeNull()
    })

    it('handles empty objects', () => {
      const encrypted = msc_encryptCredentialData({}, 'password')
      const decrypted = msc_decryptCredentialData(encrypted, 'password')
      expect(decrypted).toEqual({})
    })

    it('handles arrays', () => {
      const original = [{ a: 1 }, { b: 2 }]
      const encrypted = msc_encryptCredentialData(original, 'pass')
      const decrypted = msc_decryptCredentialData(encrypted, 'pass')
      expect(decrypted).toEqual(original)
    })
  })
})

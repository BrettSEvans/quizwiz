import { describe, it, expect } from 'vitest'
import {
  createQuizmasterSignUp,
  validateQuizmasterEmail,
  validatePassword,
  generateHostInviteCode,
  createHostInvite,
  validateInviteCode,
  softDeleteQuizmaster,
  restoreQuizmaster,
} from '../quizmaster-accounts'

describe('quizmaster-accounts', () => {
  describe('createQuizmasterSignUp', () => {
    it('creates a new quizmaster with valid inputs', () => {
      const result = createQuizmasterSignUp('john@example.com', 'John Doe', 'hashedPassword123')
      expect(result).toHaveProperty('id')
      expect(result.email).toBe('john@example.com')
      expect(result.name).toBe('John Doe')
      expect(result.passwordHash).toBe('hashedPassword123')
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.deletedAt).toBeNull()
    })

    it('returns error if email is invalid format', () => {
      const result = createQuizmasterSignUp('not-an-email', 'John Doe', 'hashedPassword123')
      expect(result).toHaveProperty('error')
      expect(result.error).toContain('email')
    })

    it('accepts optional invitedByQuizmasterId', () => {
      const result = createQuizmasterSignUp('jane@example.com', 'Jane', 'hash123', 'qm-123')
      expect(result).not.toHaveProperty('error')
      expect(result.invitedBy).toBe('qm-123')
    })

    it('sets invitedBy to null if not provided', () => {
      const result = createQuizmasterSignUp('bob@example.com', 'Bob', 'hash123')
      expect(result.invitedBy).toBeNull()
    })
  })

  describe('validateQuizmasterEmail', () => {
    it('accepts valid email addresses', () => {
      const result = validateQuizmasterEmail('test@example.com')
      expect(result.valid).toBe(true)
    })

    it('rejects invalid email formats', () => {
      const result = validateQuizmasterEmail('invalid-email')
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('rejects missing @ symbol', () => {
      const result = validateQuizmasterEmail('testexample.com')
      expect(result.valid).toBe(false)
    })

    it('rejects empty string', () => {
      const result = validateQuizmasterEmail('')
      expect(result.valid).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('accepts strong passwords', () => {
      const result = validatePassword('StrongPass123!')
      expect(result.valid).toBe(true)
    })

    it('rejects passwords shorter than 8 characters', () => {
      const result = validatePassword('Short1!')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('8')
    })

    it('rejects passwords without uppercase letter', () => {
      const result = validatePassword('lowercase123!')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('uppercase')
    })

    it('rejects passwords without lowercase letter', () => {
      const result = validatePassword('UPPERCASE123!')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('lowercase')
    })

    it('rejects passwords without number', () => {
      const result = validatePassword('NoNumbers!')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('number')
    })

    it('rejects passwords without special character', () => {
      const result = validatePassword('NoSpecial123')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('symbol')
    })

    it('accepts passwords with common special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '-', '_', '=', '+']
      specialChars.forEach((char) => {
        const password = `ValidPass1${char}`
        const result = validatePassword(password)
        expect(result.valid).toBe(true)
      })
    })
  })

  describe('generateHostInviteCode', () => {
    it('generates an 8-character code', () => {
      const code = generateHostInviteCode()
      expect(code).toHaveLength(8)
    })

    it('generates alphanumeric characters only', () => {
      const code = generateHostInviteCode()
      expect(code).toMatch(/^[A-Za-z0-9]{8}$/)
    })

    it('generates different codes on each call', () => {
      const codes = Array.from({ length: 10 }, () => generateHostInviteCode())
      const uniqueCodes = new Set(codes)
      expect(uniqueCodes.size).toBe(10)
    })

    it('generates URL-safe codes (no special chars)', () => {
      const code = generateHostInviteCode()
      expect(code).not.toMatch(/[^A-Za-z0-9]/)
    })
  })

  describe('createHostInvite', () => {
    it('creates an email-based invite', () => {
      const quizmasterId = 'qm-123'
      const result = createHostInvite(quizmasterId, 'host@example.com', 'email')
      expect(result).toHaveProperty('inviteCode')
      expect(result.inviteCode).toHaveLength(8)
      expect(result.inviteEmail).toBe('host@example.com')
      expect(result.inviteType).toBe('email')
      expect(result.quizmasterId).toBe(quizmasterId)
      expect(result.acceptedAt).toBeNull()
    })

    it('creates a manual code invite without email', () => {
      const result = createHostInvite('qm-456', undefined, 'manual_code')
      expect(result.inviteType).toBe('manual_code')
      expect(result.inviteEmail).toBeNull()
      expect(result.inviteCode).toHaveLength(8)
    })

    it('sets expiry to 7 days in the future', () => {
      const now = new Date()
      const result = createHostInvite('qm-789', 'test@example.com', 'email')
      const expiryTime = result.expiresAt.getTime()
      const expectedTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).getTime()
      // Allow 1 second tolerance for test execution time
      expect(Math.abs(expiryTime - expectedTime)).toBeLessThan(1000)
    })

    it('generates unique codes for multiple invites', () => {
      const codes = Array.from({ length: 5 }, (_, i) =>
        createHostInvite('qm-123', `host${i}@example.com`, 'email').inviteCode
      )
      const uniqueCodes = new Set(codes)
      expect(uniqueCodes.size).toBe(5)
    })
  })

  describe('validateInviteCode', () => {
    it('validates a valid, non-expired code', () => {
      const invite = createHostInvite('qm-123', 'host@example.com', 'email')
      const result = validateInviteCode(invite, new Date())
      expect(result.valid).toBe(true)
    })

    it('rejects an expired code', () => {
      const invite = createHostInvite('qm-123', 'host@example.com', 'email')
      const futureDate = new Date(invite.expiresAt.getTime() + 1000) // 1 second after expiry
      const result = validateInviteCode(invite, futureDate)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('expired')
    })

    it('rejects an already-accepted code', () => {
      const invite = createHostInvite('qm-123', 'host@example.com', 'email')
      invite.acceptedAt = new Date() // Mark as accepted
      const result = validateInviteCode(invite, new Date())
      expect(result.valid).toBe(false)
      expect(result.error).toContain('already been accepted')
    })

    it('accepts a code one second before expiry', () => {
      const invite = createHostInvite('qm-123', 'host@example.com', 'email')
      const justBeforeExpiry = new Date(invite.expiresAt.getTime() - 1000)
      const result = validateInviteCode(invite, justBeforeExpiry)
      expect(result.valid).toBe(true)
    })
  })

  describe('softDeleteQuizmaster', () => {
    it('marks quizmaster as deleted', () => {
      const qm = createQuizmasterSignUp('john@example.com', 'John', 'hash123') as any
      const deleted = softDeleteQuizmaster(qm)
      expect(deleted.deletedAt).not.toBeNull()
      expect(deleted.deletedAt).toBeInstanceOf(Date)
    })

    it('preserves other fields', () => {
      const qm = createQuizmasterSignUp('john@example.com', 'John', 'hash123') as any
      const deleted = softDeleteQuizmaster(qm)
      expect(deleted.email).toBe('john@example.com')
      expect(deleted.name).toBe('John')
      expect(deleted.id).toBe(qm.id)
    })

    it('does not modify original object', () => {
      const qm = createQuizmasterSignUp('john@example.com', 'John', 'hash123') as any
      softDeleteQuizmaster(qm)
      expect(qm.deletedAt).toBeNull()
    })
  })

  describe('restoreQuizmaster', () => {
    it('clears deletedAt timestamp', () => {
      let qm = createQuizmasterSignUp('john@example.com', 'John', 'hash123') as any
      qm = softDeleteQuizmaster(qm)
      const restored = restoreQuizmaster(qm)
      expect(restored.deletedAt).toBeNull()
    })

    it('preserves other fields', () => {
      let qm = createQuizmasterSignUp('john@example.com', 'John', 'hash123') as any
      qm = softDeleteQuizmaster(qm)
      const restored = restoreQuizmaster(qm)
      expect(restored.email).toBe('john@example.com')
      expect(restored.id).toBe(qm.id)
    })

    it('does not modify original object', () => {
      let qm = createQuizmasterSignUp('john@example.com', 'John', 'hash123') as any
      qm = softDeleteQuizmaster(qm)
      restoreQuizmaster(qm)
      expect(qm.deletedAt).not.toBeNull()
    })
  })
})

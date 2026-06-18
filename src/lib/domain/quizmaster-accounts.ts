/**
 * Pure domain logic for Quizmaster account management.
 * All functions are immutable and side-effect free.
 */

// RFC 5322 simplified email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface ValidationResult {
  valid: boolean
  error?: string
}

export interface Quizmaster {
  id: string
  email: string
  passwordHash: string
  name: string
  invitedBy: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface HostInvite {
  id: string
  quizmasterId: string
  inviteCode: string
  inviteEmail: string | null
  inviteType: 'email' | 'manual_code'
  expiresAt: Date
  acceptedAt: Date | null
  acceptedBy?: string | null
  createdAt: Date
}

/**
 * Validate email format (RFC 5322 simplified)
 */
export function validateQuizmasterEmail(email: string): ValidationResult {
  if (!email) {
    return { valid: false, error: 'Email is required' }
  }
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: 'Invalid email address' }
  }
  return { valid: true }
}

/**
 * Validate password strength: min 8 chars, uppercase, lowercase, number, symbol
 */
export function validatePassword(password: string): ValidationResult {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must include an uppercase letter' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must include a lowercase letter' }
  }
  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password must include a number' }
  }
  if (!/[!@#$%^&*\-_=+]/.test(password)) {
    return { valid: false, error: 'Password must include a special symbol (!@#$%^&*-_=+)' }
  }
  return { valid: true }
}

/**
 * Generate a random 8-character alphanumeric invite code (URL-safe)
 */
export function generateHostInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Create a new Quizmaster account
 */
export function createQuizmasterSignUp(
  email: string,
  name: string,
  passwordHash: string,
  invitedByQuizmasterId?: string
): Quizmaster | { error: string } {
  const emailValidation = validateQuizmasterEmail(email)
  if (!emailValidation.valid) {
    return { error: emailValidation.error || 'Invalid email' }
  }

  const now = new Date()
  return {
    id: `qm_${Math.random().toString(36).substr(2, 9)}`,
    email,
    passwordHash,
    name,
    invitedBy: invitedByQuizmasterId || null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
}

/**
 * Create a new host invite (email-based or manual code)
 */
export function createHostInvite(
  quizmasterId: string,
  inviteEmail: string | undefined,
  inviteType: 'email' | 'manual_code'
): HostInvite {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

  return {
    id: `inv_${Math.random().toString(36).substr(2, 9)}`,
    quizmasterId,
    inviteCode: generateHostInviteCode(),
    inviteEmail: inviteEmail || null,
    inviteType,
    expiresAt,
    acceptedAt: null,
    createdAt: now,
  }
}

/**
 * Validate an invite code (not expired, not already accepted)
 */
export function validateInviteCode(
  invite: HostInvite | { expiresAt: Date; acceptedAt: Date | null },
  currentTime: Date
): ValidationResult {
  if ('acceptedAt' in invite && invite.acceptedAt !== null) {
    return { valid: false, error: 'This invite has already been accepted' }
  }
  if (currentTime > invite.expiresAt) {
    return { valid: false, error: 'This invite has expired' }
  }
  return { valid: true }
}

/**
 * Mark a Quizmaster as deleted (soft delete)
 */
export function softDeleteQuizmaster(qm: Quizmaster): Quizmaster {
  return {
    ...qm,
    deletedAt: new Date(),
  }
}

/**
 * Restore a deleted Quizmaster (clear soft delete)
 */
export function restoreQuizmaster(qm: Quizmaster): Quizmaster {
  return {
    ...qm,
    deletedAt: null,
  }
}

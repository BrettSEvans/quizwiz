/**
 * JWT and password hashing utilities for authentication.
 */

import bcrypt from 'bcrypt'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
const JWT_EXPIRY_SECONDS = 7 * 24 * 60 * 60 // 7 days

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

/**
 * Compare a plain text password with a bcrypt hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Create a simple JWT-like token (base64 encoded JSON + HMAC signature)
 * Production should use a proper JWT library like jose
 */
function createToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(
    JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY_SECONDS })
  ).toString('base64url')
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${signature}`
}

/**
 * Verify and decode a JWT-like token
 */
function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const [header, body, signature] = token.split('.')
    if (!header || !body || !signature) return null

    // Verify signature
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url')
    if (signature !== expectedSignature) return null

    // Decode payload
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString())

    // Check expiry
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch (err) {
    return null
  }
}

/**
 * Sign a JWT token for a Quizmaster (async)
 */
export async function signQuizmasterToken(quizmasterId: string, email: string): Promise<string> {
  return createToken({
    sub: quizmasterId,
    email,
    role: 'quizmaster',
  })
}

/**
 * Sign a JWT token for a Host (async)
 */
export async function signHostToken(
  hostId: string,
  quizmasterId: string,
  email: string
): Promise<string> {
  return createToken({
    sub: hostId,
    quizmasterId,
    email,
    role: 'host',
  })
}

/**
 * Verify and decode a JWT token (async)
 */
export async function verifyToken(
  token: string
): Promise<{ sub: string; role: 'quizmaster' | 'host'; quizmasterId?: string; email?: string } | null> {
  const payload = decodeToken(token)
  if (!payload) return null

  return {
    sub: payload.sub as string,
    role: payload.role as 'quizmaster' | 'host',
    quizmasterId: payload.quizmasterId as string | undefined,
    email: payload.email as string | undefined,
  }
}

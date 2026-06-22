import crypto from 'crypto'

// ── Cookie-based session support (transition / opt-in) ───────────────────────
// This is the backend half of the planned move from a localStorage JWT to an
// httpOnly cookie (see docs/JWT_COOKIE_MIGRATION.md). It is GATED behind the
// COOKIE_AUTH env flag and OFF by default: with the flag off, no cookies are
// issued or read and auth behaves exactly as the header/Bearer flow always has.
// Turn it on only once the frontend cutover + same-site API host are in place.

export const SESSION_COOKIE = 'lawnn_session'  // httpOnly — the JWT
export const CSRF_COOKIE    = 'lawnn_csrf'     // readable by JS — double-submit token

// Whether cookie auth is active. Off by default → zero behaviour change.
export function cookieAuthEnabled() {
  return process.env.COOKIE_AUTH === 'on'
}

// Session lifetime in ms — kept in step with the 24h JWT default; override with
// COOKIE_MAX_AGE_MS if you also change JWT_EXPIRES_IN.
export const SESSION_MAX_AGE_MS =
  Number(process.env.COOKIE_MAX_AGE_MS) || 24 * 60 * 60 * 1000

// Read a single cookie value off the raw Cookie header. Avoids adding a runtime
// dependency just to read one named cookie.
export function readCookie(req, name) {
  const raw = req.headers?.cookie
  if (!raw) return null
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim())
    }
  }
  return null
}

export function newCsrfToken() {
  return crypto.randomBytes(32).toString('hex')
}

// SameSite/secure/domain are env-tunable because they differ between the
// cross-site transition (None+Secure, required when the API is on a different
// registrable domain) and the same-site end state (Lax, after the API moves to
// api.lawnndesign.com). Safe cross-site defaults.
function baseCookieOptions() {
  const sameSite = (process.env.COOKIE_SAMESITE || 'none').toLowerCase()
  return {
    secure: process.env.COOKIE_SECURE !== 'false', // default true
    sameSite,                                       // 'none' | 'lax' | 'strict'
    path: '/',
    ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
  }
}

export function sessionCookieOptions() {
  return { ...baseCookieOptions(), httpOnly: true, maxAge: SESSION_MAX_AGE_MS }
}

// CSRF token cookie is intentionally NOT httpOnly — the frontend reads it and
// echoes it back in the X-CSRF-Token header (double-submit pattern).
export function csrfCookieOptions() {
  return { ...baseCookieOptions(), httpOnly: false, maxAge: SESSION_MAX_AGE_MS }
}

// Constant-time compare of the X-CSRF-Token header against the CSRF cookie.
// Returns true only when both are present and equal.
export function csrfOk(req) {
  const header = req.headers?.['x-csrf-token']
  const cookie = readCookie(req, CSRF_COOKIE)
  if (!header || !cookie) return false
  const a = Buffer.from(String(header))
  const b = Buffer.from(String(cookie))
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// Mutating methods that require CSRF protection when authenticated via cookie.
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
export function isMutating(method) {
  return !SAFE_METHODS.has((method || 'GET').toUpperCase())
}

// Set both cookies on login/register/etc. (only when the flag is on).
export function setSessionCookies(res, token) {
  const csrf = newCsrfToken()
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions())
  res.cookie(CSRF_COOKIE, csrf, csrfCookieOptions())
}

// Clear both cookies on logout.
export function clearSessionCookies(res) {
  const opts = baseCookieOptions()
  res.clearCookie(SESSION_COOKIE, { ...opts, httpOnly: true })
  res.clearCookie(CSRF_COOKIE, { ...opts, httpOnly: false })
}

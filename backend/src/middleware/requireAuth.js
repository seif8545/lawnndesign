import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'
import {
  cookieAuthEnabled, readCookie, SESSION_COOKIE, csrfOk, isMutating,
} from '../lib/cookies.js'

// Resolve the raw JWT and how it arrived. The Authorization header is always
// primary: a cross-site attacker can't set a custom header (CORS preflight
// blocks it), so header-auth needs no CSRF check. The cookie is only consulted
// when COOKIE_AUTH is on, and cookie-auth on a mutating request requires a
// matching CSRF token. Returns { token, via } or { token: null }.
function resolveToken(req) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) return { token: header.slice(7), via: 'header' }
  if (cookieAuthEnabled()) {
    const cookie = readCookie(req, SESSION_COOKIE)
    if (cookie) return { token: cookie, via: 'cookie' }
  }
  return { token: null, via: null }
}

// Look up the live account behind a verified token. Returns the user (id, email,
// role) if it still exists and isn't suspended, otherwise null. This is what
// makes deletion/suspension take effect immediately: the offender's next request
// is rejected (→ the client auto-logs-out) instead of the token staying valid
// until it expires.
async function liveUser(payload) {
  if (!payload?.id) return null
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, role: true, suspended: true, tokenVersion: true },
    })
    if (!user || user.suspended) return null
    // Reject tokens minted before the account's tokenVersion was bumped (e.g. by
    // a password change) — that's how a password change logs out other sessions.
    if ((payload.tv ?? 0) !== user.tokenVersion) return null
    return { id: user.id, email: user.email, role: user.role }
  } catch {
    return null
  }
}

/**
 * Attaches req.user = { id, email, role } if a valid Bearer token is present
 * AND the account still exists and is active. Returns 401 otherwise.
 */
export async function requireAuth(req, res, next) {
  const { token, via } = resolveToken(req)
  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' })
  }

  // Cookie-authenticated writes must carry a valid double-submit CSRF token.
  // (Header-authenticated requests are exempt — see resolveToken.)
  if (via === 'cookie' && isMutating(req.method) && !csrfOk(req)) {
    return res.status(403).json({ error: 'Invalid or missing CSRF token' })
  }

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ error: 'Token expired or invalid' })
  }

  const user = await liveUser(payload)
  if (!user) return res.status(401).json({ error: 'Account is no longer active' })

  req.user = user
  next()
}

/**
 * Decodes the Bearer token if one is present, but does NOT reject anonymous
 * requests. Suspended/deleted accounts are treated as anonymous.
 */
export async function optionalAuth(req, _res, next) {
  // optionalAuth is used on read (GET) routes, so no CSRF check is needed here.
  const { token } = resolveToken(req)
  if (!token) return next()
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await liveUser(payload)
    if (user) req.user = user
  } catch {
    // Invalid token on an optional route: treat as anonymous.
  }
  next()
}

/**
 * Use after requireAuth to restrict a route to specific roles.
 * Usage: router.get('/admin-only', requireAuth, requireRole('admin'), handler)
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }
}

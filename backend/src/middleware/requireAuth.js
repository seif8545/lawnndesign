import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'

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
      select: { id: true, email: true, role: true, suspended: true },
    })
    if (!user || user.suspended) return null
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
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' })
  }

  let payload
  try {
    payload = jwt.verify(header.slice(7), process.env.JWT_SECRET)
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
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return next()
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET)
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

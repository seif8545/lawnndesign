import jwt from 'jsonwebtoken'

/**
 * Attaches req.user = { id, email, role } if a valid Bearer token is present.
 * Returns 401 otherwise.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' })
  }

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Token expired or invalid' })
  }
}

/**
 * Decodes the Bearer token if one is present, but does NOT reject anonymous
 * requests. Use for public endpoints that surface extra data when the caller
 * happens to be authenticated (e.g. admins see pending jobs).
 */
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return next()
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET)
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

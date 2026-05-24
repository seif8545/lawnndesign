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

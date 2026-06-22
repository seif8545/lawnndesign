import { describe, it, expect, vi } from 'vitest'
import { requireRole } from '../src/middleware/requireAuth.js'

// requireRole is the gate on every privileged route. It's a pure function of
// req.user.role, so it's testable without a DB or HTTP layer.

function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(payload) { this.body = payload; return this },
  }
}

describe('requireRole', () => {
  it('calls next() when the user has an allowed role', () => {
    const req = { user: { role: 'admin' } }
    const res = mockRes()
    const next = vi.fn()
    requireRole('admin')(req, res, next)
    expect(next).toHaveBeenCalledOnce()
    expect(res.statusCode).toBeNull()
  })

  it('allows any of several permitted roles', () => {
    const next = vi.fn()
    requireRole('client', 'admin')({ user: { role: 'client' } }, mockRes(), next)
    expect(next).toHaveBeenCalledOnce()
  })

  it('rejects a disallowed role with 403 and does not call next()', () => {
    const res = mockRes()
    const next = vi.fn()
    requireRole('admin')({ user: { role: 'student' } }, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(403)
    expect(res.body).toEqual({ error: 'Forbidden' })
  })

  it('rejects when there is no authenticated user', () => {
    const res = mockRes()
    const next = vi.fn()
    requireRole('student')({}, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(403)
  })
})

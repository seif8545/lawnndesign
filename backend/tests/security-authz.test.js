// Auth-pipeline security tests (vitest). Exercises the REAL requireAuth/optionalAuth/
// requireRole middleware against forged, expired, revoked and privilege-mismatched
// tokens. Prisma is mocked so we test the auth logic, not the DB.
// Run on your machine with:  npm test
import { describe, it, expect, vi, beforeEach } from 'vitest'

// A strong secret so requireAuth's jwt.verify has something to verify against.
process.env.JWT_SECRET = 'test-secret-that-is-definitely-long-enough-32+'

// Mock the singleton Prisma client BEFORE the middleware imports it.
vi.mock('../src/lib/prisma.js', () => ({
  default: { user: { findUnique: vi.fn() } },
}))

const jwt = (await import('jsonwebtoken')).default
const prisma = (await import('../src/lib/prisma.js')).default
const { requireAuth, optionalAuth, requireRole } = await import('../src/middleware/requireAuth.js')

const SECRET = process.env.JWT_SECRET
const sign = (payload, opts = {}) => jwt.sign(payload, SECRET, opts)

function mockRes() {
  return {
    statusCode: null, body: null,
    status(c) { this.statusCode = c; return this },
    json(p) { this.body = p; return this },
  }
}
// Invoke an (async) middleware and report whether it called next().
async function run(mw, req) {
  const res = mockRes()
  let nexted = false
  await mw(req, res, () => { nexted = true })
  return { res, nexted }
}

const activeUser = { id: 'u1', email: 'a@x.com', role: 'student', suspended: false, tokenVersion: 0 }
beforeEach(() => { prisma.user.findUnique.mockReset() })

describe('requireAuth — token rejection (attacker paths)', () => {
  it('401 when the Authorization header is missing', async () => {
    const { res, nexted } = await run(requireAuth, { headers: {} })
    expect(nexted).toBe(false)
    expect(res.statusCode).toBe(401)
  })

  it('401 on a malformed / garbage bearer token — and never touches the DB', async () => {
    const { res, nexted } = await run(requireAuth, { headers: { authorization: 'Bearer not.a.jwt' } })
    expect(nexted).toBe(false)
    expect(res.statusCode).toBe(401)
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('401 on an EXPIRED token', async () => {
    const token = sign({ id: 'u1', tv: 0 }, { expiresIn: '-1s' })
    const { res, nexted } = await run(requireAuth, { headers: { authorization: `Bearer ${token}` } })
    expect(nexted).toBe(false)
    expect(res.statusCode).toBe(401)
  })

  it('401 on a token signed with the WRONG secret (forgery attempt)', async () => {
    const forged = jwt.sign({ id: 'u1', tv: 0 }, 'attacker-guessed-secret')
    const { res, nexted } = await run(requireAuth, { headers: { authorization: `Bearer ${forged}` } })
    expect(nexted).toBe(false)
    expect(res.statusCode).toBe(401)
  })

  it('401 when the account was DELETED (prisma returns null)', async () => {
    prisma.user.findUnique.mockResolvedValue(null)
    const token = sign({ id: 'u1', tv: 0 })
    const { res, nexted } = await run(requireAuth, { headers: { authorization: `Bearer ${token}` } })
    expect(nexted).toBe(false)
    expect(res.statusCode).toBe(401)
  })

  it('401 when the account is SUSPENDED (instant ban takes effect)', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...activeUser, suspended: true })
    const token = sign({ id: 'u1', tv: 0 })
    const { res, nexted } = await run(requireAuth, { headers: { authorization: `Bearer ${token}` } })
    expect(nexted).toBe(false)
    expect(res.statusCode).toBe(401)
  })

  it('401 when tokenVersion was bumped (password change revokes old sessions)', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...activeUser, tokenVersion: 5 })
    const staleToken = sign({ id: 'u1', tv: 0 })   // minted before the bump
    const { res, nexted } = await run(requireAuth, { headers: { authorization: `Bearer ${staleToken}` } })
    expect(nexted).toBe(false)
    expect(res.statusCode).toBe(401)
  })

  it('PASSES a valid token for an active user and sets req.user (no password/tokenVersion leak)', async () => {
    prisma.user.findUnique.mockResolvedValue(activeUser)
    const token = sign({ id: 'u1', tv: 0 })
    const req = { headers: { authorization: `Bearer ${token}` } }
    const { nexted } = await run(requireAuth, req)
    expect(nexted).toBe(true)
    expect(req.user).toEqual({ id: 'u1', email: 'a@x.com', role: 'student' })
  })
})

describe('optionalAuth — never blocks, but ignores bad/suspended tokens', () => {
  it('proceeds anonymously with no token', async () => {
    const req = { headers: {} }
    const { nexted } = await run(optionalAuth, req)
    expect(nexted).toBe(true)
    expect(req.user).toBeUndefined()
  })
  it('proceeds anonymously on a forged token (does not attach a user)', async () => {
    const req = { headers: { authorization: 'Bearer garbage' } }
    const { nexted } = await run(optionalAuth, req)
    expect(nexted).toBe(true)
    expect(req.user).toBeUndefined()
  })
  it('treats a suspended account as anonymous', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...activeUser, suspended: true })
    const req = { headers: { authorization: `Bearer ${sign({ id: 'u1', tv: 0 })}` } }
    const { nexted } = await run(optionalAuth, req)
    expect(nexted).toBe(true)
    expect(req.user).toBeUndefined()
  })
})

describe('requireRole — privilege gate', () => {
  const call = (roles, userRole) => {
    const res = mockRes()
    let called = false
    requireRole(...roles)(userRole ? { user: { role: userRole } } : {}, res, () => { called = true })
    return { res, called }
  }
  it('a student CANNOT reach an admin-only route', () => {
    const { res, called } = call(['admin'], 'student')
    expect(called).toBe(false); expect(res.statusCode).toBe(403)
  })
  it('a client CANNOT reach an admin-only route', () => {
    const { res, called } = call(['admin'], 'client')
    expect(called).toBe(false); expect(res.statusCode).toBe(403)
  })
  it('an admin CAN reach an admin-only route', () => {
    expect(call(['admin'], 'admin').called).toBe(true)
  })
  it('multi-role gates admit any listed role but no others', () => {
    expect(call(['client', 'admin'], 'client').called).toBe(true)
    expect(call(['client', 'admin'], 'student').called).toBe(false)
  })
  it('an unauthenticated request is forbidden', () => {
    const { res, called } = call(['student'], null)
    expect(called).toBe(false); expect(res.statusCode).toBe(403)
  })
})

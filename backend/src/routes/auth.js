import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { normalizeEmail } from '../lib/sanitize.js'

const router = Router()

// A throwaway bcrypt hash used to equalise login response time when the email
// isn't found, so attackers can't distinguish "no such user" from "wrong
// password" by timing. Generated once at startup.
const DUMMY_HASH = bcrypt.hashSync('lawnn-timing-equalizer', 12)

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// ── POST /auth/register ───────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { password, name, role = 'student', university, dept, year } = req.body
  const email = normalizeEmail(req.body.email)

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, and name are required' })
  }
  if (role === 'student') {
    return res.status(403).json({ error: 'Student accounts are created by the Lawnn team. Check your email for your sign-in credentials.' })
  }
  if (!['client'].includes(role)) {
    return res.status(400).json({ error: 'role must be client' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' })
  }

  const hash = await bcrypt.hash(password, 12)
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 4).toUpperCase()

  const user = await prisma.user.create({
    data: {
      email,
      password: hash,
      name,
      role,
      initials,
      // Auto-create a Profile for students
      ...(role === 'student' && {
        profile: {
          create: {
            university: university || '',
            dept: dept || '',
            year: year ? parseInt(year) : null,
          },
        },
      }),
    },
    include: { profile: true },
  })

  const token = signToken(user)
  return res.status(201).json({ token, user: safeUser(user) })
})

// ── POST /auth/login ──────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { password } = req.body
  const email = normalizeEmail(req.body.email)
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  })

  // Always run a bcrypt comparison (against a dummy hash when the user doesn't
  // exist) so the response time doesn't reveal whether the email is registered.
  const valid = await bcrypt.compare(password, user?.password || DUMMY_HASH)
  if (!user || !valid) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  if (user.suspended) {
    return res.status(403).json({ error: 'Your account has been suspended. Please contact Lawnn support.' })
  }

  const token = signToken(user)
  return res.json({ token, user: safeUser(user) })
})

// ── POST /auth/accept-invite ──────────────────────────────────────────────────
// Public — a newly-invited student sets their initial password using a
// one-time token issued by /admin/students.
router.post('/accept-invite', async (req, res) => {
  const { token, password } = req.body

  if (!token || !password) {
    return res.status(400).json({ error: 'token and password are required' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  const invite = await prisma.studentInvite.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  })
  // Generic message — don't leak whether the token existed.
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return res.status(400).json({ error: 'This setup link is invalid or has expired.' })
  }

  const hash = await bcrypt.hash(password, 12)

  const [, , user] = await prisma.$transaction([
    prisma.user.update({ where: { id: invite.userId }, data: { password: hash } }),
    prisma.studentInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
    prisma.user.findUnique({ where: { id: invite.userId }, include: { profile: true } }),
  ])

  const jwtToken = signToken(user)
  return res.json({ token: jwtToken, user: safeUser(user) })
})

// ── GET /auth/me ──────────────────────────────────────────────────────────────
// Returns the current user from a valid token — useful for page-reload hydration
router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { profile: true },
  })
  if (!user) return res.status(404).json({ error: 'User not found' })
  return res.json({ user: safeUser(user) })
})

// Strip password before sending user data to the client
function safeUser(user) {
  const { password, ...rest } = user
  return rest
}

export default router

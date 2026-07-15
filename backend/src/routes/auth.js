import { Router } from 'express'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { normalizeEmail, validatePassword, clampText } from '../lib/sanitize.js'
import { hashPassword, verifyPassword } from '../lib/password.js'
import { cooldownMs, waitMessage } from '../lib/loginThrottle.js'
import { turnstileEnabled, verifyTurnstile, CAPTCHA_AFTER_FAILURES } from '../lib/turnstile.js'
import { notify } from '../lib/notify.js'
import { cookieAuthEnabled, setSessionCookies, clearSessionCookies } from '../lib/cookies.js'

const router = Router()

// Issue the session + CSRF cookies when cookie auth is enabled. No-op otherwise,
// so today's header/localStorage flow (which still receives the token in the
// body) is unchanged.
function issueSession(res, token) {
  if (cookieAuthEnabled()) setSessionCookies(res, token)
}

// A throwaway Argon2 hash used to equalise login response time when the email
// isn't found, so attackers can't distinguish "no such user" from "wrong
// password" by timing. Generated once at startup (top-level await).
const DUMMY_HASH = await hashPassword('lawnn-timing-equalizer')

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, tv: user.tokenVersion ?? 0 },
    process.env.JWT_SECRET,
    // Shorter default lifetime limits how long a stolen/leaked token is usable.
    // (Suspension, deletion, and role changes already take effect immediately —
    // requireAuth re-reads the live account every request — so this only bounds
    // the raw-token-theft window.) Tune via JWT_EXPIRES_IN; raise it if more
    // frequent re-logins are a problem before a refresh-token flow exists.
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  )
}

// ── POST /auth/register ───────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { password, role = 'student', university, dept, year } = req.body
  const name = clampText(req.body.name, 120)
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

  // Bot protection: require a valid Turnstile token before creating an account.
  // Stops bulk automated client sign-ups. No-op when Turnstile isn't configured
  // (TURNSTILE_SECRET unset), so local/dev registration still works.
  if (turnstileEnabled()) {
    const ok = await verifyTurnstile(req.body.turnstileToken, req.ip)
    if (!ok) {
      return res.status(400).json({ error: 'Please complete the verification challenge.', captchaRequired: true })
    }
  }

  const pwError = validatePassword(password)
  if (pwError) return res.status(400).json({ error: pwError })

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' })
  }

  const hash = await hashPassword(password)
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 4).toUpperCase()

  let user
  try {
    user = await prisma.user.create({
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
  } catch (err) {
    // Unique-email race: two simultaneous registrations slipping past the
    // pre-check must 409, not crash the process as an unhandled rejection.
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }
    console.error(err)
    return res.status(500).json({ error: 'Internal server error' })
  }

  const token = signToken(user)
  issueSession(res, token)
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

  // Throttle: if this account is in a cooldown from repeated failures, refuse
  // early (don't even check the password). Self-clears once the timer passes.
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    return res.status(429).json({ error: waitMessage(user.lockedUntil - new Date()) })
  }

  // CAPTCHA gate: once an account has accumulated a few failures, require a
  // valid Turnstile token before we'll even check the password. Stops automated
  // password-guessing. (No-op when Turnstile isn't configured.)
  const captchaRequired = turnstileEnabled() && (user?.failedLoginAttempts || 0) >= CAPTCHA_AFTER_FAILURES
  if (captchaRequired) {
    const ok = await verifyTurnstile(req.body.turnstileToken, req.ip)
    if (!ok) {
      return res.status(400).json({ error: 'Please complete the verification challenge.', captchaRequired: true })
    }
  }

  // Always run a hash verification (against a dummy hash when the user doesn't
  // exist) so the response time doesn't reveal whether the email is registered.
  const { valid, needsRehash } = await verifyPassword(password, user?.password || DUMMY_HASH)
  if (!user || !valid) {
    // Record the failure on a real account and start/extend the cooldown once
    // the threshold is crossed. Best-effort — never let this throw the request.
    let willNeedCaptcha = false
    if (user) {
      const failed = (user.failedLoginAttempts || 0) + 1
      const cd = cooldownMs(failed)
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: failed, lockedUntil: cd > 0 ? new Date(Date.now() + cd) : null },
      }).catch(() => {})
      willNeedCaptcha = turnstileEnabled() && failed >= CAPTCHA_AFTER_FAILURES
    }
    // Signal the frontend to show the CAPTCHA on the next attempt.
    return res.status(401).json({ error: 'Invalid email or password', captchaRequired: willNeedCaptcha })
  }

  if (user.suspended) {
    return res.status(403).json({ error: 'Your account has been suspended. Please contact Lawnn support.' })
  }

  // Successful login: clear any failure state, and transparently upgrade a
  // legacy bcrypt hash to Argon2id now that we have the verified plaintext.
  // One write covers both. Best-effort — never block a valid login.
  if (needsRehash || user.failedLoginAttempts || user.lockedUntil) {
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          ...(needsRehash ? { password: await hashPassword(password) } : {}),
        },
      })
    } catch { /* non-fatal */ }
  }

  // Tell the user a sign-in happened, so a stolen password gets noticed.
  notify(user.id, {
    type: 'check',
    title: 'New sign-in to your account',
    body: `Signed in on ${new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}. If this wasn’t you, change your password.`,
    link: 'profile',
  })

  const token = signToken(user)
  issueSession(res, token)
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
  const pwError = validatePassword(password)
  if (pwError) return res.status(400).json({ error: pwError })

  const invite = await prisma.studentInvite.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  })
  // Generic message — don't leak whether the token existed.
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return res.status(400).json({ error: 'This setup link is invalid or has expired.' })
  }

  const hash = await hashPassword(password)

  const [, , user] = await prisma.$transaction([
    prisma.user.update({ where: { id: invite.userId }, data: { password: hash } }),
    prisma.studentInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
    prisma.user.findUnique({ where: { id: invite.userId }, include: { profile: true } }),
  ])

  const jwtToken = signToken(user)
  issueSession(res, jwtToken)
  return res.json({ token: jwtToken, user: safeUser(user) })
})

// ── POST /auth/logout ─────────────────────────────────────────────────────────
// Clears the session cookies. Harmless (and a no-op for the body) when cookie
// auth is off; the header/localStorage client just drops its own token.
router.post('/logout', (req, res) => {
  if (cookieAuthEnabled()) clearSessionCookies(res)
  return res.json({ ok: true })
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

// ── POST /auth/change-password ────────────────────────────────────────────────
// Set a new password (and optionally a name) for the logged-in user. Clears the
// mustChangePassword flag, so it also powers the forced first-login setup for
// students added by email.
router.post('/change-password', requireAuth, async (req, res) => {
  const { newPassword, name, currentPassword } = req.body
  const pwError = validatePassword(newPassword)
  if (pwError) return res.status(400).json({ error: pwError })

  // For an established account, require the current password — so a leaked or
  // borrowed token can't silently change the password (and lock the owner out)
  // without knowing the existing one. The forced first-login flow is exempt:
  // those users (mustChangePassword) are setting their password for the first
  // time and have only the temporary one.
  const current = await prisma.user.findUnique({
    where:  { id: req.user.id },
    select: { password: true, mustChangePassword: true },
  })
  if (!current) return res.status(404).json({ error: 'User not found' })
  if (!current.mustChangePassword) {
    if (!currentPassword) {
      return res.status(400).json({ error: 'Your current password is required' })
    }
    const { valid } = await verifyPassword(currentPassword, current.password)
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' })
  }

  const hash = await hashPassword(newPassword)
  // Bump tokenVersion so every OTHER existing session for this account is
  // invalidated (a changed password should log out anyone else holding a token).
  const data = { password: hash, mustChangePassword: false, tokenVersion: { increment: 1 } }
  if (typeof name === 'string' && name.trim()) {
    const clean = clampText(name, 120)
    data.name = clean
    data.initials = clean.split(' ').map(w => w[0]).join('').slice(0, 4).toUpperCase()
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data,
    include: { profile: true },
  })
  // Re-issue a token for THIS session against the new tokenVersion, so the user
  // who just changed their password stays logged in while others are kicked.
  const token = signToken(user)
  issueSession(res, token)
  return res.json({ user: safeUser(user), token })
})

// Strip the password hash and internal auth bookkeeping before sending user
// data to the client — these never need to leave the server.
function safeUser(user) {
  const { password, failedLoginAttempts, lockedUntil, tokenVersion, ...rest } = user
  return rest
}

export default router

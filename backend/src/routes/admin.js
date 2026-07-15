import { Router } from 'express'
import { hashPassword } from '../lib/password.js'
import crypto from 'crypto'
import prisma from '../lib/prisma.js'
import { requireAuth, requireRole } from '../middleware/requireAuth.js'
import { normalizeEmail, validatePassword, generatePassword, clampText } from '../lib/sanitize.js'
import { notify } from '../lib/notify.js'
import { emailUser, SITE_URL } from '../lib/email.js'
import { runJobDigest } from '../lib/jobDigest.js'

const router = Router()

// All admin routes require auth + admin role
router.use(requireAuth, requireRole('admin'))

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

function buildInviteUrl(token) {
  // Use the first allowed frontend origin as the canonical link host.
  const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')[0]
    .trim()
  return `${frontendBase}/?token=${token}`
}

// ── POST /admin/students ──────────────────────────────────────────────────────
// Invite a new student. Admin does NOT set the password — the student does,
// via the one-time setup link returned in the response.
router.post('/students', async (req, res) => {
  const { university, dept, year, isGrad = false } = req.body
  const name = clampText(req.body.name, 120)
  const email = normalizeEmail(req.body.email)

  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' })
  }

  // Placeholder password — unguessable random bytes the student never uses.
  // Replaced when they accept the invite.
  const placeholder      = crypto.randomBytes(48).toString('hex')
  const placeholderHash  = await hashPassword(placeholder)
  const rawToken         = crypto.randomBytes(32).toString('hex')
  const tokenHash        = hashToken(rawToken)
  const initials         = name.split(' ').map(w => w[0]).join('').slice(0, 4).toUpperCase()
  const expiresAt        = new Date(Date.now() + INVITE_TTL_MS)

  const user = await prisma.user.create({
    data: {
      email,
      password: placeholderHash,
      name,
      role: 'student',
      initials,
      profile: {
        create: {
          university: university || '',
          dept:       dept       || '',
          year:       year ? parseInt(year) : null,
          isGrad:     Boolean(isGrad),
        },
      },
      invite: {
        create: { tokenHash, expiresAt },
      },
    },
    include: { profile: true },
  })

  const { password: _pw, ...safeUser } = user
  return res.status(201).json({
    user: safeUser,
    inviteUrl: buildInviteUrl(rawToken),
    expiresAt: expiresAt.toISOString(),
  })
})

// ── POST /admin/students/bulk ─────────────────────────────────────────────────
// Enlist accepted students by email — one or many. Each gets a generated
// password and must change it on first login. Names are placeholders derived
// from the email; the student sets their real name during first-login setup.
// Body: { emails: string[] | "a@x.com, b@y.com" }
// Returns: { created: [{ email, password }], skipped: [{ email, reason }] }
router.post('/students/bulk', async (req, res) => {
  const raw = req.body?.emails
  const list = Array.isArray(raw) ? raw : String(raw || '').split(/[\s,;]+/)
  const emails = [...new Set(list.map(normalizeEmail).filter(Boolean))]

  if (emails.length === 0) {
    return res.status(400).json({ error: 'Provide at least one email address.' })
  }
  if (emails.length > 200) {
    return res.status(400).json({ error: 'Too many at once — add up to 200 emails per batch.' })
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const created = []
  const skipped = []

  for (const email of emails) {
    if (!emailRe.test(email)) { skipped.push({ email, reason: 'invalid email' }); continue }
    try {
      const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
      if (existing) { skipped.push({ email, reason: 'already exists' }); continue }

      const password = generatePassword() // strong, policy-compliant temporary password
      const hash     = await hashPassword(password)
      // Placeholder name from the email's local part; the student fixes it at setup.
      const local    = email.split('@')[0].replace(/[._-]+/g, ' ').trim()
      const name     = local ? local.replace(/\b\w/g, c => c.toUpperCase()) : 'New Student'
      const initials = name.split(' ').map(w => w[0]).join('').slice(0, 4).toUpperCase() || 'NS'

      await prisma.user.create({
        data: {
          email,
          password: hash,
          name,
          role: 'student',
          initials,
          mustChangePassword: true,
          profile: { create: {} },
        },
      })
      created.push({ email, password })
    } catch {
      skipped.push({ email, reason: 'could not create' })
    }
  }

  return res.status(201).json({ created, skipped })
})

// ── POST /admin/students/:id/reinvite ─────────────────────────────────────────
// Regenerate a setup link for a student who hasn't accepted yet (or whose
// link expired). Returns a fresh invite URL.
router.post('/students/:id/reinvite', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { invite: true },
  })
  if (!user || user.role !== 'student') return res.status(404).json({ error: 'Student not found' })
  if (user.invite?.acceptedAt) {
    return res.status(409).json({ error: 'Student has already set their password' })
  }

  const rawToken  = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS)

  await prisma.studentInvite.upsert({
    where:  { userId: user.id },
    update: { tokenHash, expiresAt, acceptedAt: null },
    create: { userId: user.id, tokenHash, expiresAt },
  })

  return res.json({
    inviteUrl: buildInviteUrl(rawToken),
    expiresAt: expiresAt.toISOString(),
  })
})

// ── GET /admin/students ───────────────────────────────────────────────────────
// List all student accounts (with invite status so admin can see who hasn't
// activated yet).
router.get('/students', async (req, res) => {
  const students = await prisma.user.findMany({
    where: { role: 'student' },
    include: {
      profile: { include: { skills: true, portfolio: true } },
      invite:  { select: { expiresAt: true, acceptedAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return res.json(students.map(({ password, ...u }) => u))
})

// ── POST /admin/students/:id/approve ──────────────────────────────────────────
// Approve a student's completed profile: makes them publicly visible in the
// directory and able to apply to jobs. Notifies the student.
router.post('/students/:id/approve', async (req, res) => {
  const student = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, role: true, approved: true },
  })
  if (!student || student.role !== 'student') return res.status(404).json({ error: 'Student not found' })
  if (student.approved) return res.status(409).json({ error: 'Student is already approved' })

  await prisma.user.update({ where: { id: student.id }, data: { approved: true } })
  await notify(student.id, {
    type: 'check',
    title: 'Your profile is approved! 🎉',
    body: 'Welcome aboard — your profile is now live and you can start applying to jobs.',
    link: 'jobs',
  })
  await emailUser(student.id, {
    subject: 'Your Lawnn profile is approved! 🎉',
    heading: "You're in — your profile is live",
    bodyHtml: `<p>Welcome aboard! The Lawnn team has reviewed and approved your profile. You now appear in the talent directory and can apply to client projects.</p>`,
    cta: { label: 'Browse open jobs', url: SITE_URL },
  })
  return res.json({ ok: true })
})

// ── POST /admin/students/:id/reject ───────────────────────────────────────────
// Reject a student's onboarding with a reason: notifies + emails them the reason
// and suspends the account (reversible — an admin can un-suspend later).
router.post('/students/:id/reject', async (req, res) => {
  const reason = clampText(req.body.reason, 1000)
  if (!reason) return res.status(400).json({ error: 'A rejection reason is required' })
  const student = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, role: true },
  })
  if (!student || student.role !== 'student') return res.status(404).json({ error: 'Student not found' })

  await prisma.user.update({ where: { id: student.id }, data: { approved: false, suspended: true } })
  await notify(student.id, {
    type: 'info',
    title: 'Update on your Lawnn onboarding',
    body: reason,
    link: 'home',
  })
  await emailUser(student.id, {
    subject: 'Update on your Lawnn onboarding',
    heading: 'An update on your onboarding',
    bodyHtml: `<p>Thank you for setting up your Lawnn profile. After review, we aren't able to approve it as it stands right now. Here's the feedback from our team:</p>
      <blockquote style="border-left:3px solid #ff9044;margin:12px 0;padding:6px 14px;background:#ff90440d">${reason}</blockquote>
      <p>We'd genuinely love to see you on Lawnn — once you've addressed the above, reply to this email and we'll take another look.</p>`,
  })
  return res.json({ ok: true })
})

// ── POST /admin/run-job-digest ────────────────────────────────────────────────
// Send the open-jobs digest to all approved students right now. (Also runnable on
// a schedule via scripts/runDigest.js.) Returns a summary.
router.post('/run-job-digest', async (req, res) => {
  const result = await runJobDigest()
  return res.json(result)
})

// ── GET /admin/users ──────────────────────────────────────────────────────────
// Every user except the requesting admin — so an admin can DM anyone at any time.
router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany({
    where: { id: { not: req.user.id } },
    select: { id: true, name: true, initials: true, avatarColor: true, role: true, suspended: true },
    orderBy: { createdAt: 'desc' },
  })
  return res.json(users)
})

// ── POST /admin/clients ───────────────────────────────────────────────────────
// Create a client account directly. Unlike students (invite flow), the admin
// sets the password and shares the credentials with the client.
router.post('/clients', async (req, res) => {
  const { password } = req.body
  const name = clampText(req.body.name, 120)
  const email = normalizeEmail(req.body.email)
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' })
  }
  const pwError = validatePassword(password)
  if (pwError) return res.status(400).json({ error: pwError })

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' })
  }

  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 4).toUpperCase()
  const hash     = await hashPassword(password)
  const user = await prisma.user.create({
    data: { email, password: hash, name, role: 'client', initials },
  })

  const { password: _pw, ...safeUser } = user
  return res.status(201).json(safeUser)
})

// ── PATCH /admin/users/:id/suspend ────────────────────────────────────────────
// Suspend or reinstate a user. A suspended user can't log in, is kicked from any
// active session on their next request, and disappears from all public views
// (their data is retained for admins). Reversible.
router.patch('/users/:id/suspend', async (req, res) => {
  const { suspended } = req.body
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot suspend your own account.' })
  }
  const user = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!user) return res.status(404).json({ error: 'User not found' })
  if (user.role === 'admin') {
    return res.status(400).json({ error: 'Admin accounts cannot be suspended.' })
  }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data:  { suspended: Boolean(suspended) },
  })
  const { password: _pw, ...safe } = updated
  return res.json(safe)
})

// ── DELETE /admin/users/:id ───────────────────────────────────────────────────
// Remove any user (student or client). Admins can't delete themselves. Users
// with active jobs/projects/etc. are protected by DB foreign keys — surface a
// friendly conflict rather than a 500.
router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account.' })
  }
  const user = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!user) return res.status(404).json({ error: 'User not found' })

  try {
    await prisma.user.delete({ where: { id: req.params.id } })
    return res.status(204).send()
  } catch (err) {
    if (err.code === 'P2003') {
      return res.status(409).json({
        error: 'This user still has active jobs, projects, or other records and cannot be removed yet.',
      })
    }
    console.error(err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// ── DELETE /admin/students/:id ────────────────────────────────────────────────
router.delete('/students/:id', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } })
  if (!user || user.role !== 'student') {
    return res.status(404).json({ error: 'Student not found' })
  }
  try {
    await prisma.user.delete({ where: { id: req.params.id } })
    return res.status(204).send()
  } catch (err) {
    if (err.code === 'P2003') {
      return res.status(409).json({
        error: 'This student still has active projects or other records and cannot be removed yet.',
      })
    }
    console.error(err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

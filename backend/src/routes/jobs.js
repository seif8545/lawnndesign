import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth, requireRole, optionalAuth } from '../middleware/requireAuth.js'
import { signPrivateRead } from './uploads.js'

const router = Router()

// ── GET /jobs ─────────────────────────────────────────────────────────────────
// Public — list live jobs. Admins (when authenticated) also see pending ones.
router.get('/', optionalAuth, async (req, res) => {
  const { category, skill } = req.query
  const isAdmin = req.user?.role === 'admin'

  const jobs = await prisma.job.findMany({
    where: {
      status: isAdmin ? undefined : 'live',
      ...(category && { category: { contains: category, mode: 'insensitive' } }),
      ...(skill && { skills: { some: { skill: { contains: skill, mode: 'insensitive' } } } }),
    },
    include: {
      client: { select: { id: true, name: true } },
      skills: true,
      attachments: true,
      _count: { select: { applications: true } },
    },
    orderBy: [{ vip: 'desc' }, { createdAt: 'desc' }],
  })

  return res.json(jobs)
})

// ── GET /jobs/:id ─────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: {
      client: { select: { id: true, name: true } },
      skills: true,
      attachments: true,
      _count: { select: { applications: true } },
    },
  })
  if (!job) return res.status(404).json({ error: 'Job not found' })
  return res.json(job)
})

// ── POST /jobs ────────────────────────────────────────────────────────────────
// Clients and admins can post jobs
router.post('/', requireAuth, requireRole('client', 'admin'), async (req, res) => {
  const { title, brief, budget, budgetType, category, vip, skills = [], attachments = [] } = req.body

  if (!title || !brief || !budget) {
    return res.status(400).json({ error: 'title, brief, and budget are required' })
  }

  const job = await prisma.job.create({
    data: {
      clientId: req.user.id,
      title,
      brief,
      budget: parseInt(budget),
      budgetType: budgetType || 'Fixed',
      category: category || 'Visuals & Branding',
      vip: Boolean(vip),
      // Admins post live; clients go to pending review
      status: req.user.role === 'admin' ? 'live' : 'pending',
      skills: {
        create: skills.map(skill => ({ skill })),
      },
      attachments: {
        create: attachments.map(a => ({
          name: a.name,
          url: a.url,
          mimeType: a.mimeType || a.type || 'application/octet-stream',
        })),
      },
    },
    include: { skills: true, attachments: true },
  })

  return res.status(201).json(job)
})

// ── PATCH /jobs/:id/status ────────────────────────────────────────────────────
// Admin only — approve (pending → live) or close a job
router.patch('/:id/status', requireAuth, requireRole('admin'), async (req, res) => {
  const { status } = req.body
  const valid = ['live', 'closed', 'filled', 'pending']
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` })
  }

  const job = await prisma.job.update({
    where: { id: req.params.id },
    data: { status },
  })
  return res.json(job)
})

// ── DELETE /jobs/:id ──────────────────────────────────────────────────────────
// Admin: unrestricted.
// Client (job owner): blocked if the job already has someone hired (status =
// 'filled'; a Project exists) or any application is still pending. Rejected
// applications don't block — they're terminal records. The client must reject
// pending apps first (see POST /:jobId/applications/:appId/reject below).
router.delete('/:id', requireAuth, async (req, res) => {
  const job = await prisma.job.findUnique({
    where:   { id: req.params.id },
    include: { applications: { select: { status: true } } },
  })
  if (!job) return res.status(404).json({ error: 'Job not found' })

  if (req.user.role !== 'admin' && job.clientId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  // Owner-side guardrails. Admins can bulldoze through these.
  if (req.user.role !== 'admin') {
    if (job.status === 'filled') {
      return res.status(409).json({ error: 'This job is already filled — open the project instead.' })
    }
    const pending = job.applications.filter(a => a.status === 'pending').length
    if (pending > 0) {
      return res.status(409).json({
        error: `Reject the ${pending} pending application${pending === 1 ? '' : 's'} before deleting this job.`,
      })
    }
  }

  await prisma.job.delete({ where: { id: req.params.id } })
  return res.status(204).send()
})

// ── POST /jobs/:jobId/applications/:appId/reject ─────────────────────────────
// Job owner (client) or admin can reject a pending application.
router.post('/:jobId/applications/:appId/reject', requireAuth, async (req, res) => {
  const { jobId, appId } = req.params

  const [job, application] = await Promise.all([
    prisma.job.findUnique({ where: { id: jobId } }),
    prisma.application.findUnique({ where: { id: appId } }),
  ])
  if (!job) return res.status(404).json({ error: 'Job not found' })
  if (!application || application.jobId !== jobId) {
    return res.status(404).json({ error: 'Application not found for this job' })
  }
  if (req.user.role !== 'admin' && job.clientId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  if (application.status !== 'pending') {
    return res.status(409).json({ error: `Application is already ${application.status}` })
  }

  const updated = await prisma.application.update({
    where: { id: appId },
    data:  { status: 'rejected' },
  })
  return res.json(updated)
})

// ── POST /jobs/:id/applications ───────────────────────────────────────────────
// Students apply to a job
router.post('/:id/applications', requireAuth, requireRole('student'), async (req, res) => {
  const { note, files = [] } = req.body

  if (!note) return res.status(400).json({ error: 'Application note is required' })

  const job = await prisma.job.findUnique({ where: { id: req.params.id } })
  if (!job || job.status !== 'live') {
    return res.status(404).json({ error: 'Job not found or not accepting applications' })
  }

  // Check for duplicate application
  const existing = await prisma.application.findUnique({
    where: { jobId_userId: { jobId: req.params.id, userId: req.user.id } },
  })
  if (existing) {
    return res.status(409).json({ error: 'You have already applied to this job' })
  }

  const application = await prisma.application.create({
    data: {
      jobId: req.params.id,
      userId: req.user.id,
      note,
      files: {
        create: files.map(f => ({
          name: f.name,
          url: f.url,
          mimeType: f.mimeType || f.type || 'application/octet-stream',
        })),
      },
    },
    include: { files: true },
  })

  return res.status(201).json(application)
})

// ── POST /jobs/:jobId/applications/:appId/accept ─────────────────────────────
// Hire a talent: create a Project from the accepted application, mark the
// job as filled, and update application statuses. Wrapped in a transaction.
router.post('/:jobId/applications/:appId/accept', requireAuth, async (req, res) => {
  const { jobId, appId } = req.params

  const [job, application] = await Promise.all([
    prisma.job.findUnique({ where: { id: jobId } }),
    prisma.application.findUnique({ where: { id: appId } }),
  ])
  if (!job) return res.status(404).json({ error: 'Job not found' })
  if (!application || application.jobId !== jobId) {
    return res.status(404).json({ error: 'Application not found for this job' })
  }
  if (req.user.role !== 'admin' && job.clientId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const project = await prisma.$transaction(async tx => {
    // 1. Create project linked to the talent
    const newProject = await tx.project.create({
      data: {
        clientId: job.clientId,
        talentId: application.userId,
        title:    job.title,
        brief:    job.brief,
        budget:   job.budget,
        vip:      job.vip,
        status:   'offer_accepted',
      },
    })
    // 2. Mark this application accepted; reject the rest
    await tx.application.update({
      where: { id: application.id },
      data:  { status: 'accepted' },
    })
    await tx.application.updateMany({
      where: { jobId, id: { not: application.id }, status: 'pending' },
      data:  { status: 'rejected' },
    })
    // 3. Mark the job filled
    await tx.job.update({ where: { id: jobId }, data: { status: 'filled' } })
    return newProject
  })

  res.status(201).json(project)
})

// ── GET /jobs/:id/applications ────────────────────────────────────────────────
// Job owner (client) or admin can see all applications
router.get('/:id/applications', requireAuth, async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id } })
  if (!job) return res.status(404).json({ error: 'Job not found' })

  if (req.user.role !== 'admin' && job.clientId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const applications = await prisma.application.findMany({
    where: { jobId: req.params.id },
    include: {
      user: { select: { id: true, name: true, initials: true, avatarColor: true } },
      files: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Application files live in a private bucket — `file.url` stores the storage
  // path. Swap each one for a short-lived signed URL so the (authorised) caller
  // can render it. If signing fails the entry is returned with url=null and the
  // client renders a "file unavailable" state.
  const signed = await Promise.all(
    applications.map(async a => ({
      ...a,
      files: await Promise.all(
        a.files.map(async f => {
          // Heuristic: a stored path looks like "application/<userId>/<uuid>.ext"
          // (no scheme). Anything starting with http(s):// is a legacy/public URL
          // and we pass it through untouched.
          if (!f.url || /^https?:\/\//i.test(f.url)) return f
          return { ...f, url: await signPrivateRead(f.url) }
        })
      ),
    }))
  )

  return res.json(signed)
})

export default router

import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth, requireRole, optionalAuth } from '../middleware/requireAuth.js'
import { notify } from '../lib/notify.js'
import { emailUser, emailAdmin, SITE_URL } from '../lib/email.js'
import { signPrivateRead } from './uploads.js'
import { safeUrl, nonNegativeInt, clampText } from '../lib/sanitize.js'

const router = Router()

// Payment-proof screenshots live in a private bucket; the DB stores the storage
// path. Swap those paths for short-lived signed read URLs, but only for viewers
// allowed to see them (an admin, or the client who made the payment). The talent
// never sees the client's transfer screenshots.
async function withSignedProofs(project, viewer) {
  const canSee = viewer.role === 'admin' || project.clientId === viewer.id
  // Financial screenshots get a short 10-minute read window — long enough to
  // view in the UI, short enough that a leaked URL expires quickly.
  const PROOF_TTL = 10 * 60
  return {
    ...project,
    depositProofUrl:      canSee ? await signPrivateRead(project.depositProofUrl, PROOF_TTL) : null,
    finalPaymentProofUrl: canSee ? await signPrivateRead(project.finalPaymentProofUrl, PROOF_TTL) : null,
  }
}

// Application files live in a private bucket — `file.url` stores the storage
// path. Swap each one for a short-lived signed URL. Portfolio references are
// public CDN URLs (start with http) and pass through untouched.
async function signApplicationFiles(applications) {
  return Promise.all(
    applications.map(async a => ({
      ...a,
      files: await Promise.all(
        (a.files || []).map(async f => {
          if (!f.url || /^https?:\/\//i.test(f.url)) return f
          return { ...f, url: await signPrivateRead(f.url) }
        })
      ),
    }))
  )
}

// Validate + clean an incoming files array (uploaded files or portfolio refs).
function cleanFiles(files) {
  const out = []
  for (const f of Array.isArray(files) ? files : []) {
    const url = safeUrl(f?.url)
    if (!url) return { error: 'A file has an invalid URL' }
    out.push({
      name: String(f.name || 'file'),
      url,
      mimeType: f.mimeType || f.type || 'application/octet-stream',
    })
  }
  return { files: out }
}

// ── GET /projects/board ────────────────────────────────────────────────────────
// Public — browse open projects accepting applications. Admins also see pending
// ones; a signed-in client/student additionally sees their OWN projects.
router.get('/board', optionalAuth, async (req, res) => {
  const { category, skill } = req.query
  const userId  = req.user?.id
  const isAdmin = req.user?.role === 'admin'

  const visibility = isAdmin
    ? {}
    : {
        client: { suspended: false },
        ...(userId
          ? { OR: [{ status: 'open' }, { clientId: userId }] }
          : { status: 'open' }),
      }

  const projects = await prisma.project.findMany({
    where: {
      ...visibility,
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
    take: 100,
  })

  return res.json(projects)
})

// ── GET /projects ─────────────────────────────────────────────────────────────
// The current user's projects: a client sees the ones they posted, a student
// sees the ones they were hired for, an admin sees all. Includes applications so
// the client can review them in My Projects.
router.get('/', requireAuth, async (req, res) => {
  const where =
    req.user.role === 'client'
      ? { clientId: req.user.id }
      : req.user.role === 'admin'
      ? {}
      : { talentId: req.user.id }

  const projects = await prisma.project.findMany({
    where,
    include: {
      client: { select: { id: true, name: true, initials: true, avatarColor: true } },
      talent: { select: { id: true, name: true, initials: true, avatarColor: true } },
      skills: true,
      attachments: true,
      applications: {
        include: {
          user:  { select: { id: true, name: true, initials: true, avatarColor: true } },
          files: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      reviews: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const signed = await Promise.all(
    projects.map(async p => {
      const withProofs = await withSignedProofs(p, req.user)
      // Only the owner/admin should get application files at all. Don't SIGN
      // them here — that's an N+1 Supabase call per file on every list load.
      // Public (http) portfolio refs pass through; private storage paths are
      // nulled, and the review UI fetches signed URLs on demand via
      // GET /projects/:id/applications (which still signs).
      const canSeeApps = req.user.role === 'admin' || p.clientId === req.user.id
      withProofs.applications = canSeeApps
        ? p.applications.map(a => ({
            ...a,
            files: (a.files || []).map(f =>
              f.url && !/^https?:\/\//i.test(f.url) ? { ...f, url: null } : f
            ),
          }))
        : []
      return withProofs
    })
  )
  return res.json(signed)
})

// ── GET /projects/:id ─────────────────────────────────────────────────────────
// Participants and admins see everything; any signed-in user can read an `open`
// project (to view it before applying).
router.get('/:id', requireAuth, async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: {
      client: { select: { id: true, name: true, initials: true, avatarColor: true } },
      talent: { select: { id: true, name: true, initials: true, avatarColor: true } },
      skills: true,
      attachments: true,
      reviews: { include: { author: { select: { id: true, name: true } } } },
    },
  })

  if (!project) return res.status(404).json({ error: 'Project not found' })

  const isParticipant = project.clientId === req.user.id || project.talentId === req.user.id
  const isAdmin = req.user.role === 'admin'
  if (!isParticipant && !isAdmin && project.status !== 'open') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  return res.json(await withSignedProofs(project, req.user))
})

// ── POST /projects ────────────────────────────────────────────────────────────
// A client posts a project. It starts `pending` and goes live (`open`) after an
// admin approves it. Admins posting on behalf go live immediately.
router.post('/', requireAuth, requireRole('client', 'admin'), async (req, res) => {
  const { budget, budgetType, category, vip, skills = [], attachments = [] } = req.body
  const title = clampText(req.body.title, 200)
  const brief = clampText(req.body.brief, 5000)

  if (!title || !brief || budget === undefined) {
    return res.status(400).json({ error: 'title, brief, and budget are required' })
  }
  const budgetInt = nonNegativeInt(budget)
  if (budgetInt === null) {
    return res.status(400).json({ error: 'budget must be a non-negative number' })
  }

  const { files: cleanAttachments, error } = cleanFiles(attachments)
  if (error) return res.status(400).json({ error: 'An attachment has an invalid URL' })

  const project = await prisma.project.create({
    data: {
      clientId: req.user.id,
      title,
      brief,
      budget: budgetInt,
      budgetType: clampText(budgetType, 40) || 'Fixed',
      category: clampText(category, 80) || 'Visuals & Branding',
      // VIP drives board ordering (vip desc), so only admins may set it — a
      // client can't self-promote their own project to the top.
      vip: req.user.role === 'admin' ? Boolean(vip) : false,
      status: req.user.role === 'admin' ? 'open' : 'pending',
      skills:      { create: (Array.isArray(skills) ? skills : []).slice(0, 30).map(skill => ({ skill: clampText(skill, 60) })).filter(s => s.skill) },
      attachments: { create: cleanAttachments },
    },
    include: { skills: true, attachments: true },
  })

  if (project.status === 'pending') {
    await emailAdmin({
      subject: `New project pending review: "${project.title}"`,
      heading: 'A client posted a new project',
      bodyHtml: `<p><strong>${project.title}</strong> — ${budgetInt} EGP</p><p style="color:#21326c99">It's waiting for your approval before it goes live on the board.</p>`,
      cta: { label: 'Open Lawnn admin', url: SITE_URL },
    })
  }

  return res.status(201).json(project)
})

// ── POST /projects/:id/reject ─────────────────────────────────────────────────
// Admin rejects a pending project with a reason: notifies + emails the client,
// then removes the project.
router.post('/:id/reject', requireAuth, requireRole('admin'), async (req, res) => {
  const reason = clampText(req.body.reason, 1000)
  if (!reason) return res.status(400).json({ error: 'A rejection reason is required' })
  const project = await prisma.project.findUnique({ where: { id: req.params.id } })
  if (!project) return res.status(404).json({ error: 'Project not found' })

  await notify(project.clientId, {
    type: 'info',
    title: `Your project "${project.title}" wasn't approved`,
    body: reason,
    link: 'projects',
  })
  await emailUser(project.clientId, {
    subject: `Your project "${project.title}" wasn't approved`,
    heading: 'Your project needs a few changes',
    bodyHtml: `<p>Thanks for posting "<strong>${project.title}</strong>". We weren't able to approve it as-is. Here's why:</p>
      <blockquote style="border-left:3px solid #ff9044;margin:12px 0;padding:6px 14px;background:#ff90440d">${reason}</blockquote>
      <p>You're welcome to adjust it and post again.</p>`,
    cta: { label: 'Post a new project', url: SITE_URL },
  })
  await prisma.project.delete({ where: { id: project.id } })
  return res.json({ ok: true })
})

// ── PATCH /projects/:id/status ────────────────────────────────────────────────
// Admin moderation — approve (pending → open) or close a project.
router.patch('/:id/status', requireAuth, requireRole('admin'), async (req, res) => {
  const { status } = req.body
  const valid = ['open', 'closed', 'pending']
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` })
  }

  let project
  try {
    project = await prisma.project.update({
      where: { id: req.params.id },
      data: { status },
    })
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Project not found' })
    console.error(err)
    return res.status(500).json({ error: 'Internal server error' })
  }

  if (status === 'open') {
    await notify(project.clientId, {
      type: 'check',
      title: `Your project "${project.title}" is now live`,
      body: 'Students can now see it and apply.',
      link: 'projects',
    })
    await emailUser(project.clientId, {
      subject: `Your project "${project.title}" is now live 🎉`,
      heading: 'Your project is approved',
      bodyHtml: `<p>"<strong>${project.title}</strong>" has been approved and is now live on the board. Students can see it and apply — we'll email you when the first application comes in.</p>`,
      cta: { label: 'View your projects', url: SITE_URL },
    })
  }
  return res.json(project)
})

// ── POST /projects/:id/applications ───────────────────────────────────────────
// Students apply to an open project (note + selected portfolio items / uploads).
router.post('/:id/applications', requireAuth, requireRole('student'), async (req, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.user.id }, select: { communityOnly: true, approved: true } })
  // Students are only fully active once an admin has reviewed their profile.
  if (!me?.approved) {
    return res.status(403).json({ error: 'Your profile is still under review by the Lawnn team. You can apply to jobs once it has been approved.' })
  }
  // Community-access students engage everywhere else but can't apply to jobs yet.
  if (me?.communityOnly) {
    return res.status(403).json({ error: "Your account has community access for now. Once your portfolio is stronger, the Lawnn team will unlock job applications." })
  }
  const { files = [] } = req.body
  const note = clampText(req.body.note, 5000)
  if (!note) return res.status(400).json({ error: 'Application note is required' })

  const project = await prisma.project.findUnique({ where: { id: req.params.id } })
  if (!project || project.status !== 'open') {
    return res.status(404).json({ error: 'Project not found or not accepting applications' })
  }

  const existing = await prisma.application.findUnique({
    where: { projectId_userId: { projectId: req.params.id, userId: req.user.id } },
  })
  if (existing) return res.status(409).json({ error: 'You have already applied to this project' })

  const { files: cleanApplicationFiles, error } = cleanFiles(files)
  if (error) return res.status(400).json({ error: 'An attached file has an invalid URL' })

  const application = await prisma.application.create({
    data: {
      projectId: req.params.id,
      userId: req.user.id,
      note,
      files: { create: cleanApplicationFiles },
    },
    include: { files: true },
  })

  await notify(project.clientId, {
    type: 'check',
    title: `New application on "${project.title}"`,
    body: 'A student applied — review the applications.',
    link: 'projects',
  })
  await emailUser(project.clientId, {
    subject: `New application on "${project.title}"`,
    heading: 'You have a new applicant',
    bodyHtml: `<p>A student just applied to your project "<strong>${project.title}</strong>". Log in to review their application, note and portfolio.</p>`,
    cta: { label: 'Review applications', url: SITE_URL },
  })
  await emailAdmin({
    subject: `New application on "${project.title}"`,
    heading: 'A student applied to a project',
    bodyHtml: `<p>A student applied to "<strong>${project.title}</strong>".</p>`,
  })

  return res.status(201).json(application)
})

// ── GET /projects/:id/applications ────────────────────────────────────────────
// Project owner (client) or admin can see all applications, with signed files.
router.get('/:id/applications', requireAuth, async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.id } })
  if (!project) return res.status(404).json({ error: 'Project not found' })
  if (req.user.role !== 'admin' && project.clientId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const applications = await prisma.application.findMany({
    where: { projectId: req.params.id },
    include: {
      user:  { select: { id: true, name: true, initials: true, avatarColor: true } },
      files: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return res.json(await signApplicationFiles(applications))
})

// ── POST /projects/:id/applications/:appId/accept ─────────────────────────────
// Hire an applicant: set the talent, move the project to offer_accepted, accept
// this application and reject the rest. The project itself is the engagement —
// no separate record is created.
router.post('/:id/applications/:appId/accept', requireAuth, async (req, res) => {
  const { id: projectId, appId } = req.params

  const [project, application] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.application.findUnique({ where: { id: appId } }),
  ])
  if (!project) return res.status(404).json({ error: 'Project not found' })
  if (!application || application.projectId !== projectId) {
    return res.status(404).json({ error: 'Application not found for this project' })
  }
  if (req.user.role !== 'admin' && project.clientId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  if (project.status !== 'open') {
    return res.status(409).json({ error: 'This project is no longer accepting applicants' })
  }

  const updated = await prisma.$transaction(async tx => {
    await tx.application.update({ where: { id: application.id }, data: { status: 'accepted' } })
    await tx.application.updateMany({
      where: { projectId, id: { not: application.id }, status: 'pending' },
      data:  { status: 'rejected' },
    })
    return tx.project.update({
      where: { id: projectId },
      data:  { talentId: application.userId, status: 'offer_accepted' },
      include: { client: { select: { id: true, name: true } }, talent: { select: { id: true, name: true } } },
    })
  })

  await notify(application.userId, {
    type: 'bag',
    title: `You were hired for "${project.title}"`,
    body: 'Head to My Projects — the client will arrange the deposit to get started.',
    link: 'projects',
  })
  await emailUser(application.userId, {
    subject: `You were hired for "${project.title}"! 🎉`,
    heading: "You've been hired",
    bodyHtml: `<p>Congratulations! You were selected for "<strong>${project.title}</strong>". Head to My Projects — the client will arrange the deposit to get you started.</p>`,
    cta: { label: 'Go to My Projects', url: SITE_URL },
  })

  return res.status(201).json(updated)
})

// ── POST /projects/:id/applications/:appId/reject ─────────────────────────────
router.post('/:id/applications/:appId/reject', requireAuth, async (req, res) => {
  const { id: projectId, appId } = req.params

  const [project, application] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.application.findUnique({ where: { id: appId } }),
  ])
  if (!project) return res.status(404).json({ error: 'Project not found' })
  if (!application || application.projectId !== projectId) {
    return res.status(404).json({ error: 'Application not found for this project' })
  }
  if (req.user.role !== 'admin' && project.clientId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  if (application.status !== 'pending') {
    return res.status(409).json({ error: `Application is already ${application.status}` })
  }

  const updated = await prisma.application.update({ where: { id: appId }, data: { status: 'rejected' } })
  await notify(application.userId, {
    type: 'info',
    title: 'Update on your application',
    body: "Your application wasn't selected this time. Keep applying — new projects are posted regularly.",
    link: 'jobs',
  })
  await emailUser(application.userId, {
    subject: 'Update on your Lawnn application',
    heading: 'An update on your application',
    bodyHtml: `<p>Thanks for applying. The client went with another applicant this time — but don't be discouraged. New projects are posted regularly, and your next opportunity could be around the corner.</p>`,
    cta: { label: 'Browse open jobs', url: SITE_URL },
  })
  return res.json(updated)
})

// ── POST /projects/:id/advance ────────────────────────────────────────────────
// Drive the payment/delivery lifecycle forward one step (offer_accepted onward).
// Hiring (open → offer_accepted) happens via the accept-application endpoint.
router.post('/:id/advance', requireAuth, async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.id } })
  if (!project) return res.status(404).json({ error: 'Project not found' })

  const isTalent = project.talentId === req.user.id
  const isAdmin  = req.user.role === 'admin'

  let data = {}
  let nextStatus

  // Payments are handled off-platform (manual InstaPay transfer to Lawnn). The
  // two money steps — confirming the deposit and confirming the final balance —
  // are gated to admins, who verify the transfer landed before advancing. The
  // client signals "I've sent it" separately via POST /:id/payment-sent.
  switch (project.status) {
    case 'offer_accepted':
      if (!isAdmin) return res.status(403).json({ error: 'Only Lawnn can confirm the deposit' })
      nextStatus = 'in_progress'
      data = { depositAmount: Math.floor(project.budget * 0.5), depositPaidAt: new Date() }
      break

    case 'deposit_paid':
      if (!isAdmin) return res.status(403).json({ error: 'Only Lawnn can confirm the deposit' })
      nextStatus = 'in_progress'
      break

    case 'in_progress': {
      if (!isTalent) return res.status(403).json({ error: 'Only the talent can submit delivery' })
      const deliveryNote = clampText(req.body.deliveryNote, 5000)
      if (!deliveryNote) return res.status(400).json({ error: 'deliveryNote is required' })
      nextStatus = 'delivered'
      data = { deliveryNote, deliveredAt: new Date() }
      break
    }

    case 'delivered':
      if (!isAdmin) return res.status(403).json({ error: 'Only Lawnn can confirm the final payment' })
      nextStatus = 'completed'
      data = { clientApproved: true, completedAt: new Date() }
      break

    case 'completed':
      return res.status(400).json({ error: 'Use POST /projects/:id/reviews to leave a review' })

    default:
      return res.status(400).json({ error: `Cannot advance from status: ${project.status}` })
  }

  // Credit the talent's running earnings total on completion. Money moves
  // off-platform (manual InstaPay): the client transfers to Lawnn, and Lawnn
  // pays the talent out separately. walletBalance is a record of total earned.
  const updated = await prisma.$transaction(async tx => {
    if (nextStatus === 'completed' && project.talentId) {
      await tx.profile.updateMany({
        where: { userId: project.talentId },
        data: { walletBalance: { increment: project.budget } },
      })
    }
    return tx.project.update({
      where: { id: req.params.id },
      data: { status: nextStatus, ...data },
      include: { client: { select: { id: true, name: true } }, talent: { select: { id: true, name: true } } },
    })
  })

  const t = updated.talentId
  const c = updated.clientId
  const title = updated.title
  if (nextStatus === 'in_progress') {
    await notify(t, { type: 'money', title: `Deposit confirmed for "${title}"`, body: 'Lawnn confirmed the deposit — you can start the work.', link: 'projects' })
    await notify(c, { type: 'check', title: `"${title}" has started`, body: 'We confirmed your deposit and notified the student.', link: 'projects' })
    await emailUser(t, { subject: `Deposit confirmed — you can start "${title}"`, heading: 'The deposit is confirmed', bodyHtml: `<p>Lawnn confirmed the client's deposit for "<strong>${title}</strong>". You're clear to start the work.</p>`, cta: { label: 'Open the project', url: SITE_URL } })
    await emailUser(c, { subject: `"${title}" has started`, heading: 'Your project is underway', bodyHtml: `<p>We confirmed your deposit and notified the student to begin "<strong>${title}</strong>".</p>`, cta: { label: 'View project', url: SITE_URL } })
  } else if (nextStatus === 'delivered') {
    await notify(c, { type: 'bag', title: `Delivery submitted for "${title}"`, body: 'Review it and arrange the final payment.', link: 'projects' })
    await emailUser(c, { subject: `Delivery submitted for "${title}"`, heading: 'Your delivery is ready to review', bodyHtml: `<p>The student submitted their work for "<strong>${title}</strong>". Review it and arrange the final payment.</p>`, cta: { label: 'Review delivery', url: SITE_URL } })
  } else if (nextStatus === 'completed') {
    await notify(t, { type: 'money', title: `Final payment confirmed for "${title}"`, body: 'Lawnn will pay out your earnings.', link: 'projects' })
    await notify(c, { type: 'check', title: `"${title}" is complete`, body: 'Thanks — the project is now complete.', link: 'projects' })
    await emailUser(t, { subject: `Final payment confirmed for "${title}" 🎉`, heading: 'Payment confirmed', bodyHtml: `<p>Lawnn confirmed the final payment for "<strong>${title}</strong>". Your earnings will be paid out — great work!</p>`, cta: { label: 'View project', url: SITE_URL } })
    await emailUser(c, { subject: `"${title}" is complete`, heading: 'Project complete', bodyHtml: `<p>"<strong>${title}</strong>" is now complete. Thanks for using Lawnn — consider leaving the student a review.</p>`, cta: { label: 'Leave a review', url: SITE_URL } })
  }

  return res.json(updated)
})

// ── POST /projects/:id/payment-sent ───────────────────────────────────────────
// The client signals they've made the manual InstaPay transfer (proof required).
// This doesn't advance the project — it pings admins to verify and confirm.
router.post('/:id/payment-sent', requireAuth, async (req, res) => {
  const { proofPath } = req.body || {}
  // Must be a payment-proof storage path with no traversal or scheme — it's
  // later signed for the admin/owner to view.
  // Pin the path to THIS caller's upload folder (payment-proof/<userId>/…) so a
  // client can't attach someone else's private screenshot to their project.
  const proofRe = new RegExp(`^payment-proof/${req.user.id}/[A-Za-z0-9_][A-Za-z0-9_\\-/.]*$`)
  if (
    !proofPath || typeof proofPath !== 'string' ||
    proofPath.includes('..') ||
    !proofRe.test(proofPath)
  ) {
    return res.status(400).json({ error: 'A valid transfer screenshot is required' })
  }

  const project = await prisma.project.findUnique({ where: { id: req.params.id } })
  if (!project) return res.status(404).json({ error: 'Project not found' })
  if (project.clientId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const isFinal = project.status === 'delivered'
  const stage = isFinal ? 'final payment' : 'deposit'

  await prisma.project.update({
    where: { id: project.id },
    // Re-uploading clears any prior rejection reason.
    data: {
      ...(isFinal ? { finalPaymentProofUrl: proofPath } : { depositProofUrl: proofPath }),
      paymentRejectionReason: null,
    },
  })

  const admins = await prisma.user.findMany({ where: { role: 'admin' }, select: { id: true } })
  await Promise.all(
    admins.map(a =>
      notify(a.id, {
        type: 'money',
        title: `Client marked the ${stage} as sent — "${project.title}"`,
        body: 'A transfer screenshot was uploaded. Verify it, then confirm in My Projects.',
        link: 'projects',
      })
    )
  )

  return res.json({ ok: true })
})

// ── POST /projects/:id/reject-payment ─────────────────────────────────────────
// Admin rejects a client's transfer screenshot with a reason. Clears the proof
// so the client can re-upload, stores the reason, and notifies the client.
router.post('/:id/reject-payment', requireAuth, requireRole('admin'), async (req, res) => {
  const reason = clampText(req.body.reason, 500)
  if (!reason) return res.status(400).json({ error: 'A rejection reason is required' })

  const project = await prisma.project.findUnique({ where: { id: req.params.id } })
  if (!project) return res.status(404).json({ error: 'Project not found' })

  const isFinal = project.status === 'delivered'
  const stage = isFinal ? 'final payment' : 'deposit'

  await prisma.project.update({
    where: { id: project.id },
    data: {
      ...(isFinal ? { finalPaymentProofUrl: null } : { depositProofUrl: null }),
      paymentRejectionReason: reason,
    },
  })

  await notify(project.clientId, {
    type: 'money',
    title: `Your ${stage} screenshot needs another look — "${project.title}"`,
    body: `Lawnn couldn't confirm it: ${reason} Please re-upload a clear screenshot.`,
    link: 'projects',
  })

  return res.json({ ok: true })
})

// ── POST /projects/:id/reviews ────────────────────────────────────────────────
router.post('/:id/reviews', requireAuth, async (req, res) => {
  const rating = nonNegativeInt(req.body.rating)
  const comment = clampText(req.body.comment, 2000)
  if (!rating || !comment) return res.status(400).json({ error: 'rating and comment are required' })
  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'rating must be 1–5' })

  const project = await prisma.project.findUnique({ where: { id: req.params.id } })
  if (!project) return res.status(404).json({ error: 'Project not found' })
  if (project.status !== 'completed' && project.status !== 'reviewed') {
    return res.status(400).json({ error: 'Project must be completed before leaving a review' })
  }

  const isClient = project.clientId === req.user.id
  const isTalent = project.talentId === req.user.id
  if (!isClient && !isTalent) return res.status(403).json({ error: 'Forbidden' })

  const recipientId = isClient ? project.talentId : project.clientId

  let review
  try {
    review = await prisma.review.create({
      data: { projectId: project.id, authorId: req.user.id, recipientId, rating, comment },
    })
  } catch (err) {
    // @@unique([projectId, authorId]) — one review per person per project.
    if (err.code === 'P2002') return res.status(409).json({ error: 'You have already reviewed this project' })
    throw err
  }

  const agg = await prisma.review.aggregate({
    where: { recipientId },
    _avg: { rating: true },
    _count: true,
  })
  await prisma.profile.updateMany({
    where: { userId: recipientId },
    data: { rating: Math.round((agg._avg.rating || 0) * 10) / 10, reviewCount: agg._count },
  })

  const reviewCount = await prisma.review.count({ where: { projectId: project.id } })
  if (reviewCount >= 2) {
    await prisma.project.update({ where: { id: project.id }, data: { status: 'reviewed' } })
  }

  await notify(recipientId, {
    type: 'star',
    title: 'You received a review',
    body: `${rating}★ on "${project.title}"`,
    link: 'projects',
  })
  await emailUser(recipientId, {
    subject: `You received a ${rating}★ review on "${project.title}"`,
    heading: 'You got a new review',
    bodyHtml: `<p>Someone left you a <strong>${rating}★</strong> review on "<strong>${project.title}</strong>". Reviews build your reputation and help you get hired — nice work!</p>`,
    cta: { label: 'View your profile', url: SITE_URL },
  })

  return res.status(201).json(review)
})

// ── DELETE /projects/:id ──────────────────────────────────────────────────────
// Admin: unrestricted. Owner: only before anyone is hired (pending/open/closed);
// applications cascade-delete. Once offer_accepted+, deletion is blocked because
// money/commitments are involved.
router.delete('/:id', requireAuth, async (req, res) => {
  const project = await prisma.project.findUnique({ where: { id: req.params.id } })
  if (!project) return res.status(404).json({ error: 'Project not found' })

  if (req.user.role !== 'admin' && project.clientId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  const cancellable = ['pending', 'open', 'closed']
  if (req.user.role !== 'admin' && !cancellable.includes(project.status)) {
    return res.status(409).json({
      error: 'This project is already underway — cancellation needs the talent to be released and any deposit refunded.',
    })
  }

  await prisma.project.delete({ where: { id: req.params.id } })
  return res.status(204).send()
})

export default router

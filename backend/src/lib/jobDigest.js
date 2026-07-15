// ── Student "open jobs" digest ───────────────────────────────────────────────
// Emails every approved, active student the current open projects — but ONLY if
// there's at least one open job. Idempotent and safe to call repeatedly; meant to
// be run on a schedule (e.g. a Render Cron Job every 3 days) via scripts/runDigest.js,
// or on demand from the admin panel.

import prisma from './prisma.js'
import { sendEmail, emailLayout, emailEnabled, SITE_URL } from './email.js'

export async function runJobDigest() {
  if (!emailEnabled()) return { skipped: 'email-disabled' }

  const jobs = await prisma.project.findMany({
    where: { status: 'open' },
    orderBy: { createdAt: 'desc' },
    take: 25,
    select: { id: true, title: true, budget: true, category: true },
  })
  if (jobs.length === 0) return { jobs: 0, sent: 0, note: 'no open jobs — nothing sent' }

  // Only students eligible to apply for jobs: approved, full (not community-tier),
  // and not suspended.
  const students = await prisma.user.findMany({
    where: { role: 'student', approved: true, suspended: false, communityOnly: false },
    select: { id: true, email: true, name: true },
  })

  const jobsHtml = jobs.map(j =>
    `<li style="margin-bottom:8px"><strong>${j.title}</strong> — ${j.budget} EGP <span style="color:#21326c99">· ${j.category || ''}</span></li>`
  ).join('')
  const bodyHtml = `<p>Here are the latest open projects on Lawnn right now:</p><ul style="padding-left:18px;margin:12px 0">${jobsHtml}</ul>`
  const heading = `${jobs.length} open project${jobs.length !== 1 ? 's' : ''} waiting for you`
  const subject = `${jobs.length} open project${jobs.length !== 1 ? 's' : ''} on Lawnn`
  const html = emailLayout(heading, bodyHtml, { label: 'Browse & apply', url: SITE_URL })
  const text = `${jobs.length} open projects on Lawnn. Browse and apply: ${SITE_URL}`

  let sent = 0
  for (const s of students) {
    if (!s.email) continue
    const ok = await sendEmail({ to: s.email, toName: s.name, subject, html, text })
    if (ok) sent++
  }
  return { jobs: jobs.length, students: students.length, sent }
}

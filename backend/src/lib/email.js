// ── Transactional email (Brevo) ──────────────────────────────────────────────
// One helper every event uses. No-op when BREVO_API_KEY is unset (local/dev),
// and it NEVER throws — a failed email must not break the action that fired it.
//
// Env:
//   BREVO_API_KEY   — Brevo transactional API key (required to actually send)
//   BREVO_SENDER    — verified sender address (default info@lawnndesign.com)
//   ADMIN_EMAIL     — where admin notifications go (default info@lawnndesign.com)
//   FRONTEND_URL    — used to build links in emails

import prisma from './prisma.js'

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email'
const FROM_NAME = 'Lawnn'
const SENDER    = process.env.BREVO_SENDER || 'info@lawnndesign.com'

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@lawnndesign.com'
export const SITE_URL = (process.env.FRONTEND_URL || 'https://lawnndesign.com').split(',')[0].replace(/\/+$/, '')

export function emailEnabled() {
  return Boolean(process.env.BREVO_API_KEY)
}

// Branded HTML wrapper. `cta` is an optional { label, url } button.
export function emailLayout(heading, bodyHtml, cta) {
  const button = cta
    ? `<p style="margin:24px 0"><a href="${cta.url}" style="background:#ff9044;color:#fff;text-decoration:none;padding:12px 22px;border-radius:9999px;font-weight:600;display:inline-block">${cta.label}</a></p>`
    : ''
  return `<div style="font-family:Arial,sans-serif;color:#21326c;line-height:1.6;max-width:560px;margin:0 auto">
  <div style="background:#21326c;padding:16px 24px;border-radius:16px 16px 0 0">
    <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:.5px">Lawnn</span>
  </div>
  <div style="border:1px solid #21326c1a;border-top:none;border-radius:0 0 16px 16px;padding:24px">
    <h1 style="font-size:20px;margin:0 0 12px">${heading}</h1>
    ${bodyHtml}
    ${button}
    <p style="font-size:12px;color:#21326c99;margin-top:28px">You're receiving this because you have a Lawnn account. — The Lawnn Team</p>
  </div>
</div>`
}

// Low-level send. Returns true on success, false otherwise (never throws).
export async function sendEmail({ to, toName, subject, html, text }) {
  if (!emailEnabled() || !to) return false
  try {
    const resp = await fetch(BREVO_URL, {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'accept': 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: SENDER },
        to: [{ email: to, name: toName || to }],
        subject,
        htmlContent: html,
        textContent: text || subject,
      }),
    })
    if (!resp.ok) {
      console.warn('[email] Brevo', resp.status, await resp.text().catch(() => ''))
      return false
    }
    return true
  } catch (e) {
    console.warn('[email] failed:', e.message)
    return false
  }
}

// Look up a user's address and email them a branded message. Fire-and-forget.
export async function emailUser(userId, { subject, heading, bodyHtml, cta }) {
  if (!emailEnabled() || !userId) return
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })
    if (!user?.email) return
    await sendEmail({ to: user.email, toName: user.name, subject, html: emailLayout(heading, bodyHtml, cta) })
  } catch (e) {
    console.warn('[email] emailUser failed:', e.message)
  }
}

// Email the Lawnn admin inbox (info@lawnndesign.com).
export async function emailAdmin({ subject, heading, bodyHtml, cta }) {
  await sendEmail({ to: ADMIN_EMAIL, toName: 'Lawnn Admin', subject, html: emailLayout(heading, bodyHtml, cta) })
}

// Preview / test every Lawnn notification email.
//
//   node scripts/previewEmails.js
//       → writes email-preview.html (open it in a browser to see all emails)
//
//   node scripts/previewEmails.js you@example.com
//       → ALSO sends each sample email to that address via Brevo
//         (needs BREVO_API_KEY + BREVO_SENDER in your environment)
//
// Self-contained — no database or app imports needed. The layout here mirrors
// backend/src/lib/email.js; if you restyle the real emails, mirror it here too.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const SITE = 'https://lawnndesign.com'

// ── Branded wrapper (kept in sync with src/lib/email.js emailLayout) ──────────
function emailLayout(heading, bodyHtml, cta) {
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

const reason = 'Your portfolio shows promise, but we need to see at least 3 finished pieces (not studies) that demonstrate a consistent style before we can list you to clients.'

// ── The catalog: one entry per email the system sends ─────────────────────────
const EMAILS = [
  // — Admin (info@lawnndesign.com) —
  { to: 'Admin', event: 'A client posted a project', subject: 'New project pending review: "Coffee shop brand identity"',
    heading: 'A client posted a new project',
    bodyHtml: `<p><strong>Coffee shop brand identity</strong> — 5000 EGP</p><p style="color:#21326c99">It's waiting for your approval before it goes live on the board.</p>`,
    cta: { label: 'Open Lawnn admin', url: SITE } },
  { to: 'Admin', event: 'A student applied', subject: 'New application on "Coffee shop brand identity"',
    heading: 'A student applied to a project', bodyHtml: `<p>A student applied to "<strong>Coffee shop brand identity</strong>".</p>` },
  { to: 'Admin', event: 'Student finished onboarding', subject: 'Sama Tarek finished onboarding — ready for review',
    heading: 'A student completed their onboarding',
    bodyHtml: `<p><strong>Sama Tarek</strong> just finished setting up their profile (bio, skills and portfolio) and is waiting for approval.</p><p style="color:#21326c99">Review them in Admin → Students and approve or send feedback.</p>`,
    cta: { label: 'Open Lawnn admin', url: SITE } },
  { to: 'Admin', event: 'New client signed up', subject: 'New client sign-up: Ahmed Hassan',
    heading: 'A new client joined Lawnn', bodyHtml: `<p><strong>Ahmed Hassan</strong> (ahmed@example.com) just created a client account.</p>`,
    cta: { label: 'Open Lawnn admin', url: SITE } },

  // — Student —
  { to: 'Student', event: 'Hired (application accepted)', subject: 'You were hired for "Coffee shop brand identity"! 🎉',
    heading: "You've been hired",
    bodyHtml: `<p>Congratulations! You were selected for "<strong>Coffee shop brand identity</strong>". Head to My Projects — the client will arrange the deposit to get you started.</p>`,
    cta: { label: 'Go to My Projects', url: SITE } },
  { to: 'Student', event: 'Application rejected', subject: 'Update on your Lawnn application',
    heading: 'An update on your application',
    bodyHtml: `<p>Thanks for applying. The client went with another applicant this time — but don't be discouraged. New projects are posted regularly, and your next opportunity could be around the corner.</p>`,
    cta: { label: 'Browse open jobs', url: SITE } },
  { to: 'Student', event: 'Onboarding approved', subject: 'Your Lawnn profile is approved! 🎉',
    heading: "You're in — your profile is live",
    bodyHtml: `<p>Welcome aboard! The Lawnn team has reviewed and approved your profile. You now appear in the talent directory and can apply to client projects.</p>`,
    cta: { label: 'Browse open jobs', url: SITE } },
  { to: 'Student', event: 'Onboarding rejected (with reason)', subject: 'Update on your Lawnn onboarding',
    heading: 'An update on your onboarding',
    bodyHtml: `<p>Thank you for setting up your Lawnn profile. After review, we aren't able to approve it as it stands right now. Here's the feedback from our team:</p>
      <blockquote style="border-left:3px solid #ff9044;margin:12px 0;padding:6px 14px;background:#ff90440d">${reason}</blockquote>
      <p>We'd genuinely love to see you on Lawnn — once you've addressed the above, reply to this email and we'll take another look.</p>` },
  { to: 'Student', event: 'Deposit confirmed (start work)', subject: 'Deposit confirmed — you can start "Coffee shop brand identity"',
    heading: 'The deposit is confirmed',
    bodyHtml: `<p>Lawnn confirmed the client's deposit for "<strong>Coffee shop brand identity</strong>". You're clear to start the work.</p>`,
    cta: { label: 'Open the project', url: SITE } },
  { to: 'Student', event: 'Final payment confirmed', subject: 'Final payment confirmed for "Coffee shop brand identity" 🎉',
    heading: 'Payment confirmed',
    bodyHtml: `<p>Lawnn confirmed the final payment for "<strong>Coffee shop brand identity</strong>". Your earnings will be paid out — great work!</p>`,
    cta: { label: 'View project', url: SITE } },
  { to: 'Student', event: 'Review received', subject: 'You received a 5★ review on "Coffee shop brand identity"',
    heading: 'You got a new review',
    bodyHtml: `<p>Someone left you a <strong>5★</strong> review on "<strong>Coffee shop brand identity</strong>". Reviews build your reputation and help you get hired — nice work!</p>`,
    cta: { label: 'View your profile', url: SITE } },
  { to: 'Student', event: 'Open-jobs digest (every 3 days)', subject: '3 open projects on Lawnn',
    heading: '3 open projects waiting for you',
    bodyHtml: `<p>Here are the latest open projects on Lawnn right now:</p><ul style="padding-left:18px;margin:12px 0">
      <li style="margin-bottom:8px"><strong>Coffee shop brand identity</strong> — 5000 EGP <span style="color:#21326c99">· Visuals &amp; Branding</span></li>
      <li style="margin-bottom:8px"><strong>Instagram carousel set (10 slides)</strong> — 1500 EGP <span style="color:#21326c99">· Social Media</span></li>
      <li style="margin-bottom:8px"><strong>Product packaging mockups</strong> — 3200 EGP <span style="color:#21326c99">· Product Design</span></li></ul>`,
    cta: { label: 'Browse & apply', url: SITE } },

  // — Client —
  { to: 'Client', event: 'Project approved (live)', subject: 'Your project "Coffee shop brand identity" is now live 🎉',
    heading: 'Your project is approved',
    bodyHtml: `<p>"<strong>Coffee shop brand identity</strong>" has been approved and is now live on the board. Students can see it and apply — we'll email you when the first application comes in.</p>`,
    cta: { label: 'View your projects', url: SITE } },
  { to: 'Client', event: 'Project rejected (with reason)', subject: 'Your project "Coffee shop brand identity" wasn\'t approved',
    heading: 'Your project needs a few changes',
    bodyHtml: `<p>Thanks for posting "<strong>Coffee shop brand identity</strong>". We weren't able to approve it as-is. Here's why:</p>
      <blockquote style="border-left:3px solid #ff9044;margin:12px 0;padding:6px 14px;background:#ff90440d">The brief is missing a budget range and a deadline — please add both so students know what they're applying to.</blockquote>
      <p>You're welcome to adjust it and post again.</p>`,
    cta: { label: 'Post a new project', url: SITE } },
  { to: 'Client', event: 'New applicant', subject: 'New application on "Coffee shop brand identity"',
    heading: 'You have a new applicant',
    bodyHtml: `<p>A student just applied to your project "<strong>Coffee shop brand identity</strong>". Log in to review their application, note and portfolio.</p>`,
    cta: { label: 'Review applications', url: SITE } },
  { to: 'Client', event: 'Project started (deposit confirmed)', subject: '"Coffee shop brand identity" has started',
    heading: 'Your project is underway',
    bodyHtml: `<p>We confirmed your deposit and notified the student to begin "<strong>Coffee shop brand identity</strong>".</p>`,
    cta: { label: 'View project', url: SITE } },
  { to: 'Client', event: 'Delivery submitted', subject: 'Delivery submitted for "Coffee shop brand identity"',
    heading: 'Your delivery is ready to review',
    bodyHtml: `<p>The student submitted their work for "<strong>Coffee shop brand identity</strong>". Review it and arrange the final payment.</p>`,
    cta: { label: 'Review delivery', url: SITE } },
  { to: 'Client', event: 'Project complete', subject: '"Coffee shop brand identity" is complete',
    heading: 'Project complete',
    bodyHtml: `<p>"<strong>Coffee shop brand identity</strong>" is now complete. Thanks for using Lawnn — consider leaving the student a review.</p>`,
    cta: { label: 'Leave a review', url: SITE } },
]

// ── Write the combined preview page ───────────────────────────────────────────
const badge = to => ({ Admin: '#21326c', Student: '#16a34a', Client: '#ff9044' }[to] || '#21326c')
const cards = EMAILS.map(e => `
  <div style="margin:0 auto 34px;max-width:600px">
    <div style="font-family:Arial;font-size:13px;margin:0 0 8px">
      <span style="background:${badge(e.to)};color:#fff;padding:2px 10px;border-radius:9999px;font-weight:700">${e.to}</span>
      <span style="color:#555;margin-left:8px">${e.event}</span>
      <div style="color:#999;margin-top:4px">Subject: ${e.subject}</div>
    </div>
    ${emailLayout(e.heading, e.bodyHtml, e.cta)}
  </div>`).join('')

const page = `<!doctype html><html><head><meta charset="utf-8"><title>Lawnn email previews</title></head>
<body style="background:#eef0f4;padding:32px 12px;margin:0">
  <h1 style="font-family:Arial;text-align:center;color:#21326c">Lawnn — email previews (${EMAILS.length})</h1>
  ${cards}
</body></html>`

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.join(__dirname, '..', 'email-preview.html')
fs.writeFileSync(outPath, page)
console.log(`Wrote ${EMAILS.length} email previews → ${outPath}`)
console.log('Open that file in a browser to see them all.')

// ── Optionally send real test copies via Brevo ────────────────────────────────
const sendTo = process.argv[2]
if (sendTo) {
  const key = process.env.BREVO_API_KEY
  const sender = process.env.BREVO_SENDER || 'info@lawnndesign.com'
  if (!key) { console.error('Set BREVO_API_KEY to send test emails.'); process.exit(1) }
  const run = async () => {
    let ok = 0
    for (const e of EMAILS) {
      const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': key, 'accept': 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({
          sender: { name: 'Lawnn', email: sender },
          to: [{ email: sendTo }],
          subject: `[${e.to} · TEST] ${e.subject}`,
          htmlContent: emailLayout(e.heading, e.bodyHtml, e.cta),
        }),
      })
      if (resp.ok) { ok++; console.log(`  ✓ ${e.event}`) }
      else console.log(`  ✗ ${e.event} — ${resp.status} ${await resp.text().catch(() => '')}`)
    }
    console.log(`\nSent ${ok}/${EMAILS.length} test emails to ${sendTo}.`)
  }
  run()
}

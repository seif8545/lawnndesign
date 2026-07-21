# Lawnn — Engineering Handoff & Launch Runbook
_Last updated: 2026-07-21_

This is the single source of truth for the state of Lawnn: what's live, what shipped this cycle,
the security/architecture quirks a new engineer must know, and what's still outstanding.

**Headline: the platform is live on `lawnndesign.com`, real students have been onboarded, and the
admin-approval gate is the current control point before anything goes public.** Everything in the
old pre-launch checklist (domain move, DKIM/DMARC, Turnstile, acceptance emails) is **done**. See
§8 for what's still open.

---

## 0. Quick status

| Item | Status |
|---|---|
| Domain (`lawnndesign.com`) | ✅ Live (frontend + backend cut over, old `lawnn.pages.dev` custom domain removed) |
| Turnstile CAPTCHA (signup + login) | ✅ Live |
| DKIM / DMARC for Brevo | ✅ Configured |
| Acceptance emails (16 full + 7 community students) | ✅ Sent |
| Rejection emails (21 applicants) | ✅ Sent |
| Production content wipe (projects/jobs/chats/feed/uploads) | ✅ Done — accounts/profiles preserved |
| Student admin-approval gate | ✅ Live — applies retroactively to all 25 existing students (currently all pending) |
| Chat: client can't message a student who hasn't applied | ✅ Fixed |
| Chat: auto-scroll bug | ✅ Fixed |
| Chat: phone-number / off-platform-payment filter | ✅ Live (client + server) |
| Onboarding: portfolio required, step-by-step gating | ✅ Fixed |
| Onboarding: profile not found on first login after signup | ✅ Fixed (was a real bug — see §5.3) |
| Admin: view PDFs on job review | ✅ Fixed |
| Admin: expandable "Review" panel (bio/skills/portfolio) before approve/reject | ✅ Live |
| Transactional email system (~18 event types) | ✅ Live |
| Full codebase security/optimization review | ✅ Done — see `CODEBASE_REVIEW_2026-07-15.md`; critical items C1/C3/C4 and H3 fixed, rest tracked in §8 |
| Latest commit | `625c9ee` "Update AdminPage.jsx" — confirmed pushed, `main` up to date with `origin/main` |

---

## 1. System map

| Piece | Tech | Where it runs |
|---|---|---|
| **Frontend** | Vite + React SPA, Tailwind | Cloudflare Pages → **lawnndesign.com** |
| **Backend API** | Node + Express + Prisma + Socket.io | Render → **lawnndesign.onrender.com** |
| **Database** | Supabase Postgres (project `fojptzeakjieqcuwgpbl`, eu-west-1) | Supabase |
| **File storage** | Supabase Storage: `lawnn-public` (CDN) + `lawnn-private` (signed URLs) | Supabase |
| **Email** | Brevo transactional API, sender `info@lawnndesign.com` (DKIM+DMARC verified) | brevo.com |
| **Anti-spam** | Cloudflare Turnstile, site key `0x4AAAAAAD2jsDT2LzTpfO3M` | login + register |

**Roles:** `student`, `client`, `admin`. Students are team-created (invite flow); clients
self-register (behind Turnstile). A **`communityOnly`** boolean on a student = "can sign in, build
a profile, comment/engage, but cannot apply to jobs." A separate **`approved`** boolean (new this
cycle, see §4) gates whether a student's profile is public and whether they can apply at all,
regardless of `communityOnly`.

**Auth:** JWT (24h) in `localStorage`, sent as `Authorization: Bearer`. Passwords hashed with
Argon2id (legacy bcrypt auto-upgrades on login). Every request re-checks the live account, so
suspend/delete/password-change/approve/reject take effect instantly.

**DB workflow:** this project uses **`prisma db push`**, NOT migration files. `schema.prisma` is
the source of truth and matches the live DB. Do not run `prisma migrate deploy`.

---

## 2. What shipped this cycle

### 2.1 Domain cutover (lawnn.pages.dev → lawnndesign.com)
Done end-to-end: Cloudflare custom domain swapped, `FRONTEND_URL`/`VITE_API_URL` env vars set on
Render/Cloudflare, old `.pages.dev` custom domain removed so the old repo/project no longer serves
traffic. Verified live via signup/login/chat/post smoke test.

### 2.2 Anti-spam (Turnstile)
`POST /auth/register` now requires a valid Turnstile token (mirrors the pre-existing login-CAPTCHA
logic) — see `backend/src/routes/auth.js`. `TurnstileWidget` renders on the signup tab in
`src/components/auth.jsx` with site key `0x4AAAAAAD2jsDT2LzTpfO3M`. No-ops automatically if
`TURNSTILE_SECRET` is unset (safe for local dev).

### 2.3 Email deliverability (DKIM/DMARC)
Configured per `EMAIL_AUTH_DKIM_DMARC.md`. DMARC record: `v=DMARC1; p=none;
rua=mailto:info@lawnndesign.com; fo=1; adkim=r; aspf=r; pct=100`.

### 2.4 Real student onboarding + a full content wipe
- `lawnn-emails/send_acceptances.py` — enrolled 16 full students + 7 community students directly
  in the DB (users/profiles/student_invites), emailed each a set-password link. Both batches sent
  and confirmed delivered.
- `lawnn-emails/send_rejections.py` — 21 applicants emailed a rejection notice with an "Apply
  Again" link to the Google Form. Sent and confirmed.
- `lawnn-emails/clear_uploads.py` — wiped all production content (projects, jobs, applications,
  chats/messages, feed posts/likes/comments, uploaded files in both storage buckets) while
  preserving all 28 user accounts and 25 student profiles. Storage deletes go through the Supabase
  **Storage API**, not raw SQL — `storage.objects` has a `protect_delete()` trigger that blocks
  direct `DELETE`.
- The signup page's "Are you a student?" note now links straight to the student application
  Google Form (`src/components/auth.jsx`).

### 2.5 Chat fixes
- **Unauthorized messaging (`backend/src/routes/conversations.js`):** a client could message any
  student with no prior relationship. Fixed — creating a new client↔student conversation now
  requires an existing `Application` from that student to one of that client's projects (403
  otherwise). Existing threads and admin/support threads are exempt.
- **Auto-scroll (`src/pages/ChatPage.jsx`):** replaced the dummy bottom-anchor pattern with a
  direct `scrollTop = scrollHeight` on the message-list container.
- **Content filter (`src/lib/chatFilter.js`, wired into `ChatPage.jsx` + server-side backstop):**
  blocks Egyptian phone numbers (`01...`) and off-platform-payment keywords (`instapay`, `cash`,
  `call`, `hawelly`, `whatsapp`) client-side (toast) and server-side (rejects + emits
  `message_rejected`). **Known limitation, accepted for now:** literal string matching only — no
  Arabic-script or obfuscated-variant detection, and admin/support conversations are exempt from
  the filter (tracked as C5 in §8, user confirmed this can wait).

### 2.6 Onboarding fixes
- **Portfolio now required to finish onboarding** (`src/pages/OnboardingFlow.jsx`) — added a 4th
  student step (was 3) with upload/remove UI, and generalized the old portfolio-only gate into a
  `stepBlocked` check covering bio, skills, *and* portfolio, each with its own inline CTA copy.
  Previously only the portfolio step was actually gated — a student could "finish" without a bio or
  skills and would never reach admin review.
- **"Skip setup" removed** for students (still available to clients).
- **Root-cause fix for a real bug:** `src/App.jsx`'s talent-list fetch only ran once on mount
  (`useEffect(..., [])`), so a student who logged in in the same browser session as page-load never
  had their own profile in the `talents` array — the onboarding-prompt effect silently no-opped.
  Changed to a `refreshTalents` callback that reruns on `currentUser` change (mirrors the existing
  `refreshJobs` pattern). This is very likely what caused the real incident where a student wasn't
  prompted to upload her portfolio.

### 2.7 Admin-approval gate (new system)
Students no longer go public or become able to apply to jobs the moment they finish onboarding —
an admin must explicitly approve them first.
- **Schema:** `User.approved Boolean @default(false)` (`backend/prisma/schema.prisma`). Backfilled
  live: all non-student roles set to `approved = true`; all 25 existing students currently sit at
  `approved = false` (pending, by design — none has been reviewed yet).
- **Visibility (`backend/src/routes/profiles.js`):** `GET /profiles` and `GET /profiles/:id` hide
  unapproved/suspended students from the public directory, but always let a signed-in user see
  **their own** profile regardless of approval state (this is what the onboarding/pending-review
  flow depends on — see C1 in §8, this was the critical bug found and fixed).
- **Apply gate (`backend/src/routes/projects.js`):** `POST /:id/applications` 403s with "Your
  profile is still under review..." before the `communityOnly` check runs.
- **Frontend:** `src/App.jsx` renders a full-screen "Your profile is under review" takeover for any
  student with `approved === false` and a completed profile (with a log-out button); they can't
  reach the rest of the app until approved.
- **Admin UI (`src/pages/AdminPage.jsx`):** each student row shows a status badge (Suspended /
  Verified / Pending review + Approve/Reject buttons / Onboarding incomplete) plus an expandable
  **"Review" panel** — shows the student's actual bio text, skill tag-pills, and a portfolio grid
  (clickable image/PDF thumbnails) so the admin can make an informed call instead of approving
  blind. Reject requires a reason (freetext prompt), which is emailed to the student.
  **Important:** rejecting does **not** suspend the account (see C4 in §8) — the student keeps
  logging in, can revise their profile per the feedback, and the flow re-triggers admin review the
  next time their profile crosses the completeness threshold.
- The old "add accepted students by email" bulk-add UI was removed from AdminPage per request (the
  underlying backend route may still exist unused — see H4 in §8).

### 2.8 Transactional email system (~18 event types)
`backend/src/lib/email.js` is the shared sender (`emailUser`, `emailAdmin`, branded HTML layout,
`escapeHtml`). Wired into `auth.js`, `profiles.js`, `projects.js`, `admin.js`. Covers, non-
exhaustively: new client signup (admin), project posted/approved/rejected (admin + client), student
finished onboarding (admin), student approved/rejected (student), application
submitted/accepted/rejected (admin/client/student), payment lifecycle (deposit confirmed,
delivered, completed), review received. Plus an **on-demand "open jobs" digest**
(`backend/src/lib/jobDigest.js`, triggered by an admin-panel button — not a cron — per user's
preference) sent only to students who are `approved && !suspended && !communityOnly`, and only if
≥1 open job exists.
- `backend/scripts/previewEmails.js` — renders every email type with sample data to
  `email-preview.html`; run with an email arg (`node previewEmails.js you@x.com`) to send real test
  copies via Brevo.

---

## 3. Codebase review — status

Full findings in `CODEBASE_REVIEW_2026-07-15.md` (produced from an explicit plan-only security /
sanitization / optimization pass). Status of each tier:

**Critical (C):**
- **C1 — FIXED.** `GET /profiles` hid a student's own profile once unapproved, breaking the
  onboarding/pending-review flow for every unapproved student. Fixed with the OR-clause described
  in §2.7. Confirmed live via a direct fetch to `/profiles`.
- **C2 — resolved via the normal deploy path** (Cloudflare/Render rebuild from the pushed commit);
  not a standalone code fix.
- **C3 — FIXED.** No HTML-escaping anywhere in the email system — user-controlled names/titles/
  reasons were interpolated raw into emails sent from the verified domain (a phishing/XSS vector).
  Added `escapeHtml()` and wrapped every dynamic value across all 5 email-sending files.
- **C4 — FIXED.** Rejecting a student set `suspended: true`, fully locking them out — directly
  contradicting the rejection email's "you can revise and resubmit" promise. Now only sets
  `approved: false`; account stays usable.
- **C5 — NOT fixed, explicitly deferred.** Chat filter doesn't exempt admin/support threads from
  keyword blocking. User: "support convos can wait, no accounts made yet."
- **C6 — NOT fixed, explicitly deferred.** No Supabase backup/PITR policy confirmed. User:
  "ignore supabase backup for now."

**High (H):**
- **H3 — FIXED.** `POST /projects/:id/reject` had no status guard — could delete a live/in-progress
  project via misclick. Now 409s unless `project.status === 'pending'`.
- **H1, H2, H4–H8 — NOT yet addressed.** Notably: H1 (email sends are synchronous/awaited inline,
  adding latency to the request they're attached to — should be fire-and-forget or queued); H2
  (the `approved` gate is only enforced on the apply route, not on feed/marketplace/conversation
  entry points — worth auditing whether an unapproved student can do anything else they shouldn't);
  H4 (the bulk "add students by email" **backend** route may still exist even though its frontend
  UI was removed — not confirmed deleted).

**Medium/Low (M/L):** untouched this cycle — all still open, see the review doc for the full list.

---

## 4. Two real bugs found and fixed outside the formal review
These came from direct incident reports, not the review pass:
1. **Talents list never refetched after login** (§2.6) — root cause of a student not being
   prompted for onboarding on first login.
2. **Onboarding could be "finished" without a bio or skills** (§2.6) — only portfolio was gated.
3. **Mobile layout overlap on the admin student list** (screenshot-reported) — status badges
   stacked on top of the student's name on narrow viewports. Fixed with `flex-wrap` + a
   `min-w-[150px]` name column in `AdminPage.jsx`.
4. **Admin had no way to actually view a student's profile content before approving/rejecting**
   (screenshot-reported) — fixed with the expandable "Review" panel in §2.7.

---

## 5. Deploy status — confirmed

`main` is up to date with `origin/main`; latest commit is `625c9ee "Update AdminPage.jsx"`. Every
fix described in §2 and §3 is present in the **committed, pushed** copy of its file — verified
directly against `git show HEAD:<path>` for `profiles.js`, `App.jsx`, `OnboardingFlow.jsx`,
`admin.js`, `AdminPage.jsx`, and `projects.js`. (A `git diff` initially showed all 8 backend/
frontend files as "modified" with suspiciously equal insert/delete counts — that was purely a
CRLF/LF line-ending artifact from the cloud→Windows file transfer, confirmed via `git diff
--ignore-space-at-eol` returning empty. No real uncommitted work is sitting on disk.) Cloudflare
Pages and Render both auto-rebuild on push to `main`, so this is live.

---

## 6. Test accounts / scripts reference
- Test student account used during onboarding-bug reproduction:
  `seifomaraly123+lawnn@gmail.com` (Gmail plus-addressing — lands in the same inbox as the base
  account; confirmed the backend's `normalizeEmail()` only lowercases/trims, doesn't strip `+tags`,
  so this is safe to reuse for test signups without colliding with the real account).
- `lawnn-emails/send_acceptances_TEST.py` — single-entry dry run before the real batch send.
- `backend/scripts/runDigest.js` — CLI wrapper for `runJobDigest()` (for manual/cron use outside
  the admin-button trigger).
- `backend/scripts/previewEmails.js` — email template preview/test-send tool (§2.8).

---

## 7. Security & operational notes (carried over, still accurate)
- **JWT in `localStorage`** is XSS-exfiltratable. Mitigated by strict input sanitisation + CSP + a
  24h expiry. A cookie-based auth path is **built but off** (`COOKIE_AUTH`); turn on once the API
  is on a same-site subdomain.
- **URL sanitisation (`safeUrl`)** blocks dangerous schemes (`javascript:`, `data:`, etc.) on write;
  React escapes markup on render.
- **Private files** (chat, applications, payment proofs) live in `lawnn-private`, served only via
  short-lived signed URLs to authorised viewers.
- **Rate limits** (`backend/src/index.js`): global 600/15min, auth 20/15min, writes 100/10min.
- **Automated tests:** `backend/tests/` includes `security-sanitize.test.js` and
  `security-authz.test.js`. Run `cd backend && npm test` before every deploy.
- **Reliability nets:** `unhandledRejection`/`uncaughtException` handlers, try/catch around all
  socket handlers.
- **Storage deletes must go through the Storage API** — `storage.objects` has a `protect_delete()`
  trigger blocking direct SQL `DELETE`. See `clear_uploads.py` for the pattern.

---

## 8. Outstanding / next up
In rough priority order:
1. **H2** — audit whether `approved: false` students can reach anything besides the apply route
   that they shouldn't (feed, marketplace, conversations).
2. **H1** — email sends in request handlers are synchronous; consider fire-and-forget or a queue
   so a slow Brevo call doesn't add latency to the user-facing request.
3. **H4** — confirm/remove the orphaned bulk "add students by email" backend route now that its UI
   is gone.
4. **H5–H8, all M/L findings** in `CODEBASE_REVIEW_2026-07-15.md` — not yet triaged this cycle.
5. **C5** (chat filter doesn't exempt admin/support threads) and **C6** (no confirmed Supabase
   backup policy) — both explicitly deferred by the user, revisit before scaling up support usage
   or as a pre-launch-hardening pass.
6. **Approve the first real cohort:** all 25 students currently sit at `approved: false`. Use the
   new Review panel in AdminPage to go through them.
7. Known flagged-but-not-actioned items: invite-link 7-day expiry risk for stragglers who haven't
   set a password yet; unconfirmed Brevo bounce status for one underscore-domain email and iCloud
   addresses; no test yet of a large phone-photo upload against the portfolio size limit.

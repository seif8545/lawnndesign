# Lawnn — Engineering Handoff & Launch Runbook
_Last updated: 2026-07-11_

This is the single source of truth for launching Lawnn: what the system is, the pre-launch
to-dos (domain move, acceptance emails, anti-spam), and the security quirks a new engineer
must know.

---

## 0. Pre-launch checklist (do these, in order)

1. **Deploy the latest code** — commit & push both repos so Cloudflare Pages (frontend) and
   Render (backend) rebuild. Nothing below is live until you deploy.
2. **Run `npm run db:push`** in `backend/` at/after deploy so Prisma picks up the new
   `communityOnly` column.
3. **Move the domain** to `lawnndesign.com` — see §2.
4. **Set env vars** on Render + Cloudflare — see §2.3.
5. **Send acceptance emails** via Brevo — see §3.
6. **Turn on anti-spam** (registration CAPTCHA) before announcing publicly — see §4.
7. Smoke-test on the live domain: register a client, log in, open chat, post a project.

---

## 1. System map

| Piece | Tech | Where it runs |
|---|---|---|
| **Frontend** | Vite + React SPA, Tailwind | Cloudflare Pages → **lawnndesign.com** |
| **Backend API** | Node + Express + Prisma + Socket.io | Render → **lawnndesign.onrender.com** |
| **Database** | Supabase Postgres (project `fojptzeakjieqcuwgpbl`, eu-west-1) | Supabase |
| **File storage** | Supabase Storage: `lawnn-public` (CDN) + `lawnn-private` (signed URLs) | Supabase |
| **Email** | Brevo transactional API | brevo.com |

**Roles:** `student`, `client`, `admin`. Students are team-created (invite flow); clients
self-register; admins are set manually. A new **`communityOnly`** boolean on a student = "can
sign in, build a profile, comment/engage, but **cannot apply to jobs** yet."

**Auth:** JWT (24h) in `localStorage`, sent as `Authorization: Bearer`. Passwords hashed with
Argon2id (legacy bcrypt auto-upgrades on login). Every request re-checks the live account, so
suspend/delete/password-change take effect instantly.

**DB workflow:** this project uses **`prisma db push`**, NOT migration files. `schema.prisma` is
the source of truth and matches the live DB. See `backend/prisma/migrations/README.md`. Do not
run `prisma migrate deploy`.

---

## 2. Domain migration: lawnn.pages.dev → lawnndesign.com

Good news: **no code hardcodes `lawnn.pages.dev`.** The move is config only.

### 2.1 Cloudflare Pages (frontend repo)
- In the Pages project → **Custom domains → add `lawnndesign.com`** (and `www` if wanted).
  `public/CNAME` already contains `lawnndesign.com`.
- Add the DNS records Cloudflare shows (CNAME/ALIAS to the `*.pages.dev` target).
- Confirm the Pages project is connected to the **frontend GitHub repo** (Settings → Builds).
  If you moved the repo (e.g. to a new org), reconnect it here.

### 2.2 Render (backend repo)
- Confirm the Render service is connected to the **backend GitHub repo**. If moved, reconnect.
- The API host stays `lawnndesign.onrender.com` (or add an `api.lawnndesign.com` custom domain
  later — optional).

### 2.3 Env vars to set (this is the actual "transfer")
| Where | Variable | Value |
|---|---|---|
| **Render (backend)** | `FRONTEND_URL` | `https://lawnndesign.com` (comma-separate to allow both during cutover, e.g. `https://lawnndesign.com,https://lawnn.pages.dev`) |
| **Render (backend)** | `JWT_EXPIRES_IN` | `24h` |
| **Render (backend)** | `JWT_SECRET`, `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | (already set — verify present) |
| **Cloudflare Pages (frontend)** | `VITE_API_URL` | `https://lawnndesign.onrender.com` |

`FRONTEND_URL` matters twice on the backend: it's the **CORS allow-list** (REST + socket) **and**
the host used to build invite links. If it's wrong, the app can't call the API and invite links
break.

### 2.4 Content-Security-Policy
`frontend public/_headers` already allows `lawnndesign.onrender.com` + `*.supabase.co`. No change
needed unless you move the API host — then update `connect-src`.

### 2.5 Other allow-lists
- **Brevo:** sender domain is `lawnndesign.com` (verified). See §3.
- **Turnstile (when enabled):** add `lawnndesign.com` to the widget's allowed domains.
- Supabase Auth is **not** used (custom JWT), so no Supabase redirect-URL changes needed.

---

## 3. Acceptance emails (Brevo)

Script: **`lawnn-emails/send_acceptances.py`** (or wherever you saved it). It enrols accepted
students directly in the DB and emails each a set-password link. The link reuses the existing
invite flow: opening `https://lawnndesign.com/?token=…&email=…` shows the set-password page →
saves the password → logs them in → normal first-time onboarding.

### 3.1 Two tiers
- `FULL_STUDENTS` → full student powers (feed + apply to jobs).
- `COMMUNITY_STUDENTS` → community access (engage/comment, **no job applications** — enforced by
  the `communityOnly` flag; see §4/§5).

### 3.2 What to fill in
In the file:
- `FULL_STUDENTS = [...]`, `COMMUNITY_STUDENTS = [...]` — the two email lists.
- `FRONTEND_URL = "https://lawnndesign.com"`.

As environment variables (never commit these):
- `BREVO_API_KEY` — from your **new Lawnn Brevo account** (don't reuse another company's).
- `BREVO_SENDER` — `info@lawnndesign.com` (verified in Brevo ✓).
- `DATABASE_URL` — the `DIRECT_URL` line (port 5432) from `backend/.env`.

### 3.3 Run
```
pip install psycopg2-binary requests
export BREVO_API_KEY=...   export BREVO_SENDER=info@lawnndesign.com   export DATABASE_URL=...
python send_acceptances.py
```
Every send appears in the Brevo dashboard (delivered/opened/bounced). Re-running is safe — it
skips anyone already enrolled.

### 3.4 Deliverability (do before a big batch)
Brevo shows **DKIM = Default, no DMARC**. Verified is enough to send, but Gmail/Yahoo may spam
unauthenticated mail. In Brevo → **Domains → authenticate `lawnndesign.com`**: add the DKIM
records at your DNS host and one DMARC TXT record
(`v=DMARC1; p=none; rua=mailto:info@lawnndesign.com`). Free tier = **300 emails/day** — split
large batches across days.

---

## 4. Stop spam client accounts

**Current state:** public registration creates **client** accounts only (bots can't self-register
as students). Protected by rate limits (20 signups / 15 min / IP; 100 writes / 10 min) and by
admin approval (posted projects stay `pending` until approved). **Not a breach risk.**

**The gap:** no CAPTCHA and no email verification on signup, so bulk fake *client* accounts are
possible (nuisance: junk accounts, spam in the admin queue / support DMs / marketplace offers).
Turnstile CAPTCHA infra exists but is **not active** (`TURNSTILE_SECRET` unset, and registration
doesn't call it).

**To fix (recommended before public launch):**
1. Add a Turnstile check to `POST /auth/register` in `backend/src/routes/auth.js` (mirror the
   login CAPTCHA logic already in the file).
2. Render the `TurnstileWidget` on the signup form in `frontend src/components/auth.jsx` and pass
   the token to `register()`.
3. Set `TURNSTILE_SECRET` (Render) + the Turnstile **site key** (frontend), and add
   `lawnndesign.com` to the widget's allowed domains.
4. (Optional, stronger) email verification before an account becomes active.

_Claude can wire steps 1–2 on request; it's a small, contained change._

---

## 5. Security quirks & operational notes

- **`communityOnly` enforcement:** blocked server-side in `POST /projects/:id/applications`
  (returns 403). The frontend **still shows the Apply button** to community users — they just get
  the 403 on click. One-line polish outstanding: gate the button on `!currentUser?.communityOnly`
  in `frontend src/pages/JobBoardPage.jsx` (the flag already reaches the client).
- **JWT in `localStorage`** is XSS-exfiltratable. Mitigated by strict input sanitisation + CSP +
  a 24h expiry. A cookie-based auth path is **built but off** (`COOKIE_AUTH`); turn it on once the
  API is on a same-site subdomain (e.g. `api.lawnndesign.com`).
- **URL sanitisation (`safeUrl`)** blocks dangerous schemes (`javascript:`, `data:`, etc.) on write;
  React escapes the markup on render. Anything stored as a URL/path goes through it — keep it that
  way.
- **Private files** (chat, applications, payment proofs) live in `lawnn-private` and are served
  only via short-lived signed URLs to authorised viewers. Payment-proof paths are pinned to the
  uploader (no cross-user access).
- **Rate limits** (in `backend/src/index.js`): global 600/15min, auth 20/15min, writes 100/10min.
- **Secrets:** the old Zoho email-script password was committed once and has been **rotated**;
  keep all secrets in env / `.env` (git-ignored), never in code. DB credentials live in
  `backend/.env`.
- **Automated tests:** `backend/tests/` includes `security-sanitize.test.js` and
  `security-authz.test.js` (adversarial input + auth-pipeline). Run `cd backend && npm test`
  (≈140 tests). Run them before every deploy.
- **Reliability nets:** the API has `unhandledRejection`/`uncaughtException` handlers and
  try/catch around all socket handlers, so one bad request can't crash the process.

---

## 6. Changed this session (current state)
- Fixed Prisma migration drift → documented `db push` workflow.
- Added 11 DB performance indexes (live).
- Hardened inputs (sanitisation, transactional profile writes, crash-proofing, N+1 fixes).
- Added `communityOnly` tier (DB column live + apply-route gate + schema).
- Added the two security test suites.
- Built `send_acceptances.py` (Brevo).
- Rotated the leaked Zoho credential; removed the old rejection script.

Outstanding (see above): domain env vars, Turnstile on signup, hide Apply button for community
users, DKIM/DMARC for Brevo.

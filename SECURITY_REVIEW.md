# Lawnn — Security Review & Hardening

_Last updated: 2026-06-19 · Scope: full pre-launch review of the Express/Prisma backend, Socket.io, and React/Vite frontend, including the Jobs→Projects merge, the manual-InstaPay payment flow, private file signing, and feed comments. Changes applied locally only — not committed or pushed._

## Summary

The codebase remains in good shape on fundamentals: bcrypt (12 rounds), JWT verification with a fail-fast on a missing/weak secret, parameterised Prisma queries (no SQL-injection surface), role checks on privileged routes, helmet, a CORS allowlist, rate limiting (global + strict auth), atomic payment-state transactions, and identity derived from the verified JWT rather than request-body claims. The frontend has **no** `dangerouslySetInnerHTML`, `innerHTML`, or `eval` sinks, and ships **no secrets** (only the public API base URL; all storage uploads go through backend-signed URLs).

This pass focused on the surface added/changed since the June 10 review. The new payment, application, and comment endpoints enforce authorization correctly: the payment state machine's money steps are admin-only, payment-proof and application files in the private bucket are only signed for the admin or the owning client (a hired student never sees the client's transfer screenshots or rival applicants' files), and comments are limited to approved posts and rendered as escaped JSX text.

One genuine access-control bug was found and fixed (profile mass-assignment), along with several hardening fixes (pagination caps, stricter proof-path validation). A short list of items remains that only you can complete (credential rotation, `npm audit`, `.env` check) plus the standing architectural recommendation to move the JWT out of `localStorage`.

## Findings and fixes (applied this pass)

### MEDIUM — Mass-assignment IDOR in `PATCH /profiles/:id` (education/experience)
The education and experience replacement blocks built rows with `education.map(e => ({ profileId: req.params.id, ...e }))`. Because the spread came **after** `profileId`, a caller editing their own profile could include `profileId: "<victim>"` in an education/experience entry and override it, writing rows into another user's profile.

Fix: both blocks now pick explicit fields only (`degree`/`school`/`years`, `role`/`company`/`years`) and never spread the raw body object. (`profiles.js`)

### MEDIUM — Unbounded list queries (DoS / scraping)
Several `findMany` calls had no `take` limit: the Projects board, the My-Projects list, the public talent directory, and feed comments. A large dataset (or deliberate growth) would let one request pull everything.

Fix: added `take` caps — board/comments/directory `take: 200`, My-Projects `take: 200` — and capped the conversation messages page size at 100 (`Math.min(parseInt(limit)||50, 100)`). (`projects.js`, `profiles.js`, `feed.js`, `conversations.js`)

### LOW — Payment-proof path not fully validated
`POST /projects/:id/payment-sent` accepted any client-supplied string starting with `payment-proof/` and later signed it for the admin/owner to view.

Fix: the path must now match `^payment-proof/[A-Za-z0-9_][A-Za-z0-9_\-/.]*$` and contain no `..` (no traversal, no scheme). (`projects.js`)

## New surface — verified safe (no change needed)

- **Payment flow:** deposit/final confirmations (`advance`) are admin-only; `payment-sent` is restricted to the paying client; a talent cannot self-advance money steps. Wallet credit happens once, inside a transaction, only on completion. (`projects.js`)
- **Private file signing:** application files and payment-proof screenshots are stored as private-bucket paths and only swapped for short-lived signed URLs for an admin or the owning client. A hired student never receives the client's payment screenshots, and applicants can't see each other's files. `GET /projects/:id` lets any signed-in user read an `open` project but does **not** include applications. (`projects.js`, `uploads.js`)
- **Hiring authorization:** accepting/rejecting an applicant and moving `open → offer_accepted` is restricted to the project owner or an admin, and only while the project is `open`. (`projects.js`)
- **Comments:** allowed only on `approved` posts, require non-empty content, and render as escaped JSX text (no HTML injection). (`feed.js`, `FeedPage.jsx`)
- **URL writes:** every new URL/path write (application files, project attachments, portfolio refs) flows through `safeUrl()`, rejecting `javascript:`/`data:`/protocol-relative values. (`projects.js` via `cleanFiles`, `profiles.js`)
- **Messaging & notifications:** conversation reads enforce participant/admin checks; notification read/read-all are scoped by `userId` (no IDOR). (`conversations.js`, `notifications.js`)
- **Admin routes:** all under `requireAuth + requireRole('admin')`; invites use SHA-256-hashed tokens with a 7-day TTL; deletion guards against self-deletion and surfaces FK conflicts instead of 500s. (`admin.js`)

## Lower-priority items — RESOLVED (2026-06-20)

- **Email normalization.** ✅ Added `normalizeEmail()` (trim + lowercase), applied at register, login, and admin create-student/create-client. Existing rows were backfilled to lowercase in the DB (no case-collisions found). Prevents near-duplicate accounts and case-sensitive login.
- **Login user-enumeration via timing.** ✅ Login now always runs a `bcrypt.compare` — against a dummy hash when the email isn't found — so response time no longer reveals whether an email is registered.
- **Password-length inconsistency.** ✅ `/admin/clients` now requires 8 characters, matching self-register and invite acceptance.

## Findings and fixes (applied 2026-06-21 — realtime & auth pass)

This pass re-read the whole backend against the documented June 19 fixes (all confirmed present) and focused on the Socket.io layer and the password-change endpoint, which the prior review hadn't covered in depth.

### MEDIUM — Suspended/deleted users keep full realtime (Socket.io) access
`requireAuth` does a per-request DB lookup so a ban/delete kicks the offender on their next HTTP call. The socket handshake did **not**: `io.use` only ran `jwt.verify`, so a suspended or deleted user holding an unexpired 7-day token could still open a socket, join their conversation rooms, send messages, and flip read receipts — the realtime layer ignored the instant-ban guarantee the HTTP layer enforces. Role was also read from the (stale) token rather than the DB.

Fix: the socket auth middleware is now async and looks up the live account (`findUnique` → reject if missing or `suspended`), and derives `socket.user.role` from the DB row, not the token. (`socket.js`)

### LOW — `mark_read` had no participant check
The `mark_read` socket handler ran `message.updateMany` scoped only by `conversationId`, so any authenticated socket could clear unread state on a conversation it isn't part of (and emit a read receipt into that room).

Fix: `mark_read` now loads the conversation and returns unless the caller is the client, talent, or admin participant. (`socket.js`)

### LOW — Unbounded socket message length (DoS / storage)
`send_message` trimmed `content` but applied no length cap. Socket payloads bypass the REST `express.json({ limit: '1mb' })` guard, so a client could persist arbitrarily large message strings.

Fix: message content is now capped at 5000 chars (`content.trim().slice(0, 5000)`). (`socket.js`)

### LOW — Password change required no re-authentication
`POST /auth/change-password` accepted a new password on a valid token alone. A leaked/borrowed token could change the password (locking out the real owner) with no knowledge of the existing one.

Fix: an established account must now supply a correct `currentPassword` (verified with `bcrypt.compare`). The forced first-login flow (`mustChangePassword`) is exempt, since those students are setting a password for the first time — so the existing `FirstLoginSetup` UI is unaffected. A future "change password" settings form must send `currentPassword`. (`auth.js`)

## Findings and fixes (applied 2026-06-21 — abuse-hardening pass)

A follow-up pass focused on tampering, spam/DoS, and unbounded input on the write endpoints. Verified clean first: the React frontend has **no** `dangerouslySetInnerHTML`/`innerHTML`/`eval` sinks; `.env` is gitignored (only `.env.example` is tracked); deps are current (`jsonwebtoken@9`, `helmet@7`, `express@4.19`); `notify()` can't throw. Confirmed the schema already enforces `@@unique([projectId, authorId])` on `Review` and `@@unique([projectId, userId])` on `Application`, so rating/application stuffing is constraint-blocked — but the review route surfaced the violation as a 500.

### LOW — Unbounded user-generated text (storage abuse / response bloat)
Free-text fields were stored untrimmed and uncapped. `express.json({ limit: '1mb' })` bounds one request, but a user could still persist many ~1MB rows or oversized strings that bloat every list payload.

Fix: added `clampText(value, max)` to `sanitize.js` and applied per-field caps on write — feed posts (5000) and tags (20×40), comments (2000), project title (200)/brief (5000)/category/skills, application notes (5000), review comments (2000), marketplace title (200)/description (5000)/category, and offer messages (1000). Socket messages were already capped (5000) in the prior pass. (`sanitize.js`, `feed.js`, `projects.js`, `marketplace.js`)

### LOW — Marketplace offer spam + integer-overflow amount
A buyer could stack unlimited pending offers on one listing (a seller-notification flood), and the offer amount was `parseInt`'d with only a `> 0` check, so a value beyond the 32-bit `Int` column would throw a 500.

Fix: offer amounts now go through `nonNegativeInt` and are bounded to `1_000_000_000`; a buyer is limited to one pending offer per listing (409 otherwise). (`marketplace.js`)

### LOW — Duplicate review returned a 500
The one-review-per-project constraint threw an uncaught `P2002`.

Fix: the review create is wrapped to return a clean 409 ("You have already reviewed this project"). (`projects.js`)

### LOW — Unparseable `before` cursor threw a 500
`GET /conversations/:id/messages?before=` passed `new Date(before)` straight to Prisma; a garbage value became `Invalid Date` and threw.

Fix: an unparseable `before` is now ignored rather than queried. (`conversations.js`)

### Hardening — targeted write rate limiting
The global limiter (600 / 15 min) is generous for content creation. Added a `writeLimiter` (100 writes / 10 min, GET/HEAD exempt) on `/feed`, `/marketplace`, `/projects`, `/conversations`, and `/uploads`, plus the auth limiter on `/auth/change-password`. Browsing is unaffected; automated flooding of the create/sign endpoints is throttled. (`index.js`)

## Findings and fixes (applied 2026-06-21 — headers & authz pass)

### Hardening — Content-Security-Policy + security headers (the standing CSP rec)
Added `public/_headers` (copied to the build root, where Cloudflare Pages reads it). Ships a CSP scoped to the app's real origins — `script-src 'self'` (no inline scripts; `'unsafe-eval'` deliberately omitted), `style-src 'self' 'unsafe-inline' fonts.googleapis.com` (React inline-style attributes + Google Fonts), `font-src` gstatic + `data:`, `img-src 'self' data: blob: *.supabase.co`, `connect-src 'self' onrender + wss + *.supabase.co` — plus `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and HSTS. **Verify the deployed site after the first Pages deploy** — if the API or Supabase host moves, update `connect-src`/`img-src`. This shrinks the impact of any future stored-XSS (the JWT in `localStorage` can no longer be exfiltrated to an arbitrary origin).

### LOW — Client could self-promote a project to VIP
`POST /projects` set `vip: Boolean(vip)` from the body, and the board orders `vip desc`, so any client could pin their own project to the top.

Fix: `vip` is only honoured for admins; a client's value is forced to `false`. (`projects.js`)

### LOW — Non-admins could mint uploads into the admin `site` folder
`POST /uploads/sign` accepted `kind: 'site'` (the admin-only homepage hero image) from any authenticated user.

Fix: the `site` kind now requires the admin role. (`uploads.js`)

## Findings and fixes (applied 2026-06-21 — hardening batch + tests)

### Hardening — shorter JWT lifetime
Default token TTL dropped from 7d to **24h** (`JWT_EXPIRES_IN` still overrides). Suspension/deletion/role-change already take effect immediately (per-request live-account read), so this only bounds the raw-token-theft window. Raise the env value if frequent re-logins become a problem before a refresh-token flow exists. (`auth.js`)

### Hardening — upload safety
`POST /uploads/sign` now **requires a valid `size`** and enforces the per-type cap (a client omitting `size` previously skipped the check). Financial payment-proof signed-read URLs now expire in **10 minutes** instead of 60. (`uploads.js`, `projects.js`) Note: with direct-to-Supabase signed uploads the backend never sees the bytes, so server-side magic-byte validation isn't possible — the real controls are the content-type allowlist, the Supabase bucket config (ensure the public bucket serves with the stored content-type and doesn't allow override), and the CSP.

### Hardening — path traversal in `safeUrl`
`safeUrl()` now rejects any value containing `..` (previously a scheme-less path like `a/../b` passed; only the payment-proof route blocked traversal separately). Covered by the new tests. (`sanitize.js`)

### NEW — security-focused test suite (`backend/tests/`)
Added **Vitest** (`npm test`) with `sanitize.test.js` (15 tests over `safeUrl`, `clampText`, `nonNegativeInt`, `normalizeEmail` — the XSS/traversal/integer guards) and `authz.test.js` (`requireRole` allow/deny). All 19 tests pass on Windows.

_Dependency note:_ Vitest is pinned to **`^3.2.4`** (not 2.x). The initial 2.x pin pulled an old `vite`/`esbuild` chain that `npm audit` flagged (incl. 1 critical / 1 high); 3.2.x clears those, leaving only a single **low-severity, dev-server-only** esbuild advisory (`GHSA-g7r4-m6w7-qqqr`) that Vitest never triggers — it's transform-only, the esbuild dev server is never run. These are **devDependencies** (like the existing `prisma`), so with `NODE_ENV=production` on Render they aren't part of the production runtime. Do **not** `npm audit fix --force` (it would jump major versions). The backend's *runtime* deps remain clean.

### Login/account enumeration — reviewed, documented (no code change)
Login is already generic + timing-safe (dummy-hash compare). The residual leak is `POST /auth/register` returning 409 "account already exists", which reveals a registered email. It's rate-limited (20/15min). Fully hiding it requires an email-verification flow (return a neutral "check your email" and notify the existing owner out-of-band) — the app has no transactional email yet, and hiding "email taken" without it would break the signup UX. Recommend bundling this with email verification later rather than degrading signup now.

### JWT → httpOnly cookie — plan written (no code change)
See `docs/JWT_COOKIE_MIGRATION.md` for the full migration plan, the cross-origin (Cloudflare ↔ Render) cookie constraint, the CSRF mitigation, step-by-step rollout, and rollback. Key prerequisite: put the API on a same-site host (`api.lawnndesign.com`) first.

## Action items for you (need DB access / shell / hosting config)

1. **Rotate any leaked credential.** The prior review flagged a `yomna@lawnndesign.com` credential committed in history (GitGuardian). Rotate/delete it in the DB; optionally scrub git history.
2. **Run `npm audit`** in both the repo root and `backend/`, and update anything flagged. (Couldn't run in-sandbox.)
3. **Confirm `backend/.env` is untracked:** `git ls-files backend/.env` should return nothing, and verify no real secrets ever landed in history.
4. **Set `NODE_ENV=production`** in the deployed backend — the Supabase client now refuses to boot in production if Storage env vars are missing, which only triggers when `NODE_ENV=production`.

## Standing architectural recommendations

- **Move the JWT from `localStorage` to an httpOnly, Secure, SameSite cookie.** With the XSS sinks closed this risk is much reduced, but a cookie removes the script-readable-token primitive entirely. (Requires backend cookie issuance + CSRF protection.)
- **Add a Content-Security-Policy** header at the frontend host (Cloudflare Pages) to constrain script/connect sources.
- **Shorten the 7-day JWT lifetime and/or add revocation** if you need to force logout (e.g., on role change or account deletion — currently a deleted/demoted user's token stays valid until expiry).
- **Adopt a validation library (zod)** for request bodies. Validation is currently sound but ad-hoc; a schema layer reduces the chance a future endpoint forgets a check.

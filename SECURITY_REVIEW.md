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

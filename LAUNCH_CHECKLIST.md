# Lawnn — Launch Readiness Checklist
_Updated 2026-07-11 · after full security audit + 2 fix rounds + live DB work_

## ✅ Done — code (already on your disk, hash-verified)

**Security**
- Client `website` field now sanitized on write (`safeUrl`) — closes the stored-XSS gap (`profiles.js`)
- Payment-proof paths pinned to the uploader's own folder — no cross-user proof attachment (`projects.js`)
- Comments/likes blocked on non-approved feed posts (`feed.js`)
- One-time Zoho email script (leaked password) moved to `_to_delete/` — **empty that folder yourself**; the password was already rotated ✔
- Session lifetime reduced 7d → 24h in local `backend/.env`

**Stability (crash-proofing — the API can no longer be killed by one bad request)**
- Process-level `unhandledRejection` / `uncaughtException` safety nets (`index.js`)
- All socket handlers wrapped in try/catch; `join_conversation` promise bug fixed (`socket.js`)
- Admin moderation on a deleted project/post now returns 404 instead of crashing the process (`projects.js`, `feed.js`)
- Duplicate-email registration race returns 409 instead of crashing (`auth.js`)
- Admin delete endpoints return clean 409/500 instead of crashing (`admin.js`)
- Profile skills/portfolio/education/experience replacement is transactional — no more data-wipe window (`profiles.js`)
- Names clamped to 120 chars everywhere; review ratings integer-validated; `hourlyRate`/`year`/`deliveryNote` validated

**Performance**
- 11 new database indexes on every hot path (messages, projects board, offers, applications, listings, feed)
- Conversation unread counts: one grouped query instead of one query per conversation (`conversations.js`)
- Project list no longer makes a Supabase signing call per application file — signed URLs are fetched only when a client opens the applications view (`projects.js`)
- Admin chat connections join 1 room instead of every conversation room (`socket.js`)
- Rating recalculation uses a DB aggregate instead of loading all reviews (`projects.js`)
- Frontend `url()` styles hardened with `encodeURI` (4 files)

## ✅ Done — live database (applied directly to Supabase, verified)
- All 11 indexes created in production (names match Prisma conventions)
- Stale migration bookkeeping removed; old migration folder archived to `prisma/_archived_migrations/`
- Repo is now honest: this project uses the **`db push`** workflow — `backend/prisma/migrations/README.md` explains everything, including the one command that rebuilds a fresh database (`npm run db:push`)
- Verified: `lawnn-private` bucket is private, `lawnn-public` is public; Supabase security/performance advisors show **no warnings above INFO level**

## 🔴 Your 3 actions before launch (only you can do these)

1. **Deploy.** Review the changes, then commit & push. Cloudflare Pages (frontend) and Render (API) will pick them up. Until you deploy, production is still running the old code.
2. **Render dashboard → Environment:** set `JWT_EXPIRES_IN` = `24h` (the local `.env` only affects your machine — Render uses its own env vars). While you're there, confirm `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `FRONTEND_URL`, `DATABASE_URL` are all set. Optional but recommended: set `TURNSTILE_SECRET` so the login CAPTCHA is actually enforced in production.
3. **Empty `_to_delete/`** in the project folder (it holds the old Zoho script with the retired password), and run `npm test` inside `backend/` on your machine — all 7 test files should pass before you push.

## 🟡 Soon after launch (not blockers)
- Turn on cookie-based sessions (`COOKIE_AUTH=on`) once the API moves to a same-site subdomain — the code is already built
- Turn on Supabase backups/PITR before real client payments flow through the platform
- If the repo was ever shared while the Zoho password was in it, scrub git history (`git filter-repo`) — the password is rotated, so this is hygiene, not urgent
- When you have real production data, adopt versioned migrations — the two commands are in `prisma/migrations/README.md`

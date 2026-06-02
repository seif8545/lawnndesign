# Lawnn — Session Handoff

Paste this at the start of a new chat to bring the assistant up to speed.

---

## Project

**Lawnn** — Egyptian creative-student marketplace. Repo: `C:\Users\DELL\Downloads\lawnndesign` (GitHub: `seif8545/lawnndesign`).

**Stack:**
- Frontend: Vite + React 18 + Tailwind, single-file `src/App.jsx` (~6800 lines, monolithic). Deployed on Cloudflare Pages at `https://lawnndesign.pages.dev`.
- Backend: Express + Prisma + Postgres (Supabase) + Socket.io. Deployed on Render at `https://lawnndesign.onrender.com` (free tier — sleeps after 15min idle, ~30s cold start).
- Auth: JWT in localStorage, bcrypt 12 rounds, admin-issued invite flow for students.
- Storage: Supabase Storage — `lawnn-public` (portfolio/feed/avatar/job-attachments) + `lawnn-private` (application files).

**Test accounts:**
- `admin@lawnndesign.com` / `lawnn-admin`
- `client@lawnndesign.com` / `lawnn-client`
- `student@lawnndesign.com` / `lawnn-student`

**Deploy:** push to `main` → Cloudflare Pages auto-builds frontend (~1–2 min), Render auto-redeploys backend (~2–3 min). Schema changes: `cd backend && npx prisma db push`, commit `schema.prisma`, push.

---

## What's working (live)

- **Auth:** login, register (clients only), JWT hydration, admin invite flow.
- **Real-time chat** (Socket.io with JWT handshake, typing, read receipts, admins silently join all rooms).
- **Profiles/Directory** with persistence via PATCH.
- **Job Board:** post (clients pending / admin live), apply, hire (creates Project + filled job + rejects others), reject single application, delete own job (with guardrails).
- **Projects:** client creates, pay deposit, approve delivery, review. Talent submits delivery. Escrow transitions atomic. **Client can now delete `open`-status projects.**
- **Feed:** post (pending for non-admin), like, admin moderation, delete.
- **Marketplace:** list, edit (title/description only — price locked), delete, admin approve/reject. Offer-flow still mock.
- **File uploads (Supabase Storage):** portfolio image/PDF, avatar, job attachments, application files (private, signed read URLs). Two-step signed upload URL flow.
- **Security:** helmet, rate-limit on `/auth/*`, multi-origin CORS, escrow transitions atomic.
- **Spam-click guards (`useBusy` hook)** across all submit-style surfaces: job post, apply, hire, reject, feed post, marketplace save, all project state transitions (pay deposit, approve, submit review, submit delivery), post project, delete project.

---

## Architecture notes

- Frontend↔API shape translation lives in mappers near the bottom of `App.jsx` (just before `App()`): `mapApiProfile`, `mapApiJob`, `mapApiFeedPost`, `mapApiProject`, `mapApiListing`, `talentToApiBody`, `formatRelativeTime`. Pattern is "fetch → map to legacy mock shape → render".
- `useBusy()` hook (near top of `App.jsx`) wraps async submit handlers. Two-layer guard: `useRef` lock (synchronous, blocks re-entry even before React commits) + `useState` flag (drives disabled UI). Necessary because Render's free tier cold-starts can hang a POST for ~30s, during which a user spam-clicks.
- File uploads: client POSTs `/uploads/sign` with `{ kind, contentType, size }` → backend returns `{ signedUrl, path, publicUrl, isPrivate }` → client PUTs file directly to Supabase. For private bucket (applications), backend swaps stored paths for short-lived signed read URLs in the `GET /jobs/:id/applications` response.
- Backend env requires `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. Both set in Render and local `.env`.

---

## Open tasks (priority order)

### 1. Mock data cleanup (task #22)
`TALENTS`, `JOBS`, `FEED_POSTS`, `MOCK_PROJECTS`, `NEWS_POSTS`, `MARKETPLACE_LISTINGS` consts at the top of `App.jsx` are dead — no live code reads from them, but they sit there as ~600 lines of waste.

**IMPORTANT:** previous `sed` deletion corrupted the file due to a bash-mount staleness bug. Next attempt MUST use the `Edit` tool, one const at a time, with full surrounding context. Verify after each via `Read`. **Do NOT use `sed -i` on `src/App.jsx`.**

### 2. News page (task #18)
Still on mock data. Schema doesn't have a `News` model yet. Need to:
- Add `News` model to `backend/prisma/schema.prisma`
- `cd backend && npx prisma db push`
- Build `backend/src/routes/news.js`
- Mount in `backend/src/index.js`
- Add `news` API helper in `src/lib/api.js`
- Wire `NewsPage` in `App.jsx` (currently consumes `newsPosts` state seeded from `NEWS_POSTS` mock)

### 3. Feed image upload UI
Feed composer's image button (`feed-img-upload` input around line ~3041 in App.jsx) just appends `[Image: filename]` text. Backend `feed` upload kind is already registered in `routes/uploads.js`. Needs:
- Real upload via `uploadFile(file, 'feed')`
- Inline preview in composer
- Pass `imageUrl` to `feedApi.create({ ..., imageUrl })`

### 4. Paymob integration
Wallet/escrow currently just increments `walletBalance` in DB. When ready:
- Deposit collection at `offer_accepted → deposit_paid` (`POST /projects/:id/advance` for client at this state)
- Remainder at `delivered → completed`
- Both transitions already use `prisma.$transaction` so dropping in Paymob webhook handlers is straightforward.

### 5. Cancel-with-refund flow for in-progress projects
Backend `DELETE /projects/:id` currently blocks non-admin deletion of any project past `open` status with a 409. For a fuller UX, build a cancellation flow that:
- Releases the talent (notify, mark application back to available?)
- Refunds the deposit (Paymob-dependent)
- Marks project `cancelled` instead of deleting

---

## Known minor issues

- Budget display lost commas on job cards (`3500 EGP` instead of `3,500 EGP`).
- Feed "like" has no per-user tracking — increments only.
- Marketplace offer/reply flow uses local state (no `Offer` model in DB).
- Sample-portfolio refs in job applications aren't sent to backend (only uploaded files are).
- `currentUser.profile` may not be hydrated on every reload depending on which endpoint last set it — components handle the optional-chaining.
- Commit `efda082` accidentally included 2 `vite.config.js.timestamp-*.mjs` files. They're now tracked. Run `git rm --cached vite.config.js.timestamp-1780304616645-035371c4251b2.mjs vite.config.js.timestamp-1780304657480-408120d222afc.mjs` to remove from tracking (the `.gitignore` already excludes future ones).

---

## Critical gotchas

- **Don't use `sed -i` on `src/App.jsx`.** The cowork bash mount caches reads stale (snapshot from session start) while writes go through to the real file. `sed -i` reads stale, applies edits, writes back — overwriting fresh edits with truncated stale content. Use the `Edit` tool exclusively for that file.
- **Bash mount staleness affects build verification.** `npm run build` in the sandbox may fail with "Unterminated string literal" pointing at content that's actually correct on the real disk — that's the mount serving stale content. Verify code via `Read` instead. Real builds happen on Cloudflare Pages from GitHub.
- **JWT in localStorage** keyed as `lawnn_token`. Per-user onboarding dismissal is `lawnn_onboarding_done_<userId>`.
- **Render free tier sleeps.** First request after 15min idle hangs ~30s. The `useBusy` guards exist specifically for this — without them, users spam-click during cold-start and create duplicates.

---

## Suggested next session

1. **Mock data cleanup (task #22)** — biggest line-count win, lowest risk. ~600 lines out of `App.jsx`. Do one const at a time via `Edit`, verify each via `Read`. Don't touch anything that imports them (nothing does, but double-check via `Grep` first).
2. **News page (task #18)** — full vertical slice: schema → migration → route → API helper → frontend wire. Most engaging task; touches every layer.
3. **Feed image upload** — small, satisfying. Backend already supports `feed` kind, just needs frontend UI.

Pick one and ship it before moving on.

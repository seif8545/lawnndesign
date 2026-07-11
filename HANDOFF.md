# Lawnn — Session Handoff (updated 2026-06-29)

Snapshot for a fresh session. Supersedes the 2026-06-23 handoff. This session was a **data reset + DB hardening + small frontend/legal pass**, and everything was **committed and pushed by the owner** (so it's live on Render + Cloudflare) unless noted. Read "Deploy & verify" if you're touching the backend.

## Project & stack
- **Repo:** `C:\Users\DELL\Downloads\lawnndesign`
- **Frontend:** Vite + React 18 + Tailwind (`src/`). Hosted on **Cloudflare Pages**. No react-router — navigation is a `view` state in `App.jsx` switched via `handleNavChange(v, talent)`.
- **Backend:** Express + Prisma + Socket.io (`backend/`). Hosted on **Render** at `https://lawnndesign.onrender.com`.
- **DB + file storage:** **Supabase** — project `LawnnDesign`, id `fojptzeakjieqcuwgpbl` (eu-west-1). Storage buckets: `lawnn-public`, `lawnn-private` (private confirmed NOT public).
- **Fonts:** Playfair Display (`font-display`), DM Sans (`font-body`), Noto Naskh Arabic. **Colors:** navy `#21326c`, orange `#ff9044`, cream `#fffcf4`.
- **Test accounts (all "Yomna"):** `admin@`, `client@`, `student@lawnndesign.com`. Passwords were rotated in the 2026-06-23 session and are NOT stored in the repo — ask the owner. **All three accounts were KEPT through this session's data wipe.**
- **Support email:** `info@lawnndesign.com` (changed from the old `hello@` this session).

## This session (2026-06-29) — what changed

### 1. Full test-data wipe (live DB)
The database was reset to a **clean slate** while keeping the 3 login accounts. Deleted: all projects (5), applications + application_files, conversations + messages, notifications (82), feed post/likes/comments, the marketplace listing, project_skills/attachments, and all profile content (skills, experience, education, client_profiles). The student `profiles` row was kept but **blanked**: `bio=NULL`, `avatar=NULL`, and `walletBalance/rating/reviewCount/completedJobs` reset to 0; `users.failedLoginAttempts/lockedUntil` cleared. **The owner then emptied both storage buckets** (`lawnn-public`, `lawnn-private`) from the Supabase dashboard — there are no orphaned files left. Net: the app is a blank canvas with 3 working logins.

### 2. DB security + dead-code audit
- **RLS now enabled on ALL 25 public tables.** The only gap was `public._prisma_migrations` (RLS was disabled → exposed to the anon key); fixed with `ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;`. All app tables remain RLS-enabled **with no policies = deny-by-default**; the backend uses the service-role/owner connection which bypasses RLS (this is intentional — the security advisor's `rls_enabled_no_policy` INFO lints are expected, not bugs).
- **No schema drift:** `schema.prisma` is fully in sync with the live DB (24 mapped tables + enums). No leftover `project_files` artifacts. No orphaned rows.

### 3. Repo hygiene (committed)
- Deleted the 15 stray `vite.config.js.timestamp-*.mjs` files (were untracked; already gitignored).
- `git rm` the dead **`backend/src/routes/jobs.js`** — it was tracked but not imported in `index.js` (which mounts 11 other route files). NOTE: two **stale comments** still reference it in `backend/src/routes/uploads.js` (~lines 109, 113, "e.g. jobs.js applications endpoint") — harmless, left as-is.
- Confirmed `dist/` is untracked + in `.gitignore` (the old backlog item was already resolved).

### 4. SkillPicker upgrade (`src/components/ui.jsx`)
Empty state now shows the **most common skills as quick-pick chips** (new `COMMON_SKILLS` array in `constants.js`, all drawn from the existing `SKILL_LIBRARY`); typing switches to **type-ahead autocomplete** over the full library, with free-text custom add preserved. Used everywhere SkillPicker is (Profile, About, Projects).

### 5. Legal / policy pages (committed)
Inspired by competitor **engezhaly.com** (an Egyptian freelance escrow marketplace). Upgraded the existing `INFO_PAGES` content (`src/lib/constants.js`) rendered by `src/pages/InfoPage.jsx`:
- **Terms** expanded: on-platform communication & dispute evidence, anti-circumvention ("keep deals on Lawnn"), escrow (50% deposit + balance, InstaPay, admin-confirmed), **service fee**, quality/deadline/accountability penalties, account actions.
- **Refund Policy** added (new `refund` slug + route in `App.jsx` + footer link): missed deadline → full refund + rematch; work-doesn't-match → reviewed from on-platform record; midway refunds only if no progress by halfway. Adapted to the 50% deposit model.
- **Privacy** expanded (chat/files, payment screenshots, dispute monitoring, public/private buckets + signed links).
- **Contact** now covers raising a dispute + fees. Email updated `hello@` → `info@lawnndesign.com` everywhere.
- Plain-markdown copies live in **`docs/policies/{terms,refund,privacy,contact}.md`** for review.
- **Fee model decision:** standard **5% service fee**, presented as applying from day one but **currently fully waived (0%) as a launch promotion** (shown discounted to drive early growth; right to apply the 5% later with notice).
- ⚠️ These are plain-language drafts modeled on a competitor, **not legal-reviewed**. Before relying on them, have a lawyer check against Egyptian law — esp. the **Personal Data Protection Law (151/2020)** for Privacy and consumer/e-payment rules for the escrow/refund/penalty clauses.

## Deploy & verify (if touching backend)
- **Both Render and Cloudflare auto-deploy from GitHub on push.** Committing + pushing is what ships.
- Backend runtime dep `@node-rs/argon2` — run **`npm install`** in `backend/` before anything.
- **`npm test`** (backend) → should be **53 green** across 7 Vitest files.
- **`npm audit`** (backend): exactly **1 low** advisory (esbuild dev-server via Vitest) — **leave it**.
- **Sandbox quirk:** the Cowork sandbox file mount serves stale/truncated copies and **cannot delete files** (`rm`/`git rm` fail with "Operation not permitted"; a leftover `.git/index.lock` can result — delete it manually). **All real builds, file deletions, and git ops must run on the owner's Windows machine.** This session's frontend edits were esbuild parse-checked only — smoke-test with `npm run dev`.

## Security posture (carried from 2026-06-23, still true)
- **Password hashing: Argon2id** (`backend/src/lib/password.js`); legacy bcrypt auto-upgrades on next login.
- **Password policy** (`validatePassword` in `sanitize.js`): 8–72 chars + lower/upper/number/special.
- **Change-password** requires current password and bumps `tokenVersion` (logs out other sessions).
- **JWT** carries `tv` (tokenVersion); default lifetime 24h (`JWT_EXPIRES_IN`). Per-request live-account check for instant ban/suspend/role-change.
- **Login throttle** (`loginThrottle.js`): escalating cooldown after 5 fails (30s→15m), self-healing (not a hard lockout). New-sign-in notification on success.
- **CAPTCHA: Cloudflare Turnstile** after 3 failed logins (gated on `TURNSTILE_SECRET`).
- **RLS:** deny-by-default on every public table (now including `_prisma_migrations`). If you add a table via Prisma, enable RLS on it.
- **CSP + security headers** in `public/_headers` (Cloudflare Pages). Verify live console after deploy.
- **Cookie-auth groundwork** built but **flag-gated OFF** (`COOKIE_AUTH`, default off) — see `docs/JWT_COOKIE_MIGRATION.md`.

## Architecture highlights (still true)
- **One core entity: `Project`**: `pending` → admin `open` → students apply → client accepts (`offer_accepted`) → deposit → `in_progress` → `delivered` → `completed` → `reviewed`. Nav: **Projects** (board, view id `jobs`) + **My Projects** (lifecycle, view id `projects`).
- **Payments are manual (InstaPay), admin-confirmed.** 50% deposit then balance off-platform; client uploads a screenshot (private `payment-proof`); admin confirms or **rejects with a reason**. `walletBalance` = total earned.
- **Project chat** lives in the My Projects modal (client & talent from `offer_accepted` onward); file sharing is in-chat (private + short-lived signed URLs). Same conversation also shows in the standalone Messages page.
- **User suspension/ban:** `User.suspended`; per-request DB check (instant kick).
- **Site settings:** `SiteSetting` key/value + `/settings` (GET public, PATCH admin). Powers the homepage hero carousel (`homeHeroImages`).
- **Info pages:** `INFO_PAGES` in `src/lib/constants.js` (slugs: `about-lawnn`, `terms`, `refund`, `privacy`, `contact`) rendered by `src/pages/InfoPage.jsx`, linked in the `App.jsx` footer.

## Schema (all applied to live DB + `schema.prisma`)
No model changes this session — only data deletion + RLS on `_prisma_migrations`. Prior: `User.failedLoginAttempts/lockedUntil/tokenVersion`, `Project.paymentRejectionReason`. Created then dropped `project_files`.

## Outstanding / backlog
- **Competitor-inspired roadmap (from engezhaly.com analysis):** the policy text now describes escrow disputes, deadlines, and a service fee, but **none of it is implemented in code yet.** Highest-value next builds, in order:
  1. **Disputes + deadlines:** add a `Dispute` model (`projectId`, `raisedBy`, `reason`, `status`, `resolutionNote`) + admin arbitration view reading existing chat/files; add `Project.deadline DateTime?` + overdue flagging; refunds credit `walletBalance`.
  2. **On-platform comms enforcement:** PII redaction/flag (phone/email regex) on message create in `conversations.js` + socket broadcast (extend `clampText`), plus a chat notice.
  3. **Service fee in code:** surface the 5% (currently 0%) line on payment screens; compute talent payout net of fee.
  4. **Trust band on homepage** (avg rating / completed projects / # students) + secure-payment badges.
  5. **Productized service packages** (fixed price/scope "gigs") — extend `marketplace_listings` or a new `ServicePackage`.
- **Surface Terms/Privacy at signup** (an "I agree to Terms & Privacy" checkbox on register) — currently only reachable from the footer. (Offered, not yet done.)
- **Get the policy pages legal-reviewed** (see ⚠️ above).
- **JWT → httpOnly cookie cutover** (last standing security item): backend ready behind `COOKIE_AUTH`. Needs same-site api host (`api.lawnndesign.com`), frontend cutover (`credentials:'include'` + CSRF echo), then flip the flag. Plan in `docs/JWT_COOKIE_MIGRATION.md`.
- **Refund / cancellation path** still not built (owners can't cancel past `open`) — folds into the Disputes work above.
- **Stale comments** in `backend/src/routes/uploads.js` still mention the deleted `jobs.js` — tidy when convenient.
- Onboarding has its own skill search input — could be unified with the upgraded `SkillPicker`.

## Key files
- Backend routes: `backend/src/routes/{auth,profiles,projects,admin,conversations,feed,marketplace,news,notifications,uploads,settings}.js`; middleware `requireAuth.js`; libs `sanitize.js`, `password.js`, `loginThrottle.js`, `turnstile.js`, `cookies.js`, `supabase.js`, `notify.js`; `socket.js`. (`jobs.js` deleted this session.)
- Frontend: `src/App.jsx` (state/routing/nav/footer), `src/lib/{constants.js (INFO_PAGES, SKILL_LIBRARY, COMMON_SKILLS),api.js,mappers.js,toast.js,socket.js}`, `src/components/{auth.jsx,TopNav.jsx,ui.jsx (SkillPicker),ErrorBoundary.jsx,Toaster.jsx}`, `src/pages/*` (notably `InfoPage.jsx`, `ProjectsPage.jsx`, `ChatPage.jsx`, `HomePage.jsx`, `AdminPage.jsx`).
- Docs: `SECURITY_REVIEW.md`, `docs/JWT_COOKIE_MIGRATION.md`, `docs/policies/{terms,refund,privacy,contact}.md`.

# Lawnn — Session Handoff (updated 2026-06-23)

Snapshot for a fresh session. Supersedes the 2026-06-20 handoff. The last session was a large security-hardening + feature pass; most of it is **written to disk but not yet built/pushed by the user** unless noted. Read "Deploy & verify" before anything else.

## Project & stack
- **Repo:** `C:\Users\DELL\Downloads\lawnndesign`
- **Frontend:** Vite + React 18 + Tailwind (`src/`). Hosted on **Cloudflare Pages**.
- **Backend:** Express + Prisma + Socket.io (`backend/`). Hosted on **Render** at `https://lawnndesign.onrender.com`.
- **DB + file storage:** **Supabase** — project `LawnnDesign`, id `fojptzeakjieqcuwgpbl` (eu-west-1). Storage buckets: `lawnn-public`, `lawnn-private`.
- **Fonts:** Playfair Display (`font-display`), DM Sans (`font-body`), Noto Naskh Arabic. **Colors:** navy `#21326c`, orange `#ff9044`, cream `#fffcf4`.
- **Test accounts (all "Yomna"):** `admin@`, `client@`, `student@lawnndesign.com`. **Passwords were rotated last session** (they were still the weak committed seed values). The new passwords are NOT stored in the repo — ask the owner.

## Deploy & verify (do this first)
- **Both Render and Cloudflare auto-deploy from GitHub on push.** Committing + pushing is what ships.
- **A new runtime dependency was added: `@node-rs/argon2`.** Run **`npm install`** in `backend/` before anything.
- **The Prisma schema changed** (added `failedLoginAttempts`, `lockedUntil`, `tokenVersion` on User; `paymentRejectionReason` on Project; removed the short-lived `ProjectFile` model). **Run `npx prisma generate`** in `backend/` (Render runs it on build). All these migrations are **already applied to the live DB** via the Supabase MCP connector and `schema.prisma` is in sync.
- **`npm test`** (backend) → should be **53 green** across 7 Vitest files (needs `@node-rs/argon2` and `vitest@^3.2.4` installed).
- **`npm audit`** (backend): exactly **1 low** advisory (esbuild dev-server, pulled in by Vitest) — **leave it**, dev-only and not reachable. Do NOT `npm audit fix --force`.
- **Sandbox quirk:** the Cowork sandbox file mount frequently serves **stale/truncated** copies of just-edited files, so in-sandbox `node --check`/`vite build`/`esbuild` fail spuriously. The editor writes correct canonical files. **All real builds/tests must run on the user's Windows machine.** Backend files were verified to parse; the **frontend changes from the last batch were NOT compile-verified** — smoke-test after `npm run dev`.

## Security posture (hardened last session — full log in `SECURITY_REVIEW.md`)
- **Password hashing: Argon2id** (`backend/src/lib/password.js`, via `@node-rs/argon2`). `verifyPassword` accepts either algorithm; legacy bcrypt hashes **auto-upgrade to Argon2id on the next successful login**. bcryptjs kept only to verify old hashes.
- **Password policy** (`validatePassword` in `sanitize.js`): 8–72 chars + lower + upper + number + special, enforced on register, accept-invite, change-password, admin create-client. `generatePassword()` for bulk students. Live requirement checklist in the UI (`PasswordRequirements` in `auth.jsx`).
- **Change-password** requires the current password (first-login `mustChangePassword` exempt) and **bumps `tokenVersion`** to log out all other sessions; the acting session gets a fresh token.
- **Session/token:** JWT carries `tv` (tokenVersion); `requireAuth` + socket auth reject stale tokens. Default JWT lifetime **24h** (`JWT_EXPIRES_IN`). Per-request live-account check gives instant ban/suspend/role-change.
- **Login throttle** (`loginThrottle.js`): smart self-healing escalating cooldown after 5 consecutive failures (30s→15m cap) — NOT a hard lockout (avoids DoS). **New-sign-in notification** on every successful login.
- **CAPTCHA: Cloudflare Turnstile** (`lib/turnstile.js`) required on login after **3 failed attempts** (`CAPTCHA_AFTER_FAILURES`). Gated on `TURNSTILE_SECRET` (set in Render). Public site key in `auth.jsx` (`TURNSTILE_SITE_KEY`). Inert on localhost/dev. CSP allows `challenges.cloudflare.com`.
- **Database RLS:** Row-Level Security **enabled deny-by-default on every public table** (backend uses the service-role key + owner connection, which bypass RLS). Supabase security advisor clean except expected INFO `rls_enabled_no_policy`. **If you add a new table via Prisma, enable RLS on it** (`ALTER TABLE public.<t> ENABLE ROW LEVEL SECURITY;`).
- **CSP + security headers:** `public/_headers` (Cloudflare Pages) — CSP scoped to fonts/Supabase/Render/Turnstile, plus HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy. **Verify the live site console after deploy** — a missed origin shows as a blocked resource.
- **Abuse hardening:** input length caps (`clampText`), one-pending-offer-per-listing + bounded amounts, duplicate-review → 409, unparseable `?before=` guard, targeted write rate-limiter on `/feed`/`/marketplace`/`/projects`/`/conversations`/`/uploads`, VIP flag admin-only, `site` upload kind admin-only, `safeUrl` rejects `..`, signed-upload requires a valid `size`, financial-proof signed-URL TTL 10 min.
- **Cookie-auth groundwork** built but **flag-gated OFF** (`COOKIE_AUTH`, default off) — see `docs/JWT_COOKIE_MIGRATION.md`. With the flag off, auth is the normal `Authorization: Bearer` flow.
- **Tests:** `backend/tests/` — `sanitize`, `password`, `password-hash`, `authz`, `cookies`, `loginThrottle`, `turnstile`.

## Features shipped last session
- **Project chat:** the project detail modal (My Projects) has an **embedded chat** at the top, available to client & talent from hire (`offer_accepted`) onward. **File sharing happens in the chat** as message attachments, stored **private + served via short-lived signed URLs** (`uploads` kind `chat`; signed in `conversations.js` GET + the socket broadcast). Images/PDF only. The same conversation also shows in the standalone Messages page (which now renders + sends attachments too). _(Replaced a short-lived separate "project files" table, since dropped.)_
- **Profile glitch fixed:** opening someone else's profile no longer shows your own — navigation carries the target talent (`handleNavChange(v, talent)`); this also unblocked client↔student and student↔student messaging.
- **Realtime message echo fixed:** sender now joins the conversation room on send/open (conversations started from a marketplace listing weren't echoing the sender's own messages).
- **Profile moved to the top-right avatar dropdown** ("My Profile" / Change password / Sign out); removed from the main nav.
- **Skills:** `SkillPicker` is now **search-first autocomplete with free custom entry** (no fixed-list browsing). Used on profile, about/edit, projects.
- **Homepage hero carousel:** admin-curated. **Admin → Content** manages a list of images (`homeHeroImages` SiteSetting, a JSON array); homepage rotates them every 5s with dots. Falls back to auto student-portfolio image if none set. Old single `homeHeroImageUrl` still read as a fallback.
- **Admin reject transfer screenshot with reason** (`POST /projects/:id/reject-payment`, admin-only): clears the proof, stores `paymentRejectionReason`, notifies the client; client sees a red banner and re-uploads (which clears the reason). On both deposit and final-payment steps.
- **Access changes:** marketplace listing restricted to **students + admins** (clients/guests browse + message only — enforced backend via `requireRole('student','admin')`); guest **"Post a Project"** opens the login modal; **Feed is public** for guests (already worked — loads without auth).
- **Change-password screen** (`ChangePasswordModal`) with the live requirements checklist.
- **Marketplace:** removed the "Card Colour" picker (listings default to navy); the "pending approval" caption is hidden for admins (their listings go live immediately; button reads "Publish Listing").

## Architecture highlights (carried from prior handoffs, still true)
- **One core entity: `Project`** (Jobs↔Projects merge): `pending` → admin `open` → students apply → client accepts (`offer_accepted`) → deposit → `in_progress` → `delivered` → `completed` → `reviewed`. `Application` is keyed to `projectId`. Nav: **Projects** (board, view id `jobs`) + **My Projects** (lifecycle, view id `projects`).
- **Payments are manual (InstaPay), admin-confirmed.** Client pays 50% deposit then balance off-platform, uploads a screenshot (private `payment-proof`), admin confirms (or now **rejects with a reason**). Money steps in `advance` are admin-gated. `walletBalance` = total earned.
- **User suspension/ban:** `User.suspended`; `requireAuth`/`optionalAuth` do a per-request DB check (instant kick). Suspended content hidden from public views.
- **Site settings:** `SiteSetting` key/value table + `/settings` (GET public, PATCH admin). Powers the homepage hero (now `homeHeroImages` carousel).
- **Adding students:** name + one-time invite link, or bulk/individual add by email (generated temp password, `mustChangePassword`, forced `FirstLoginSetup`).

## Schema (all applied to live DB + `schema.prisma`)
Last session: `User.failedLoginAttempts`/`lockedUntil`/`tokenVersion`, `Project.paymentRejectionReason`. RLS enabled on all public tables. Created then **dropped** `project_files`. `User.password` comment updated to Argon2id.

## New env vars (defaults safe; only TURNSTILE_SECRET needed for CAPTCHA)
`JWT_EXPIRES_IN` (default 24h) · `TURNSTILE_SECRET` (set in Render — enables CAPTCHA) · cookie-auth (inert unless `COOKIE_AUTH=on`): `COOKIE_AUTH`, `COOKIE_SAMESITE`, `COOKIE_DOMAIN`, `COOKIE_SECURE`, `COOKIE_MAX_AGE_MS`. All documented in `backend/.env.example`. Existing Render vars unchanged: `DATABASE_URL`, `DIRECT_URL`, `FRONTEND_URL`, `JWT_SECRET` (≥32), `NODE_ENV=production`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Cloudflare Pages: `VITE_API_URL`.

## Outstanding / backlog
- **Verify + push the last batch.** The 5-feature batch (profile dropdown, skills, carousel, reject-transfer, marketplace/feed) and the project-chat rework were authored but **not compile-tested in-session** (sandbox mount truncation). Run `npm run dev` and smoke-test before/after pushing.
- **JWT → httpOnly cookie cutover** (last standing security item): backend ready behind `COOKIE_AUTH`. Prereq: move the API to a **same-site host** (`api.lawnndesign.com`, Cloudflare-proxied to Render), then frontend cutover (`credentials:'include'` + echo the CSRF cookie), then flip the flag. Full plan in `docs/JWT_COOKIE_MIGRATION.md`.
- **Confirm `lawnn-private` Supabase bucket is NOT public** (Dashboard → Storage). Chat/application/payment files rely on signed URLs.
- **Chat attachments** are images/PDF only — widen to zip/design files later if needed.
- **Refund / cancellation path** still deferred (owners can't cancel past `open`).
- **Repo hygiene** (older, still open): delete stray root `vite.config.js.timestamp-*.mjs`; `dist/` is tracked (`git rm -r --cached dist` + `.gitignore`); confirm/remove dead `backend/src/routes/jobs.js`.
- Onboarding has its own skill search input (works, supports custom) — could be unified with `SkillPicker`.

## Key files
- Backend routes: `backend/src/routes/{auth,profiles,projects,admin,conversations,feed,marketplace,news,notifications,uploads,settings}.js`; middleware `requireAuth.js`; libs `sanitize.js` (`safeUrl`, `clampText`, `validatePassword`, `generatePassword`, `normalizeEmail`, `nonNegativeInt`), `password.js`, `loginThrottle.js`, `turnstile.js`, `cookies.js`, `supabase.js`, `notify.js`; `socket.js`.
- Frontend: `src/App.jsx` (state/routing/nav, `handleNavChange(v, talent)`, `heroImages`), `src/lib/{api.js,mappers.js,toast.js,socket.js}`, `src/components/{auth.jsx,TopNav.jsx,ui.jsx,ErrorBoundary.jsx,Toaster.jsx}`, `src/pages/*` (notably `ProjectsPage.jsx` — project modal/chat/payment proofs; `ChatPage.jsx`; `HomePage.jsx` — carousel; `AdminPage.jsx` — content/payments).
- Docs: `SECURITY_REVIEW.md`, `docs/JWT_COOKIE_MIGRATION.md`.

# Lawnn — Session Handoff (updated 2026-06-20)

Snapshot of the project for a fresh session. Supersedes the older `SESSION_HANDOFF.md`.

## Project & stack
- **Repo:** `C:\Users\DELL\Downloads\lawnndesign`
- **Frontend:** Vite + React 18 + Tailwind (`src/`). Hosted on **Cloudflare Pages**.
- **Backend:** Express + Prisma + Socket.io (`backend/`). Hosted on **Render** at `https://lawnndesign.onrender.com`.
- **DB + file storage:** **Supabase** — project `LawnnDesign`, id `fojptzeakjieqcuwgpbl` (eu-west-1). Storage buckets: `lawnn-public`, `lawnn-private`.
- **Fonts:** Playfair Display (`font-display`), DM Sans (`font-body`), Noto Naskh Arabic. **Colors:** navy `#21326c`, orange `#ff9044`, cream `#fffcf4`.
- **Test accounts (all "Yomna"):** `student@lawnndesign.com`, `client@lawnndesign.com`, `admin@lawnndesign.com`. Emails are now normalized lowercase in the DB.

## Deployment workflow
- **Both Render and Cloudflare auto-deploy from GitHub on push.** Committing + pushing is what ships changes. Render runs `prisma generate` on build; the live site is briefly mismatched between a DB migration and the code deploy, so push promptly after schema changes.
- **DB migrations during these sessions were applied directly to the live Supabase DB via the Supabase MCP connector**, and `backend/prisma/schema.prisma` was kept in sync. On Windows, run `npx prisma db push` (use `--accept-data-loss` only when intended) and `npx prisma generate`, then restart/redeploy.
- **Render env vars (all set):** `DATABASE_URL`, `DIRECT_URL`, `FRONTEND_URL` (the Cloudflare origin — drives CORS + Socket.io allowlist), `JWT_SECRET` (≥32 chars), `NODE_ENV=production`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Cloudflare Pages env:** `VITE_API_URL=https://lawnndesign.onrender.com` (baked in at build — redeploy Pages after changing).

## Architecture highlights (current)
- **One core entity: `Project`** (the Jobs↔Projects merge). A client/admin posts a project → `pending` → admin approves (`open`) → students apply → client accepts an applicant (`offer_accepted`) → deposit → `in_progress` → `delivered` → `completed` → `reviewed`. Hiring no longer creates a second record — the project *is* the engagement. Nav: **Projects** (board, view id `jobs`) + **My Projects** (lifecycle, view id `projects`). The old `Job` model/route/page are gone; `Application` is keyed to `projectId`.
- **Payments are manual (InstaPay), admin-confirmed.** No gateway. Client pays a 50% deposit then the balance off-platform, uploads a screenshot (private `payment-proof` bucket), and an **admin confirms receipt** (Admin → Payments tab, or inline in My Projects) to advance the state. `walletBalance` = total earned (paid out manually). Money steps in `advance` are admin-gated.
- **Applications** carry a note + files: students pick items from their portfolio and/or upload new files; the client sees them in the review modal. Private files are signed for admin/owner only.
- **Feed:** posts support **comments** (`Comment` model) and **shareable deep links** (`?post=<id>` opens the feed and highlights the post). No video anywhere (removed).
- **Marketplace:** anyone signed in can post (pending → admin-approved → active). Listings have **photo** (`imageUrl`) + **location**. Buyers can **Message Seller** (chat) — the conversation system was generalized to any buyer↔seller pair. Offers still exist. Sellers and admins can deactivate/reactivate listings.
- **User suspension/ban:** `User.suspended`. `requireAuth`/`optionalAuth` do a per-request DB check and reject suspended/deleted accounts (which triggers the frontend auto-logout) — so ban/delete kicks active sessions. Login blocks suspended users. Suspended users' content is hidden from public marketplace/feed/directory/board (admins still see all). Admin → Users has Suspend/Reinstate.
- **Site settings:** `SiteSetting` key/value table + `/settings` (GET public, PATCH admin). Currently powers the **admin-set homepage feature image** (Admin → Content). Empty = auto-pull a student portfolio image.
- **Adding students:** two ways — (1) the original **name + one-time invite link** flow; (2) new **bulk/individual add by email** (Admin → Users → Students): generates a temporary password, sets `mustChangePassword`, and on first login the student is forced to set their **name + new password** (component `FirstLoginSetup`) before profile setup.
- **Auth/session:** JWT (7d) in `localStorage`. `onUnauthorized` hook in `src/lib/api.js` → App auto-logout on any 401-with-token. Error boundary + toast system in place.

## Schema (all applied to live DB + `schema.prisma`)
Added this session: `ProjectStatus` gained `pending`/`closed` (default `pending`); `Project` gained `budgetType`, `category`, `depositProofUrl`, `finalPaymentProofUrl`, and `skills`/`attachments`/`applications` relations; `Application.jobId → projectId`; new models `ProjectSkill`, `ProjectAttachment`, `Comment`, `SiteSetting`; `User` gained `suspended` + `mustChangePassword`; `MarketplaceListing` gained `imageUrl` + `location`; `FeedPost` gained `comments`. Dropped: `Job`, `JobSkill`, `JobAttachment`, `JobStatus`.

## Environment quirks (Cowork sandbox — only relevant to that tooling)
- The sandbox file mount frequently serves **stale/truncated copies** of just-edited files, so `node --check` / `vite build` in-sandbox fail spuriously. **All real builds/tests were done on the user's Windows machine.** The editor (Read/Edit) writes the correct canonical files.
- `vite build` in-sandbox needs `ulimit -n 8192` (EMFILE); Prisma engine downloads are blocked (can't run `prisma validate/generate` there); file deletion is blocked; git index was corrupt/locked. DB work was done via the Supabase MCP connector (sandbox can't reach Postgres directly). Verification was done with standalone Node logic-simulations.

## Outstanding / backlog
- **Refund / cancellation path** (deferred): owners can't cancel a project once past `open` (deposit involved). `DELETE /projects/:id` blocks it; needs a release-talent + refund flow.
- **Repo hygiene:** delete the now-orphaned `backend/src/routes/jobs.js` (dead, unimported); delete stray root `vite.config.js.timestamp-*.mjs` files; `dist/` is tracked in git (`git rm -r --cached dist` + add to `.gitignore`). `main/` is a separate "Coming Soon" static page (left intact); `living-gallery-prototype.html` is a prototype.
- **About-page text** edits are frontend-only (don't persist) — could move into `SiteSetting`.
- **Security (standing recs in `SECURITY_REVIEW.md`):** move JWT from `localStorage` to an httpOnly cookie; add a CSP header on Cloudflare; consider shorter JWT lifetime / revocation. `requireAuth` now does a DB lookup per request (deliberate, for instant ban/delete) — fine at current scale.
- **Deps:** `npm audit` is clean on the backend; the frontend has only dev-only `esbuild`/`vite` advisories — do **not** `npm audit fix --force` (it jumps to Vite 8, breaking).
- **No automated tests** exist (no Vitest/supertest).
- Pre-launch: rotate any previously-leaked `yomna@lawnndesign.com` credential if still present.

## Key files
- Backend routes: `backend/src/routes/{auth,profiles,projects,admin,conversations,feed,marketplace,news,notifications,uploads,settings}.js`; middleware `requireAuth.js`; libs `sanitize.js` (`safeUrl`, `nonNegativeInt`, `normalizeEmail`), `supabase.js`, `notify.js`.
- Frontend: `src/App.jsx` (orchestrator: state, routing, nav wiring), `src/lib/{api.js,mappers.js,toast.js}`, `src/components/{auth.jsx,TopNav.jsx,ui.jsx,ErrorBoundary.jsx,Toaster.jsx}`, `src/pages/*`.

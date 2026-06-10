# Lawnn — Session Handoff

Paste this at the start of a new chat to bring the assistant up to speed.

_Last updated: end of the "features + cleanup" session (News, real notifications, likes, offers, admin user mgmt, client profiles, info pages, VIP removal, mock-data purge, modal portal fix)._

---

## Project

**Lawnn** (لون) — Egyptian creative-student marketplace. Repo: `C:\Users\DELL\Downloads\lawnndesign` (GitHub: `seif8545/lawnndesign`).

**Stack:**
- Frontend: Vite + React 18 + Tailwind, single-file `src/App.jsx` (monolithic), `src/lib/api.js` (REST helpers), `src/lib/socket.js`. Deployed on Cloudflare Pages at `https://lawnndesign.pages.dev`.
- Backend: Express + Prisma + Postgres (Supabase) + Socket.io. Deployed on Render at `https://lawnndesign.onrender.com` (free tier — sleeps after 15 min idle, ~30s cold start).
- Auth: JWT in localStorage (`lawnn_token`), bcrypt 12 rounds. Students join via admin invite; clients can self-register or be created by an admin.
- Storage: Supabase Storage — `lawnn-public` (portfolio/feed/avatar/job-attachments) + `lawnn-private` (application files, served via short-lived signed URLs).

**Test accounts** (created by `backend/seed.js`):
- `admin@lawnndesign.com` / `lawnn-admin`
- `client@lawnndesign.com` / `lawnn-client`
- `student@lawnndesign.com` / `lawnn-student`

**Deploy:** push to `main` → Cloudflare Pages auto-builds frontend (~1–2 min), Render auto-redeploys backend (~2–3 min) and runs `prisma generate`. Schema changes: `cd backend && npx prisma db push`, commit `schema.prisma`, push.

---

## What's working (live)

- **Auth:** login, register (clients), JWT hydration, admin invite flow for students.
- **Real-time chat** (Socket.io, JWT handshake, typing, read receipts). Now supports **admin↔anyone** and **student/client→admin "Contact support"** threads, not just client↔student.
- **Profiles/Directory** (students) with PATCH persistence. **Clients now have their own profile** (company, bio, website + their jobs/projects).
- **Job Board:** client/admin post (client jobs are `pending` until an admin approves; clients can see their own pending jobs with a badge). Students apply (apply-only — no post button). Hire creates a Project + marks job `filled` + rejects other applicants.
- **Projects (escrow):** open → offer_accepted → deposit_paid → in_progress → delivered → completed → reviewed. Wallet credit on completion (still a DB increment — no real money yet).
- **Feed:** post (students + clients; pending for non-admin), **real image upload** with inline preview, **per-user likes** (true toggle), admin moderation. (Comments feature was fake — removed.)
- **Marketplace:** list (students + admins; admin live, student pending), edit (title/desc only), delete, admin approve/reject. **Real offers** now: buyers make offers, sellers accept/reject/reply, accept marks listing sold.
- **News:** full DB-backed CRUD; admins author articles, everyone reads.
- **Notifications:** real, DB-backed, fired on events (new application, hire, job/feed/listing approval, all escrow transitions, marketplace offers). Bell shows live data; mark-one / mark-all-read hit the API.
- **Admin dashboard:** content moderation queue; **Users tab** (create students via invite, create clients directly, delete any user); **Conversations tab** with a "New message" picker to DM anyone.
- **Informational pages:** About Lawnn, Privacy Policy, Terms of Service, Contact & FAQ (footer-linked, real content).
- **Security:** helmet, rate-limit on `/auth/*`, multi-origin CORS, escrow transitions atomic, `useBusy` spam-click guards on submit surfaces.

---

## Data model (Prisma) — all pushed to Supabase

Models in `backend/prisma/schema.prisma`. New/changed this session:
- **News** — admin articles (title, excerpt, author, category, readTime, color, `body` JSON).
- **Conversation** — `clientId`/`talentId` now **nullable**; added `adminId` (+ `admin` relation). Client↔student threads use clientId+talentId; admin/support threads use `adminId` + the other user in `talentId`. Unique `[clientId, talentId]` kept; admin threads deduped in app code.
- **FeedLike** — `@@id([userId, feedPostId])`; powers per-user likes. `FeedPost.likes` is a denormalised counter kept in sync in a transaction.
- **Notification** — `{ userId, type, title, body?, link?, read }`. Created via `backend/src/lib/notify.js` `notify()` (fire-and-forget, never throws).
- **ClientProfile** — 1:1 with User (company, bio, website, logo).
- **Offer** — buyer's offer on a `MarketplaceListing` (amount, message, reply, status pending|accepted|rejected).
- **User** gained relations: `adminConversations`, `feedLikes`, `notifications`, `clientProfile`, `offersMade`.

> The DB is currently **in sync** with the schema (last `prisma db push` succeeded). If you add a model, push again and redeploy.

---

## Architecture notes

- **API↔frontend mappers** live near the bottom of `App.jsx` (before `App()`): `mapApiProfile`, `mapApiJob`, `mapApiFeedPost`, `mapApiListing`, `mapApiNews`, `mapApiProject`, `mapNotification`, `talentToApiBody`, `formatRelativeTime`. Pattern: fetch → map to legacy shape → render.
- **Reusable refreshers** in `App()`: `refreshJobs`, `refreshProjects`, `refreshFeed`, `refreshMarketplace`, `refreshNews`, `refreshNotifications` (each a `useCallback` + effect; notifications also refresh on window focus).
- **Notifications:** backend routes emit to the *counterparty* via `notify()`. Frontend `addNotification()` still exists for ephemeral, client-side optimistic toasts (not persisted).
- **Conversations:** `convInclude` + `isParticipant()` helpers in `routes/conversations.js`. `POST /conversations` handles client↔student, admin→anyone, and user→admin. `POST /conversations/support` opens/reuses a thread with the earliest-created admin. `socket.js` lets the admin participant send and join their own DM rooms; admins still auto-join all rooms read-only.
- **Modals:** the shared `Modal` component and the Project Detail panel render through a **React portal to `document.body`** (`createPortal`) so they layer above the `z-40` nav. Backdrop is `.modal-backdrop` in `index.css` (navy 0.55 + blur). Use the shared `Modal` for any new dialog and you get this for free.
- File uploads: client `POST /uploads/sign` → PUT directly to Supabase. Private bucket paths are swapped for signed read URLs when served (job applications). `uploadFile(file, kind)` in `api.js`; feed uses kind `'feed'`.

---

## Open tasks (priority order)

### 1. Rotate / remove `yomna@lawnndesign.com` (security)
This account was in the old hardcoded `MOCK_USERS` (now deleted) and its password is **in git history** — GitGuardian flagged it. If the account exists in the DB, delete it via **Admin → Users** (the delete-any-user feature) or rotate the password. The codebase no longer references it.

### 2. Email (transactional) — needs an external provider
Student invites currently return a link the admin shares by hand. Wire a provider (e.g. Resend/SendGrid/SMTP) for invite + message/notification emails. **Deferred: needs API keys.**

### 3. Paymob payments — needs a merchant account
Escrow is still a `walletBalance` integer increment. Plan: add a `Payment` model; Paymob client (auth → order → payment key); `POST /projects/:id/pay` returns a payment key for the hosted card iframe; `POST /payments/paymob/webhook` (HMAC-verified) runs the existing escrow transition (`offer_accepted→deposit_paid`, `delivered→completed`) which already use `prisma.$transaction`. Deposit is 50% (`Math.floor(budget*0.5)`). Payouts to students are a separate decision. **Deferred: needs keys; do this LAST.**

### 4. Backend seed cleanup (cosmetic)
`backend/seed.js` names the three test accounts "Yomna (Admin/Client/Student)". Rename to neutral if you want the persona gone everywhere (frontend mock data is already purged).

### 5. Optional: purge the leaked secret from git history
`git filter-repo` + force-push removes `youmie272` from history. Rotation (task 1) is the real fix; this is hygiene.

---

## Known minor issues / not-yet-built

- **Comments** on feed posts are not modelled (the fake comment box was removed). Add a `Comment` model if you want them.
- **Buyer-side offer status:** a client who makes a marketplace offer is notified on accept/reject/reply but can't browse their offer history in the UI (sellers see offers under "My Listings"). Notifications cover it for now.
- **Project cancel-with-refund:** `DELETE /projects/:id` blocks non-admin deletion past `open` status (409). A real cancel/refund flow (release talent, refund deposit) is unbuilt — Paymob-dependent.
- **Realtime to brand-new conversations:** the *other* party may only see a just-created thread on next load/focus (the creator emits `join_conversation`; the counterparty isn't auto-joined until reload). Minor.
- Feed "video" attach still just appends `[Video: filename]` text (only image upload is real).

---

## Critical gotchas

- **Don't use `sed -i` on `src/App.jsx`.** The cowork bash mount can serve stale reads; `sed` then overwrites fresh edits. Use the **Edit tool** exclusively for that file and verify via `Read`.
- **Sandbox `npm run build` is unreliable** (mount staleness → false "Unterminated string" errors). Verify via `Read`; real builds happen on Cloudflare/Render from GitHub.
- **Render free tier sleeps** — first request after 15 min hangs ~30s. The `useBusy` guards exist for this.
- **JWT** in localStorage as `lawnn_token`. Students are re-prompted with the profile builder whenever their profile is incomplete (driven by a completeness effect, not a one-time flag); clients keep a one-time `lawnn_onboarding_done_<userId>` flag.
- **New dialogs:** use the shared `Modal` component (it portals to body). Don't hand-roll `fixed inset-0` overlays inside page components or they'll tuck under the nav.
- **No mock/dummy data left in `src`.** Stats (home + about) are computed from live `talents`. Don't reintroduce hardcoded figures, fake users, or sample arrays.

---

## Suggested next session

1. **Rotate/remove the leaked `yomna@lawnndesign.com` credential** — fastest, highest-value (security).
2. **Email integration** once you have a provider key — unblocks real invite delivery.
3. **Paymob** last — biggest piece, needs merchant keys; the escrow state machine is already in place to drop webhooks into.

Smoke-test before building more: log in as each role; post a job → approve → apply → hire and watch the bell; like a feed post (with image); make + accept a marketplace offer; edit a client profile; create/delete a user in Admin → Users; open any modal and confirm it overlays the nav cleanly.

# Lawnn — Session Handoff (updated 2026-06-16)

## Project
- **Repo:** `C:\Users\DELL\Downloads\lawnndesign` (local; commits stay local)
- **Stack:** Vite + React 18 + Tailwind frontend, Express + Prisma + Postgres (Supabase) + Socket.io backend
- **Fonts:** Playfair Display (`font-display`), DM Sans (`font-body`), Noto Naskh Arabic
- **Colors:** navy `#21326c`, orange `#ff9044`, cream bg `#fffcf4`
- **Supabase:** project `LawnnDesign`, id `fojptzeakjieqcuwgpbl` (region eu-west-1). MCP connector was connected this session.
- **Test accounts (all named "Yomna"):** `student@lawnndesign.com`, `client@lawnndesign.com`, `admin@lawnndesign.com`. Passwords are bcrypt-hashed (unknown/unchanged).

---

## Biggest change this session: App.jsx was split up
`src/App.jsx` went from a 6,580-line monolith (52 components) to a ~363-line orchestrator. Everything else was extracted into modules:

- `src/lib/constants.js` — colors, SKILL_LIBRARY, status maps, INFO_PAGES copy
- `src/lib/mappers.js` — all `mapApi*`, `formatRelativeTime`, `talentToApiBody`
- `src/hooks/useBusy.js` — submit-guard hook
- `src/components/ui.jsx` — Avatar, Modal, badges, pickers, NotificationPanel, etc.
- `src/components/auth.jsx` — LoginModal, AcceptInviteModal
- `src/components/TopNav.jsx`
- `src/pages/*.jsx` — HomePage, JobBoardPage, DirectoryPage, ProfilePage, FeedPage, ChatPage, AboutPage, NewsPage, MarketplacePage, AdminPage, ProjectsPage, OnboardingFlow, ClientProfilePage, InfoPage

The split was done mechanically (a script that sliced by declaration and auto-generated imports), verified with esbuild + a static reference check + a full `vite build`. **This split was committed** (commit message "ok", hash `15979426…`).

---

## Error boundary + toasts (committed)
Two features were added after the initial split commit and are now committed too:

1. **Error boundary**
   - `src/components/ErrorBoundary.jsx` (new) — branded fallback, `resetKey` auto-recovers on navigation.
   - `src/main.jsx` — wraps `<App/>` (top-level net).
   - `src/App.jsx` — wraps `renderView()` with `<ErrorBoundary resetKey={view}>` so a page crash keeps nav/footer alive.

2. **Toast system (replaced all 38 `alert()` calls)**
   - `src/lib/toast.js` (new) — dependency-free pub/sub store; `toast()/.success/.error/.info`.
   - `src/components/Toaster.jsx` (new) — renders stack top-right, auto-dismiss, color-coded; rendered once in `App.jsx`.
   - 38 `alert()` → `toast.error` (36) / `toast.success` (1, "Hired!") / `toast.info` (1, video placeholder) across the 8 page files. The 4 `confirm()` dialogs were intentionally left as-is.

Both verified: `vite build` passes (1554 modules) and jsdom runtime tests confirmed behavior. **All of the above is committed — the working tree is clean.**

---

## Onboarding reset (done this session) + how it works
Mechanics differ by role:
- **Student:** onboarding shows whenever the profile is incomplete (no bio OR no skills). NOT localStorage-gated.
- **Client:** onboarding shows only when `lawnn_onboarding_done_<userId>` is ABSENT from browser localStorage. There is no DB column for this.

Done in Supabase this session:
- Student profile blanked: `bio=NULL`, all `profile_skills` deleted, `university/dept/year/avatar=NULL`, `hourlyRate=0`.
- Client profile blanked: `company/bio/website/logo=NULL`.

Still required for the CLIENT popup to reappear (browser, not DB):
```js
Object.keys(localStorage).filter(k => k.startsWith('lawnn_onboarding_done_')).forEach(k => localStorage.removeItem(k));
localStorage.removeItem('lawnn_token');
location.reload();
```
Sharing access to a teammate = just hand over the 3 email/password pairs; onboarding appears fresh on their device (student via blank profile, client via their empty localStorage). Admin has no onboarding flow.

---

## Environment quirks hit this session (read before building/git)
- **Sandbox mount can serve stale/truncated copies.** A file edited via the editor once showed up truncated to the build tool; rebuilding the file via shell fixed it. If a build error points at a line that looks fine, re-check the file from the shell side.
- **`npm run build` fails in-sandbox** only because it can't empty the pre-existing `dist/` (`EPERM`). Build to a fresh dir to verify: `npx vite build --outDir <tmp> --emptyOutDir`. On the user's Windows machine `npm run build` works normally.
- **Stale `.git/index.lock`** (0-byte, dated Jun 10) has caused phantom "deleted/untracked" git status before. If git looks weird, delete `.git\index.lock` then `git reset`.
- **Sandbox can't reach Supabase Postgres directly** (ports 6543/5432 blocked) and **can't reach the DB via Prisma** (client was generated for Windows). DB work must go through the Supabase MCP connector.
- File deletion in the workspace was enabled this session (was previously "Operation not permitted").

---

## Backlog / next steps (pre-payments improvements, by priority)
Reliability/UX (two done):
- [x] Top-level + per-page error boundary
- [x] Toasts replacing alert()
- [ ] API client: handle 401/expiry (auto-logout) in `src/lib/api.js`
- [ ] Accessibility pass (no ARIA anywhere; modal focus trap)
- [ ] Responsive QA (sparse `md:`/`lg:` breakpoints)

Backend/correctness:
- [ ] Migration baseline — only 1 migration exists vs ~30 models (schema drifted via `db push`). Fix before payments.
- [ ] Add tests (none exist) — Vitest + supertest.
- [ ] Input validation library (zod) — currently all ad-hoc.
- [ ] Pagination on list endpoints (jobs/feed/profiles/marketplace `findMany` are unbounded).
- [ ] Observability + env validation (only JWT_SECRET checked; bare console.error).
- [ ] Payments prep: raw-body webhook route (global `express.json` breaks signature verification); confirm money unit (EGP int — `walletBalance` comment is ambiguous).

Loose ends:
- [ ] Job→Project bridge TODO (`App.jsx`-era, now in `pages/`), projects.js endpoint TODO.
- [ ] Repo hygiene: stray `vite.config.js.timestamp-*.mjs` files in root; `dist/` is tracked.

---

## Notes
- Pre-split `App.jsx` is recoverable from git history (the commit before "ok"). The sandbox backup at `outputs/App.jsx.backup` does NOT persist across sessions.
- A prior handoff noted a "Fable only" model constraint; it was not enforced this session. Confirm with the user if relevant.

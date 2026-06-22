# Plan — Move JWT from localStorage to an httpOnly cookie

_Status: PROPOSAL (no code changed). Owner decision required before implementation._

## Why

Today the JWT is stored in `localStorage` and sent as `Authorization: Bearer <token>`. Any script that runs on the page can read it, so a single stored-XSS bug would let an attacker exfiltrate a live session token. We've closed the known XSS sinks and added a CSP, which makes that hard — but a script-readable token is still a standing primitive. Moving the token into an **httpOnly, Secure, SameSite cookie** removes the primitive entirely: JavaScript can't read the cookie, so XSS can no longer steal the session.

The tradeoff: cookies are sent automatically by the browser, which reintroduces **CSRF** risk. So this migration is "swap XSS-token-theft for CSRF," and CSRF must be mitigated as part of the same change. It also requires the API and frontend to share a cookie context across the Cloudflare ↔ Render origins.

## Current state (what touches the token)

- **Issue:** `signToken()` in `backend/src/routes/auth.js`; returned in the JSON body of `/auth/register`, `/auth/login`, `/auth/accept-invite`, `/auth/change-password`.
- **Verify:** `requireAuth` / `optionalAuth` in `backend/src/middleware/requireAuth.js` read `req.headers.authorization`.
- **Socket:** `socket.js` reads `socket.handshake.auth.token`.
- **Frontend:** `src/lib/api.js` stores the token in `localStorage` and sets the `Authorization` header; `src/App.jsx` hydrates from it; the socket client passes it in `auth.token`.
- **CORS:** `index.js` already sets `credentials: true` and a strict origin allowlist (a prerequisite for cookies — good).

## Cross-origin constraint (important)

The frontend (`lawnndesign.com` via Cloudflare) and the API (`lawnndesign.onrender.com`) are **different registrable domains**. A cookie set by the API on `onrender.com` is a third-party cookie to the frontend and needs `SameSite=None; Secure` to be sent on cross-site requests — increasingly restricted by browsers and blocked by tracking protections. **Strongly recommended:** put the API behind a same-site host first, e.g. `api.lawnndesign.com` (Cloudflare can proxy to Render). Then a `Domain=.lawnndesign.com` cookie with `SameSite=Lax` works cleanly and CSRF exposure drops. **This DNS/proxy step should be done before the cookie migration**, or the cookie approach will fight the browser.

## Proposed end state

1. On login/register/accept-invite/change-password, the API sets:
   `Set-Cookie: lawnn_session=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=<ttl>` (with `Domain=.lawnndesign.com` once the API is same-site). No token in the JSON body.
2. `requireAuth` reads the token from the cookie (falling back to the `Authorization` header during a transition window).
3. CSRF protection via the **double-submit token** pattern: issue a second, non-httpOnly `lawnn_csrf` cookie; the frontend echoes it in an `X-CSRF-Token` header on every mutating request; the API rejects state-changing requests whose header doesn't match the cookie. `SameSite=Lax` already blocks cross-site form posts, so the double-submit token mainly covers the residual cases.
4. A `POST /auth/logout` clears both cookies (today logout is purely client-side).
5. Sockets authenticate from the cookie sent on the WebSocket upgrade request instead of `handshake.auth.token`.

## Step-by-step

1. **DNS/proxy:** stand up `api.lawnndesign.com` → Render; update `VITE_API_URL` and `FRONTEND_URL`. Verify CORS still passes. _(no app logic yet)_
2. **Backend deps:** add `cookie-parser` (or read cookies manually); add a small CSRF check middleware.
3. **Issue cookies:** add a `setSessionCookies(res, user)` helper; call it in the four auth endpoints; keep returning `user` (no `token`) in the body. Add `POST /auth/logout`.
4. **Read cookies:** update `requireAuth`/`optionalAuth` to accept the cookie first, header second (transition).
5. **CSRF middleware:** apply to all non-GET routes; exempt `/auth/login`+`/auth/register` (pre-session) and `/health`.
6. **Sockets:** parse the cookie from `socket.handshake.headers.cookie`; keep the `auth.token` path during transition.
7. **Frontend:** stop storing the token; rely on the cookie (set `fetch`/axios `credentials: 'include'`); read `lawnn_csrf` and send `X-CSRF-Token` on writes; switch the socket client to `withCredentials: true`; call `/auth/logout` on sign-out; hydrate session via `GET /auth/me`.
8. **Cut over:** once the frontend ships, remove the `Authorization`-header fallback and the `auth.token` socket fallback.

## Risks & rollback

- **Cookie not sent (origin/SameSite misconfig):** the #1 failure mode — symptom is "logged out on every request." Mitigated by doing the DNS step first and testing in an incognito window with third-party cookies blocked.
- **CSRF gaps:** every mutating route must be covered; a forgotten route is a hole. The new test suite should assert the CSRF middleware rejects a missing/mismatched token.
- **Socket auth on upgrade:** cookies must be present on the WS handshake; verify with the deployed origins, not localhost.
- **Transition window:** keeping header+cookie both valid avoids a hard cutover; remove the fallback only after the frontend is confirmed working.
- **Rollback:** revert the frontend to the header flow; the backend transition-window code still accepts it.

## Effort

Roughly a focused day of work plus careful cross-origin testing — most of the risk is in deployment/cookie config, not the code. Recommend doing it in a branch with the test suite extended to cover cookie issuance + CSRF rejection before merging.

## Interim mitigations already in place (so this isn't urgent)

Closed XSS sinks, a strict CSP that blocks token exfiltration to foreign origins, per-request live-account checks (instant ban/suspend/role-change), and a shortened 24h token lifetime.

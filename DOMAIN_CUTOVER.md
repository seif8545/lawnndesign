# Lawnn — Domain Cutover Runbook: → `lawnndesign.com`

_Ordered, dashboard-by-dashboard. Do the steps top to bottom — later steps depend on earlier ones._

The move is **config only** — verified that no code hardcodes the old `lawnn.pages.dev`
domain. The frontend reads its API location from `VITE_API_URL`, and the CSP in
`public/_headers` already allows the API host, Supabase, and Turnstile. So this is
dashboards + DNS + environment variables, plus one **deploy** to ship the new
sign-up CAPTCHA.

Two hosts are involved:

- **Frontend** → Cloudflare Pages → will serve on **`lawnndesign.com`**
- **Backend API** → Render → stays on **`lawnndesign.onrender.com`**

---

## Step 0 — Deploy the latest code first

The anti-spam change (Turnstile on sign-up) is now in `backend/src/routes/auth.js`
and `src/components/auth.jsx`. Nothing below matters until it's live.

- [ ] Review the two-file diff (`git diff` from the project folder — reads the real
      files, not the bridge).
- [ ] Commit & push both repos so Cloudflare Pages (frontend) and Render (backend) rebuild.
- [ ] In `backend/`, run `npm test` (should pass) and `npm run build` on the frontend to
      confirm a clean build **before** pushing.

---

## Step 1 — Cloudflare Pages (frontend)

- [ ] Pages project → **Custom domains → Add `lawnndesign.com`** (add `www.lawnndesign.com`
      too if you want the www variant). `public/CNAME` already contains `lawnndesign.com`.
- [ ] Add the DNS records Cloudflare shows you (a CNAME/ALIAS pointing at the project's
      `*.pages.dev` target). If DNS for `lawnndesign.com` is on Cloudflare already, it can
      add these for you; otherwise add them at whoever hosts the domain's DNS.
- [ ] Confirm the Pages project is connected to the **frontend GitHub repo**
      (Settings → Builds & deployments). If the repo moved to a new org, reconnect it here.
- [ ] Wait for the custom domain to show **Active** (TLS cert issued) before smoke-testing.

**Frontend environment variable (Pages → Settings → Environment variables → Production):**

- [ ] `VITE_API_URL` = `https://lawnndesign.onrender.com`
      _(must point at the backend, NOT the site's own origin)_
- [ ] Re-deploy the Pages project after setting it (Vite bakes env vars in at build time —
      a new value only takes effect on the next build).

---

## Step 2 — Render (backend API)

- [ ] Confirm the Render service is connected to the **backend GitHub repo**. If it moved, reconnect.
- [ ] The API host stays `lawnndesign.onrender.com`. (Optionally add an `api.lawnndesign.com`
      custom domain later — not required for launch.)

**Render environment variables (Dashboard → your service → Environment):**

- [ ] `FRONTEND_URL` = `https://lawnndesign.com`
      _During cutover you can allow both origins with a comma:_
      `https://lawnndesign.com,https://lawnn.pages.dev` — then drop the old one once
      you've confirmed the new domain works.
      ⚠️ This is used twice: the **CORS allow-list** (REST + websocket) **and** the host
      used to build invite links. If it's wrong, the app can't call the API and invite
      links break.
- [ ] `JWT_EXPIRES_IN` = `24h`
- [ ] Verify already-present secrets are still set: `JWT_SECRET`, `DATABASE_URL`,
      `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Render redeploys on env-var change — let it finish before testing.

---

## Step 3 — Turnstile (this is what makes the anti-spam work)

Sign-up now requires a Turnstile CAPTCHA. The frontend site key is already in the
code; two things must be set for it to work on the live domain:

- [ ] **Cloudflare Turnstile dashboard → your widget → Settings → allowed domains:**
      add `lawnndesign.com` (and `www.lawnndesign.com` if used, plus any Pages preview
      domain you test on). Without this, the widget won't solve on the live site.
- [ ] **Render → Environment:** set `TURNSTILE_SECRET` to the widget's secret key.

**Order matters:** add `lawnndesign.com` to the allowed domains **before** (or at the same
time as) setting `TURNSTILE_SECRET`. If the secret is set but the domain isn't allowed,
the widget can't produce a token and sign-ups would be blocked.

Good to know about how it's wired:
- If `TURNSTILE_SECRET` is **unset**, the backend skips the check (local dev still works),
  but the widget still shows client-side.
- If a user clicks "Create Account" before the CAPTCHA finishes solving, they get one
  recoverable "please confirm you're human" prompt and a fresh challenge — the form is
  never hard-locked.
- Login already required a CAPTCHA after repeated failed attempts; that's unchanged.

---

## Step 4 — Content-Security-Policy (verify only, usually no change)

`public/_headers` already allows `lawnndesign.onrender.com`, `wss://…onrender.com`,
`*.supabase.co`, and `challenges.cloudflare.com` (Turnstile). No change is needed
**unless you move the API to a different host** — then update `connect-src` there.

- [ ] Confirm `_headers` shipped with the frontend build (it's in `public/`, copied to `dist/`).

---

## Step 5 — Smoke test on the live domain

Do these on `https://lawnndesign.com` once DNS + TLS are active:

- [ ] Home page loads over HTTPS with a valid certificate.
- [ ] Register a new **client** account — the Turnstile widget appears and the account is created.
- [ ] Log in with that account.
- [ ] Open a chat / conversation (confirms the websocket connects — this is the CORS/`FRONTEND_URL` check).
- [ ] Post a project (confirms writes work; it should land as `pending` for admin approval).
- [ ] Open the browser console — no CORS or CSP errors.

If chat/API calls fail with a CORS error, the usual cause is `FRONTEND_URL` on Render not
matching the domain you're visiting.

---

## Rollback / safety

- The old `lawnn.pages.dev` URL keeps working throughout — nothing deletes it. Keeping both
  in `FRONTEND_URL` during cutover means you can fall back instantly if the new domain misbehaves.
- Env-var changes are reversible in seconds from each dashboard; no data is touched.

---

## Related but separate (not in this pass)

_"Prevent spam" has a second meaning — your outbound **acceptance emails** landing in
recipients' spam folders. Because you'll send from the new domain via Brevo, Gmail/Yahoo
will flag them unless `lawnndesign.com` has **DKIM + DMARC** DNS records. That's a separate
DNS task (Brevo → Domains → authenticate `lawnndesign.com`). Say the word and I'll produce
the exact records to add._

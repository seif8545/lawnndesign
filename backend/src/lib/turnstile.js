// ── Cloudflare Turnstile (CAPTCHA) verification ──────────────────────────────
// Verifies a Turnstile token server-side. Active only when TURNSTILE_SECRET is
// set (so local/dev without the secret just skips it). Used by the login route
// to require a CAPTCHA after a few failed attempts on an account.

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export function turnstileEnabled() {
  return Boolean(process.env.TURNSTILE_SECRET)
}

// Returns true if the token is valid (or if Turnstile isn't configured, so the
// app still works without the secret). Returns false on a missing/invalid token
// or any verification error.
export async function verifyTurnstile(token, remoteip) {
  if (!turnstileEnabled()) return true
  if (!token || typeof token !== 'string') return false
  try {
    const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET, response: token })
    if (remoteip) body.append('remoteip', remoteip)
    const resp = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const data = await resp.json()
    return data?.success === true
  } catch {
    return false
  }
}

// After this many failed logins on an account, a CAPTCHA is required for further
// attempts (kept below the throttle threshold so it engages first).
export const CAPTCHA_AFTER_FAILURES = 3

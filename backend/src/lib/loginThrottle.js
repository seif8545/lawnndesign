// ── Smart login throttle ─────────────────────────────────────────────────────
// After a threshold of CONSECUTIVE failed logins on an account, impose an
// escalating cooldown that auto-clears the moment a correct password is entered.
// Deliberately NOT a permanent lockout: a temporary, self-healing delay slows a
// brute-force attacker to a crawl without giving anyone a way to lock a real
// user out of their account indefinitely (the classic lockout DoS).

export const LOGIN_FAIL_THRESHOLD = 5

// Escalating cooldowns once the threshold is crossed: 30s → 1m → 2m → 5m → 15m
// (capped). Returns the cooldown in ms for a given consecutive-failure count,
// or 0 if still under the threshold.
const STEPS_MS = [30_000, 60_000, 120_000, 300_000, 900_000]

export function cooldownMs(failedAttempts) {
  if (!Number.isFinite(failedAttempts) || failedAttempts < LOGIN_FAIL_THRESHOLD) return 0
  const idx = Math.min(failedAttempts - LOGIN_FAIL_THRESHOLD, STEPS_MS.length - 1)
  return STEPS_MS[idx]
}

// Friendly "try again in …" string for a remaining-millisecond amount.
export function waitMessage(msRemaining) {
  const secs = Math.max(1, Math.ceil(msRemaining / 1000))
  if (secs >= 60) {
    const mins = Math.ceil(secs / 60)
    return `Too many attempts. Try again in about ${mins} minute${mins === 1 ? '' : 's'}.`
  }
  return `Too many attempts. Try again in about ${secs} seconds.`
}

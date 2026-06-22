// URL / file-path sanitisation.
//
// Several models store URLs or storage paths that are later rendered by the
// frontend as <a href>, <img src>, or CSS background-image. If an attacker can
// persist a value like `javascript:...` or `data:text/html,...`, clicking the
// resulting link executes script in the victim's session (stored XSS → JWT in
// localStorage is then exfiltratable). We therefore validate every such value
// on write.
//
// Allowed:
//   - Absolute http(s) URLs (Supabase public CDN URLs, signed read URLs).
//   - Scheme-less storage paths, e.g. "application/<userId>/<uuid>.pdf".
// Rejected (returns null):
//   - Any other scheme: javascript:, data:, vbscript:, file:, blob:, etc.
//   - Protocol-relative URLs ("//evil.com").
//   - Anything starting with "/" or containing a colon outside http(s)://.
export function safeUrl(value) {
  if (value == null) return null
  const v = String(value).trim()
  if (!v) return null
  if (v.startsWith('//')) return null
  // Reject path-traversal segments anywhere — legit public URLs and storage
  // paths (folder/userId/uuid.ext) never contain "..".
  if (v.includes('..')) return null
  if (/^https?:\/\//i.test(v)) return v
  // Scheme-less storage path: must start with an alphanumeric/underscore and
  // contain only [A-Za-z0-9 _ - / .] — no colon, so no executable scheme.
  if (/^[a-zA-Z0-9_][a-zA-Z0-9_\-/.]*$/.test(v)) return v
  return null
}

// Normalise an email for storage and lookup: trim + lowercase. Keeps a single
// canonical form so `A@x.com` and `a@x.com` can't become two accounts and login
// isn't case-sensitive. Returns '' for nullish input.
export function normalizeEmail(value) {
  return value == null ? '' : String(value).trim().toLowerCase()
}

// Trim a free-text field and hard-cap its length before it's stored. The global
// express.json({ limit: '1mb' }) bounds a single request, but without per-field
// caps a user could still persist many near-1MB rows (storage abuse) or oversized
// strings that bloat every list response. Returns a string (never null).
export function clampText(value, max = 5000) {
  if (value == null) return ''
  return String(value).trim().slice(0, max)
}

// Coerce a body value into a non-negative integer, or null if it isn't a valid
// number. Guards against negative budgets/prices (which flow into wallet
// increments) and NaN (which crashes Prisma Int columns with a 500).
export function nonNegativeInt(value) {
  if (value === undefined || value === null || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.floor(n)
}

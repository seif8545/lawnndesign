// Persistent client storage that can't throw, with a fallback chain.
//
// Browsers block storage in a range of configurations — Brave with Shields on
// aggressive or "block all cookies", Chrome's block-all-cookies, Safari ITP,
// private windows, embedded webviews, enterprise policy. In the worst of these
// even *reading* the `window.localStorage` property raises a SecurityError
// ("Access is denied for this document"), so an unguarded `localStorage.getItem`
// throws before it can return null.
//
// That took down the invite flow entirely: `api.js` reads the JWT on every
// request, so the throw landed before `fetch` and the raw browser exception was
// shown to the student as the form's error message.
//
// We try four backends in order and keep the first one that survives a real
// write/read/remove round-trip. A round-trip probe matters because some browsers
// silently accept a write and then hand back nothing, which a plain try/catch
// would read as success:
//
//   1. localStorage    — normal case; survives reload, tab close, restart
//   2. sessionStorage  — survives reload; lost on tab close
//   3. document.cookie — survives reload and restart; works in some browsers
//                        that block localStorage but still permit cookies
//   4. memory          — last resort; lost on reload
//
// A browser blocking *both* localStorage and cookies cannot persist anything at
// all, by the user's own choice — tier 4 keeps the session usable for that page
// view, and `isPersistent()` lets the UI say so plainly instead of appearing to
// log the user out at random.

const memory = new Map();

// Cookies are capped at 400 days by Chrome; the JWT carries its own, shorter
// expiry, so a long cookie lifetime doesn't widen the security window.
const COOKIE_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

// ── Backend implementations ──────────────────────────────────────────────────

function webStorage(kind) {
  return {
    name: kind,
    get(key) {
      const v = window[kind].getItem(key);
      return v === undefined ? null : v;
    },
    set(key, value) { window[kind].setItem(key, value); },
    remove(key) { window[kind].removeItem(key); },
  };
}

const cookieStorage = {
  name: 'cookie',
  get(key) {
    const target = encodeURIComponent(key);
    for (const part of document.cookie.split(';')) {
      const idx = part.indexOf('=');
      if (idx === -1) continue;
      if (part.slice(0, idx).trim() === target) {
        return decodeURIComponent(part.slice(idx + 1).trim());
      }
    }
    return null;
  },
  set(key, value) {
    const secure = window.location?.protocol === 'https:' ? '; Secure' : '';
    document.cookie =
      `${encodeURIComponent(key)}=${encodeURIComponent(value)}` +
      `; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  },
  remove(key) {
    const secure = window.location?.protocol === 'https:' ? '; Secure' : '';
    document.cookie =
      `${encodeURIComponent(key)}=; path=/; max-age=0; SameSite=Lax${secure}`;
  },
};

const memoryStorage = {
  name: 'memory',
  get(key) { return memory.has(key) ? memory.get(key) : null; },
  set(key, value) { memory.set(key, String(value)); },
  remove(key) { memory.delete(key); },
};

// ── Backend selection ────────────────────────────────────────────────────────

// Verify a backend actually round-trips, not just that it doesn't throw.
function works(backend) {
  const probe = '__lawnn_probe__';
  const token = String(Date.now());
  try {
    backend.set(probe, token);
    const back = backend.get(probe);
    backend.remove(probe);
    return back === token;
  } catch {
    return false;
  }
}

let active;
function backend() {
  if (active) return active;

  const candidates = [];
  // Accessing window.localStorage can itself throw, so each candidate is built
  // inside its own guard rather than eagerly in an array literal.
  for (const kind of ['localStorage', 'sessionStorage']) {
    try {
      if (window[kind]) candidates.push(webStorage(kind));
    } catch {
      // Property access denied — skip this tier.
    }
  }
  try {
    if (typeof document !== 'undefined' && 'cookie' in document) {
      candidates.push(cookieStorage);
    }
  } catch {
    // Skip.
  }

  active = candidates.find(works) || memoryStorage;

  if (active.name !== 'localStorage') {
    console.warn(
      `[storage] localStorage unavailable — using "${active.name}" for this session`,
    );
  }
  return active;
}

// ── Public API ───────────────────────────────────────────────────────────────
// Every value is mirrored into `memory` so a backend that fails or gets revoked
// mid-session degrades to an in-memory read instead of losing the session.

export function getItem(key) {
  try {
    const v = backend().get(key);
    if (v !== null && v !== undefined) return v;
  } catch {
    active = memoryStorage;
  }
  return memoryStorage.get(key);
}

export function setItem(key, value) {
  memoryStorage.set(key, value);
  try {
    backend().set(key, String(value));
  } catch {
    // Quota exceeded, or storage revoked mid-session — memory copy stands in.
    active = memoryStorage;
  }
}

export function removeItem(key) {
  memoryStorage.remove(key);
  try {
    backend().remove(key);
  } catch {
    active = memoryStorage;
  }
}

// False only when nothing persists across a reload, i.e. we're on the memory
// tier. Callers use this to tell the user why they'll have to sign in again.
export function isPersistent() {
  return backend().name !== 'memory';
}

// Which tier is in use — for diagnostics and support conversations.
export function storageKind() {
  return backend().name;
}

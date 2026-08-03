// localStorage that can't throw.
//
// Browsers block storage entirely in some configurations — Brave with Shields on
// aggressive, Chrome's "block all cookies", Safari private mode, embedded
// webviews. In those cases even *reading* the `window.localStorage` property
// raises a SecurityError ("Access is denied for this document"), so an
// unguarded `localStorage.getItem` throws before it can return null.
//
// That took down the whole invite flow: `api.js` reads the JWT on every request,
// so the throw happened before `fetch` and the raw browser exception surfaced to
// the user as the form's error message.
//
// Falling back to an in-memory map keeps the session working; it just doesn't
// survive a page reload, which is a far better failure mode than not being able
// to sign in at all.

const memory = new Map();

let available;
function usable() {
  if (available === undefined) {
    try {
      const probe = '__lawnn_storage_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      available = true;
    } catch {
      available = false;
      console.warn('[storage] localStorage is blocked — falling back to memory for this session');
    }
  }
  return available;
}

export function getItem(key) {
  if (usable()) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      available = false;
    }
  }
  return memory.has(key) ? memory.get(key) : null;
}

export function setItem(key, value) {
  memory.set(key, String(value));
  if (usable()) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Quota exceeded or storage revoked mid-session — the memory copy stands in.
      available = false;
    }
  }
}

export function removeItem(key) {
  memory.delete(key);
  if (usable()) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      available = false;
    }
  }
}

// True when values will survive a page reload. Lets callers warn the user.
export function isPersistent() {
  return usable();
}

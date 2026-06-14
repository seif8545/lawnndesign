import { useState, useRef, useCallback } from 'react';

export function useBusy() {
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const run = useCallback(async fn => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try { return await fn(); }
    finally { lock.current = false; setBusy(false); }
  }, []);
  return [busy, run];
}

// ─── SHARED COLOR PALETTE ───────────────────────────────────────────────────────

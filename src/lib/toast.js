// Minimal dependency-free toast store. Components subscribe via `subscribe`;
// anywhere in the app can fire a toast via `toast()` / `.success` / `.error`
// / `.info` — no context or prop-drilling required.

let toasts = [];
const listeners = new Set();
let seq = 0;

function emit() {
  for (const listener of listeners) listener(toasts);
}

export function subscribe(listener) {
  listeners.add(listener);
  listener(toasts);
  return () => listeners.delete(listener);
}

export function dismissToast(id) {
  toasts = toasts.filter(t => t.id !== id);
  emit();
}

function push(message, type) {
  if (message === null || message === undefined || message === '') return null;
  const id = ++seq;
  toasts = [...toasts, { id, message: String(message), type }];
  emit();
  return id;
}

export function toast(message, type = 'info') { return push(message, type); }
toast.success = message => push(message, 'success');
toast.error   = message => push(message, 'error');
toast.info    = message => push(message, 'info');

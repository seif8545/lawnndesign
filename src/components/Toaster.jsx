import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { subscribe, dismissToast } from '../lib/toast.js';

const STYLES = {
  success: { accent: '#3c8762', Icon: CheckCircle },
  error:   { accent: '#c4622d', Icon: AlertTriangle },
  info:    { accent: '#21326c', Icon: Info },
};

function ToastItem({ t }) {
  // Errors linger a little longer so they're not missed.
  useEffect(() => {
    const ms = t.type === 'error' ? 6000 : 4000;
    const timer = setTimeout(() => dismissToast(t.id), ms);
    return () => clearTimeout(timer);
  }, [t.id, t.type]);

  const { accent, Icon } = STYLES[t.type] || STYLES.info;
  return (
    <div
      className="animate-fade-in flex items-start gap-3 w-80 max-w-[calc(100vw-2rem)] rounded-lg bg-white px-4 py-3 shadow-lg"
      style={{ borderLeft: `4px solid ${accent}` }}
      role="status"
    >
      <span className="mt-0.5 shrink-0" style={{ color: accent }}><Icon size={18} /></span>
      <p className="font-body text-sm flex-1 leading-snug" style={{ color: '#21326c' }}>{t.message}</p>
      <button
        onClick={() => dismissToast(t.id)}
        aria-label="Dismiss"
        className="shrink-0 transition-opacity hover:opacity-60"
        style={{ color: '#21326c80' }}
      >
        <X size={15} />
      </button>
    </div>
  );
}

export function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => subscribe(setItems), []);
  if (items.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {items.map(t => <ToastItem key={t.id} t={t} />)}
    </div>
  );
}

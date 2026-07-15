import { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { auth as authApi, setToken } from '../lib/api.js';
import { Modal } from './ui.jsx';

// Public Cloudflare Turnstile site key (safe to ship in client code).
const TURNSTILE_SITE_KEY = '0x4AAAAAAD2jsDT2LzTpfO3M';

// Renders a Cloudflare Turnstile CAPTCHA and reports the solved token via
// onToken. Loads the Turnstile script on demand. Re-mount (via a changing key)
// to get a fresh challenge after a failed attempt — tokens are single-use.
function TurnstileWidget({ onToken }) {
  const ref = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const renderWidget = () => {
      if (cancelled || !ref.current || !window.turnstile || widgetId.current !== null) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: token => onToken(token),
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      });
    };
    if (window.turnstile) {
      renderWidget();
    } else {
      let s = document.querySelector('script[data-turnstile]');
      if (!s) {
        s = document.createElement('script');
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        s.async = true; s.defer = true; s.setAttribute('data-turnstile', '1');
        document.head.appendChild(s);
      }
      s.addEventListener('load', renderWidget);
    }
    return () => {
      cancelled = true;
      if (widgetId.current !== null && window.turnstile) {
        try { window.turnstile.remove(widgetId.current); } catch { /* noop */ }
        widgetId.current = null;
      }
    };
  }, [onToken]);

  return <div ref={ref} className="mt-1" />;
}

// ─── PASSWORD REQUIREMENTS ───────────────────────────────────────────────────
// Single source of truth for the password policy, mirroring the backend
// (validatePassword in sanitize.js): 8–72 chars + lower + upper + number +
// special. Used for the live checklist and the client-side gate on every form
// that sets a password.
const PASSWORD_RULES = [
  { id: 'len',   label: '8–72 characters',          test: p => p.length >= 8 && p.length <= 72 },
  { id: 'lower', label: 'A lowercase letter (a–z)',  test: p => /[a-z]/.test(p) },
  { id: 'upper', label: 'An uppercase letter (A–Z)', test: p => /[A-Z]/.test(p) },
  { id: 'num',   label: 'A number (0–9)',            test: p => /[0-9]/.test(p) },
  { id: 'spec',  label: 'A special character (!@#…)', test: p => /[^A-Za-z0-9]/.test(p) },
];

export function passwordValid(p) {
  return typeof p === 'string' && PASSWORD_RULES.every(r => r.test(p));
}

// Live checklist: each rule starts red with an ✕ and flips to green with a ✓ as
// the typed password satisfies it.
export function PasswordRequirements({ password }) {
  return (
    <ul className="space-y-1.5 mt-1">
      {PASSWORD_RULES.map(rule => {
        const ok = rule.test(password || '');
        return (
          <li key={rule.id} className="flex items-center gap-2 text-xs transition-colors">
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
              style={ok ? { background: '#dcfce7', color: '#16a34a' } : { background: '#fee2e2', color: '#dc2626' }}
            >
              {ok ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}
            </span>
            <span className={ok ? 'text-green-700' : 'text-[#21326c]/55'}>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function LoginModal({ open, onClose, onLogin }) {
  const [mode, setMode]         = useState('login'); // 'login' | 'register'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [role, setRole]         = useState('student');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken]       = useState('');
  const [captchaKey, setCaptchaKey]           = useState(0); // bump to remount → fresh challenge

  const reset = () => {
    setEmail(''); setPassword(''); setName(''); setError(''); setLoading(false);
    setCaptchaRequired(false); setCaptchaToken('');
  };

  const switchMode = m => { setMode(m); setError(''); };

  const handleLogin = async () => {
    setError(''); setLoading(true);
    try {
      const { token, user } = await authApi.login(email, password, captchaToken || undefined);
      setToken(token);
      onLogin(user);
      onClose();
      reset();
    } catch (e) {
      setError(e.message);
      if (e.data?.captchaRequired) {
        // Show (or refresh) the CAPTCHA — the just-used token is now spent.
        setCaptchaRequired(true);
        setCaptchaToken('');
        setCaptchaKey(k => k + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!passwordValid(password)) { setError('Please choose a password that meets all the requirements.'); return; }
    setError(''); setLoading(true);
    try {
      const { token, user } = await authApi.register({ email, password, name, role: 'client', turnstileToken: captchaToken || undefined });
      setToken(token);
      onLogin(user);
      onClose();
      reset();
    } catch (e) {
      setError(e.message);
      // The just-used Turnstile token is single-use — remount for a fresh one.
      setCaptchaToken('');
      setCaptchaKey(k => k + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister());

  return (
    <Modal open={open} onClose={onClose} title={mode === 'login' ? 'Sign In to Lawnn' : 'Create a Client Account'}>
      <div className="space-y-4">

        {/* Tab toggle */}
        <div className="flex rounded-xl overflow-hidden border border-[#21326c]/15">
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => switchMode(m)}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${mode === m ? 'text-white' : 'text-[#21326c]/60 hover:text-[#21326c]'}`}
              style={mode === m ? { background: '#21326c' } : {}}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Register-only: client name + info note */}
        {mode === 'register' && (
          <>
            <div className="rounded-xl p-3 text-xs text-[#21326c] leading-relaxed border border-[#21326c]/20" style={{ background: '#21326c08' }}>
              <strong>Are you a student?</strong> Lawnn accounts for students are created by our team after your application is reviewed. Check your email for your sign-in credentials and use the <strong>Sign In</strong> tab.
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Full Name</label>
              <input type="text" placeholder="e.g. Ahmed Hassan" value={name}
                onChange={e => { setName(e.target.value); setError(''); }} onKeyDown={handleKey}
                className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
            </div>
          </>
        )}

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Email</label>
          <input type="email" placeholder="your@email.com" value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }} onKeyDown={handleKey}
            className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Password</label>
          <input type="password" placeholder={mode === 'register' ? 'Create a password' : 'Enter your password'} value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }} onKeyDown={handleKey}
            className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
          {mode === 'register' && <PasswordRequirements password={password} />}
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 leading-relaxed">{error}</p>
        )}

        {/* CAPTCHA — appears only after repeated failed logins. */}
        {mode === 'login' && captchaRequired && (
          <div>
            <p className="text-xs text-[#21326c]/60 mb-1.5">Please confirm you’re human to continue:</p>
            <TurnstileWidget key={captchaKey} onToken={setCaptchaToken} />
          </div>
        )}

        {/* CAPTCHA on sign-up — blocks bulk automated fake client accounts. */}
        {mode === 'register' && (
          <div>
            <p className="text-xs text-[#21326c]/60 mb-1.5">Please confirm you’re human:</p>
            <TurnstileWidget key={captchaKey} onToken={setCaptchaToken} />
          </div>
        )}

        <button
          onClick={mode === 'login' ? handleLogin : handleRegister}
          disabled={!email || !password || (mode === 'register' && !name) || loading || (mode === 'login' && captchaRequired && !captchaToken)}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: '#ff9044' }}
        >
          {loading ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : (mode === 'login' ? 'Sign In' : 'Create Account')}
        </button>

        <p className="text-center text-xs text-[#21326c]/50">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <span onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            className="font-medium text-[#21326c] cursor-pointer underline underline-offset-2">
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </span>
        </p>
      </div>
    </Modal>
  );
}

// ─── ACCEPT-INVITE MODAL ─────────────────────────────────────────────────────
// Shown when the URL contains `?token=...` from an admin-issued invite link.

export function AcceptInviteModal({ token, onAccept, onClose }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  const handleSubmit = async () => {
    if (!passwordValid(password)) { setError('Please choose a password that meets all the requirements.'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setError(''); setLoading(true);
    try {
      const { token: jwt, user } = await authApi.acceptInvite(token, password);
      setToken(jwt);
      setDone(true);
      onAccept(user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Set Your Password">
      <div className="space-y-4">
        {done ? (
          <div className="rounded-xl p-4 text-sm text-[#21326c] border border-green-200" style={{ background: '#dcfce7' }}>
            You're all set — welcome to Lawnn!
          </div>
        ) : (
          <>
            <p className="text-sm text-[#21326c]/70 leading-relaxed">
              Your Lawnn account is ready. Choose a password to finish setting up your profile.
            </p>
            <div>
              <label className="block text-sm font-semibold text-[#21326c] mb-1.5">New Password</label>
              <input type="password" placeholder="Choose a password" value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
              <PasswordRequirements password={password} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Confirm Password</label>
              <input type="password" placeholder="Re-enter your password" value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
            </div>
            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 leading-relaxed">{error}</p>
            )}
            <button
              onClick={handleSubmit}
              disabled={!password || !confirm || loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#ff9044' }}
            >
              {loading ? 'Setting password…' : 'Set Password & Sign In'}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

// ─── FIRST-LOGIN SETUP ───────────────────────────────────────────────────────
// Forced on students added by email: set a real name and a new password before
// entering the app. Not dismissable.

export function FirstLoginSetup({ user, onDone }) {
  const [name, setName]         = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const submit = async () => {
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!passwordValid(password)) { setError('Please choose a password that meets all the requirements.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setError(''); setLoading(true);
    try {
      const { user: updated, token } = await authApi.changePassword({ name: name.trim(), newPassword: password });
      if (token) setToken(token); // keep this session valid after the tokenVersion bump
      onDone(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={true} onClose={() => {}} title="Welcome to Lawnn — finish setting up">
      <div className="space-y-4">
        <p className="text-sm text-[#21326c]/70 leading-relaxed">
          Your account was created by the Lawnn team. Set your name and a new password to continue.
        </p>
        <div>
          <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Your Full Name</label>
          <input type="text" placeholder="e.g. Ahmed Hassan" value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#21326c] mb-1.5">New Password</label>
          <input type="password" placeholder="Choose a password" value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
          <PasswordRequirements password={password} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Confirm Password</label>
          <input type="password" placeholder="Re-enter your password" value={confirm}
            onChange={e => { setConfirm(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
        </div>
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 leading-relaxed">{error}</p>
        )}
        <button
          onClick={submit}
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: '#ff9044' }}
        >
          {loading ? 'Saving…' : 'Save & Continue'}
        </button>
      </div>
    </Modal>
  );
}

// ─── CHANGE PASSWORD (logged-in users) ───────────────────────────────────────
// Lets a signed-in user change their password. Requires the current password
// (the backend enforces this for established accounts) and shows the live
// requirement checklist for the new one.

export function ChangePasswordModal({ open, onClose, onChanged }) {
  const [currentPassword, setCurrent] = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [done, setDone]               = useState(false);

  const reset = () => { setCurrent(''); setPassword(''); setConfirm(''); setError(''); setLoading(false); setDone(false); };
  const close = () => { reset(); onClose(); };

  const submit = async () => {
    if (!currentPassword)            { setError('Enter your current password.'); return; }
    if (!passwordValid(password))    { setError('Your new password doesn’t meet the requirements below.'); return; }
    if (password !== confirm)        { setError('The new passwords don’t match.'); return; }
    if (password === currentPassword){ setError('Your new password must be different from your current one.'); return; }
    setError(''); setLoading(true);
    try {
      const { user, token } = await authApi.changePassword({ currentPassword, newPassword: password });
      if (token) setToken(token); // keep this session valid after the tokenVersion bump
      setDone(true);
      onChanged?.(user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40';

  return (
    <Modal open={open} onClose={close} title="Change Password">
      <div className="space-y-4">
        {done ? (
          <>
            <div className="rounded-xl p-4 text-sm text-[#21326c] border border-green-200 flex items-center gap-2" style={{ background: '#dcfce7' }}>
              <Check size={16} className="text-green-600 flex-shrink-0" />
              Your password has been changed.
            </div>
            <button
              onClick={close}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
              style={{ background: '#21326c' }}
            >
              Done
            </button>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Current Password</label>
              <input type="password" autoComplete="current-password" placeholder="Enter your current password" value={currentPassword}
                onChange={e => { setCurrent(e.target.value); setError(''); }}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#21326c] mb-1.5">New Password</label>
              <input type="password" autoComplete="new-password" placeholder="Choose a new password" value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                className={inputCls} />
              <PasswordRequirements password={password} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Confirm New Password</label>
              <input type="password" autoComplete="new-password" placeholder="Re-enter your new password" value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && submit()}
                className={inputCls} />
              {confirm && confirm !== password && (
                <p className="text-xs text-red-600 mt-1.5">Passwords don’t match yet.</p>
              )}
            </div>
            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 leading-relaxed">{error}</p>
            )}
            <button
              onClick={submit}
              disabled={loading || !currentPassword || !passwordValid(password) || password !== confirm}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#ff9044' }}
            >
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

// ─── NAVIGATION / HEADER ──────────────────────────────────────────────────────

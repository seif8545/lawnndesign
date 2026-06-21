import { useState } from 'react';
import { auth as authApi, setToken } from '../lib/api.js';
import { Modal } from './ui.jsx';

export function LoginModal({ open, onClose, onLogin }) {
  const [mode, setMode]         = useState('login'); // 'login' | 'register'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [role, setRole]         = useState('student');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const reset = () => { setEmail(''); setPassword(''); setName(''); setError(''); setLoading(false); };

  const switchMode = m => { setMode(m); setError(''); };

  const handleLogin = async () => {
    setError(''); setLoading(true);
    try {
      const { token, user } = await authApi.login(email, password);
      setToken(token);
      onLogin(user);
      onClose();
      reset();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError(''); setLoading(true);
    try {
      const { token, user } = await authApi.register({ email, password, name, role: 'client' });
      setToken(token);
      onLogin(user);
      onClose();
      reset();
    } catch (e) {
      setError(e.message);
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
          <input type="password" placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'} value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }} onKeyDown={handleKey}
            className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 leading-relaxed">{error}</p>
        )}

        <button
          onClick={mode === 'login' ? handleLogin : handleRegister}
          disabled={!email || !password || (mode === 'register' && !name) || loading}
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
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
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
              <input type="password" placeholder="At least 8 characters" value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
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
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setError(''); setLoading(true);
    try {
      const { user: updated } = await authApi.changePassword({ name: name.trim(), newPassword: password });
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
          <input type="password" placeholder="At least 8 characters" value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
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

// ─── NAVIGATION / HEADER ──────────────────────────────────────────────────────

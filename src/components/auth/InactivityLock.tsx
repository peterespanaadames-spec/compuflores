import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const IDLE_LOCK_MS = 60_000;
const IDLE_LOGOUT_MS = 15 * 60_000;
const ACTIVITY_THROTTLE_MS = 1_000;

export function InactivityLock() {
  const { user, session, signOut } = useAuth();
  const navigate = useNavigate();

  const [locked, setLocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const lockedRef = useRef<boolean>(false);
  const fetchOriginalRef = useRef<typeof window.fetch | null>(null);

  useEffect(() => { lockedRef.current = locked; }, [locked]);

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) { clearTimeout(idleTimerRef.current); idleTimerRef.current = null; }
    if (logoutTimerRef.current) { clearTimeout(logoutTimerRef.current); logoutTimerRef.current = null; }
  }, []);

  const scheduleTimers = useCallback(() => {
    clearTimers();
    idleTimerRef.current = setTimeout(() => { if (!lockedRef.current) setLocked(true); }, IDLE_LOCK_MS);
    logoutTimerRef.current = setTimeout(() => {
      void (async () => {
        try { await signOut(); } catch { /* noop */ }
        navigate('/login', { replace: true });
      })();
    }, IDLE_LOGOUT_MS);
  }, [clearTimers, signOut, navigate]);

  const handleActivity = useCallback(() => {
    if (lockedRef.current) return;
    const now = Date.now();
    if (now - lastActivityRef.current < ACTIVITY_THROTTLE_MS) return;
    lastActivityRef.current = now;
    scheduleTimers();
  }, [scheduleTimers]);

  useEffect(() => {
    if (!user) { clearTimers(); setLocked(false); return; }
    lastActivityRef.current = Date.now();
    scheduleTimers();
    const events: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const listener = () => handleActivity();
    events.forEach((ev) => window.addEventListener(ev, listener, { passive: true } as AddEventListenerOptions));
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, listener));
      clearTimers();
    };
  }, [user, handleActivity, scheduleTimers, clearTimers]);

  useEffect(() => {
    if (!fetchOriginalRef.current) fetchOriginalRef.current = window.fetch.bind(window);
    const original = fetchOriginalRef.current!;
    if (locked) {
      const guardedFetch: typeof window.fetch = (input: any, init?: any) => {
        const url = typeof input === 'string' ? input : (input?.url || '');
        if (url.includes('/api/auth/')) return original(input, init);
        return Promise.resolve(new Response(JSON.stringify({ success: false, error: 'Sesion bloqueada por inactividad.' }), { status: 423, headers: { 'Content-Type': 'application/json' } }));
      };
      window.fetch = guardedFetch as typeof window.fetch;
      document.body.style.overflow = 'hidden';
    } else {
      window.fetch = original;
      document.body.style.overflow = '';
    }
    return () => { window.fetch = original; document.body.style.overflow = ''; };
  }, [locked]);

  useEffect(() => {
    if (!locked && user) { lastActivityRef.current = Date.now(); scheduleTimers(); }
  }, [locked, user, scheduleTimers]);
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifying) return;
    if (!password.trim()) { setError('Ingresa tu contrasena.'); return; }
    const email = user?.email || '';
    const isLocal = session?.mode === 'local';
    setVerifying(true);
    setError('');
    try {
      const original = fetchOriginalRef.current || window.fetch.bind(window);
      const endpoint = isLocal ? '/api/auth/local-login' : '/api/auth/login';
      const body = isLocal ? { accessKey: password, email: email || 'operador@frenyer.local' } : { email, password };
      const res = await original(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Credenciales incorrectas.');
      window.dispatchEvent(new CustomEvent('frenyer:auth-changed'));
      setLocked(false);
      setPassword('');
      lastActivityRef.current = Date.now();
    } catch (err: any) {
      setError(err?.message || 'No se pudo verificar la contrasena.');
    } finally {
      setVerifying(false);
    }
  };

  if (!user || !locked) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="inactivity-lock-title" style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(17,24,39,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 'var(--radius-lg,16px)', border: '1px solid var(--border,#e2e8f0)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--brand-500,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Lock size={20} />
          </div>
          <div>
            <h2 id="inactivity-lock-title" style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Sesion bloqueada por inactividad</h2>
            <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Ingresa tu contrasena para continuar.</p>
          </div>
        </div>
        <form onSubmit={handleUnlock}>
          {user?.email && <div style={{ marginBottom: 10, fontSize: 12, color: '#6b7280' }}>Usuario: <strong style={{ color: '#111827' }}>{user.email}</strong></div>}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" autoFocus placeholder="Contrasena" disabled={verifying} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border,#e2e8f0)', fontSize: 14, outline: 'none', marginBottom: 10 }} />
          {error && <div style={{ marginBottom: 10, fontSize: 12, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '6px 10px' }}>{error}</div>}
          <button type="submit" disabled={verifying} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: 'none', background: 'var(--brand-500,#7c3aed)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: verifying ? 'not-allowed' : 'pointer', opacity: verifying ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {verifying && <Loader2 size={16} className="animate-spin" />}
            Desbloquear
          </button>
        </form>
        <p style={{ marginTop: 12, fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>La sesion se cerrara automaticamente tras 15 minutos de inactividad.</p>
      </div>
    </div>
  );
}
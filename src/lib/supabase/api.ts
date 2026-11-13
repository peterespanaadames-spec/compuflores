const SESSION_HANDLE_KEY = 'frenyer_sid';
let inMemorySessionHandle: string | null = null;
let inactivityLocked = false;

export function getSessionHandle(): string | null {
  if (typeof window !== 'undefined') {
    try {
      const stored = window.sessionStorage.getItem(SESSION_HANDLE_KEY);
      if (stored) {
        inMemorySessionHandle = stored;
        return stored;
      }
    } catch {
      // Algunos contextos restringidos bloquean sessionStorage; usar respaldo en memoria.
    }
  }
  return inMemorySessionHandle;
}

export function setSessionHandle(sid: string | null | undefined): void {
  const clean = typeof sid === 'string' && sid.trim() ? sid.trim() : null;
  inMemorySessionHandle = clean;
  if (typeof window !== 'undefined') {
    try {
      if (clean) {
        window.sessionStorage.setItem(SESSION_HANDLE_KEY, clean);
      } else {
        window.sessionStorage.removeItem(SESSION_HANDLE_KEY);
      }
    } catch {
      // Ignorar si sessionStorage no esta disponible.
    }
  }
}

export function withSessionInit(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers);
  const sid = getSessionHandle();
  if (sid && !headers.has('X-Frenyer-Session')) {
    headers.set('X-Frenyer-Session', sid);
  }
  return {
    ...init,
    headers,
    credentials: init.credentials ?? 'include'
  };
}

export function setInactivityLocked(locked: boolean): void {
  inactivityLocked = locked;
}

export function isInactivityLocked(): boolean {
  return inactivityLocked;
}

/**
 * Peticion al servidor con la cookie de sesion httpOnly y respaldo opaco por cabecera.
 * La credencial de Supabase nunca viaja en el navegador: el servidor la adjunta.
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url);
  if (inactivityLocked && !url.includes('/api/auth/')) {
    return new Response(
      JSON.stringify({ success: false, error: 'Sesión bloqueada por inactividad.' }),
      { status: 423, headers: { 'Content-Type': 'application/json' } }
    );
  }
  const response = await fetch(input, withSessionInit(init));
  if (response.status === 401 && !url.includes('/api/auth/') && typeof window !== 'undefined') {
    setSessionHandle(null);
    window.dispatchEvent(new CustomEvent('frenyer:session-invalidated'));
  }
  return response;
}


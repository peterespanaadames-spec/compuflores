/**
 * Carga de módulos con recuperación automática tras un despliegue.
 *
 * Cuando Vercel publica una versión nueva, los archivos con hash cambian de
 * nombre; un navegador que aún contiene el index.html anterior pide un módulo
 * que ya no existe y React Router muestra «Failed to fetch dynamically
 * imported module». La recuperación es recargar la página una sola vez para
 * traer el index nuevo, con marca en sessionStorage para evitar bucles de
 * recarga (si la red está caída, no recargamos en bucle).
 */

const RELOAD_KEY = 'frenyer:chunk-reload-at';
const RELOAD_COOLDOWN_MS = 10_000;

function reloadOnceForNewAssets(): void {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last <= RELOAD_COOLDOWN_MS) return;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    window.location.replace(window.location.href);
  } catch {
    // sessionStorage bloqueado: no recargar, dejar que el usuario lo haga.
  }
}

export function lazyRoute<T>(load: () => Promise<T>): () => Promise<T> {
  return async () => {
    try {
      return await load();
    } catch (err) {
      if (
        typeof window !== 'undefined' &&
        err instanceof TypeError &&
        /fetch|import|module|loading/i.test(String(err.message))
      ) {
        reloadOnceForNewAssets();
      }
      throw err;
    }
  };
}

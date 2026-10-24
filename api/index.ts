/**
 * Entrada serverless de Vercel.
 * Importa la aplicación Express completa (todas las rutas /api/* de server.ts)
 * y la expone como manejador de funciones. Vercel sirve el frontend
 * estático desde dist/ por el CDN y enruta /api/* aquí vía rewrites.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
let app: any = null;
let initError: string | null = null;

try {
  const mod: any = await import('./server');
  app = mod.default;
} catch (err: any) {
  initError = err?.stack ? String(err.stack) : String(err);
  console.error('[Frenyer ERP] Error cargando server.ts en la función:', initError);
}

export default async function handler(req: any, res: any) {
  if (!app) {
    return res.status(500).json({
      success: false,
      error: 'Fallo al inicializar el servidor en la función serverless',
      detail: initError
    });
  }
  return app(req, res);
}

/**
 * Shim de arranque local.
 * La lógica completa del servidor vive en `api/server.ts` (necesaria para el
 * paquete serverless de Vercel: la función solo incluye lo que está bajo api/).
 * Este archivo reexporta la app para que `npm run dev` / `npm run start`
 * sigan ejecutándose desde la raíz del proyecto sin cambios.
 */
export { default } from './api/server.ts';

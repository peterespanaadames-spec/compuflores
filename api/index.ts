/**
 * Entrada serverless de Vercel.
 * Importa la aplicación Express completa (todas las rutas /api/* de server.ts)
 * y la expone como manejador de funciones. Vercel sirve el frontend
 * estático desde dist/ por el CDN y enruta /api/* aquí vía rewrites.
 */
import app from '../server';

export default app;

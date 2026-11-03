---
type: feature
title: Cierre automático de sesión al cerrar el navegador
status: done
created: 2026-11-03
tags: [sesiones, seguridad, cookies]
---

# Cierre de sesión automático al cerrar el navegador

## Intención
Al cerrar el navegador, la sesión debe morir: al reabrir, la aplicación exige
iniciar sesión de nuevo. Sin dependencias nuevas y sin tocar migraciones.

## Implementación
- **Servidor (api/server.ts)**: `frenyer_session` y `frenyer_refresh` ya no se
  emiten con `maxAge` (antes 12 h). Pasan a **cookies de sesión** (sin Max-Age/
  Expires): el navegador las elimina por sí solo al cerrarse. Todos los puntos
  de emisión quedan cubiertos (login, registro, refresh, Google callback, PKCE
  y clave de acceso local); el vencimiento interno del token local (12 h) se
  conserva como techo adicional.
- **Cliente (AuthContext)**: si `/api/auth/session` no encuentra sesión al abrir
  la app (cookie muerta), se limpia la identidad local residual
  (`frenyer_active_user`, rol y permisos) para que `ProtectedRoute` redirija a
  `/login` sin restaurar al usuario anterior.

## Comportamiento resultante
1. Cerrar navegador → las dos cookies se borran solas.
2. Reabrir → `GET /api/auth/session` = 401 → identidad local limpiada → login.
3. La fila `app_sessions` de esa navegación queda activa solo hasta su expiración
   por inactividad (30 min personal / 2 h comprador) o el reemplazo del siguiente
   inicio de sesión; sin cookie no hay token utilizable, así que no es riesgo.
4. Respaldo: navegadores con «continuar donde lo dejaste» pueden conservar
   cookies de sesión; la expiración por inactividad del servidor cierra ese hueco.

## Verificación (guion frenyer-cookie-qa.mjs)
- Login local: `frenyer_session` y `frenyer_refresh` sin Max-Age ✓
- Sesión con cookie: HTTP 200 ✓ · Sin cookie: HTTP 401 ✓
- Usuario QA temporal creado y eliminado ✓
- `npm run build` ✓ · `npm run lint` ✓

---
type: spec
title: Sesiones y autorización en servidor (5 ítems + hallazgo bloqueante)
status: implemented
created: 2026-11-02
approved: 2026-11-02 (usuario: Aprobar tal cual + Autopilot + Fase B 4b con migración 0029 app_sessions; también incluye B3b: "cerrar todas las sesiones")
implemented: 2026-11-02 — verificado con `npm run build`/`lint` limpios + pruebas E2E listadas abajo (la 0029 queda PENDIENTE de aplicar por el usuario en el SQL Editor)
origin: Auditoría teórica de sesiones (revisión de api/server.ts, AuthContext.tsx, InactivityLock.tsx)
tags: [sdd, seguridad, sesiones, rbac]
---

# Especificación — Sesiones y autorización en servidor

## Intención (the why)

La auditoría de sesiones confirmó que el transporte de sesión es sólido (cookies HttpOnly/SameSite=Strict/Secure, rotación de tokens, PKCE en Google, auditoría `logAuthEvent`), pero que el **registro de acceso** en servidor no distingue siempre quién es quien: la mayoría de rutas exige "una sesión válida" pero no examina el rol, y no existe ningún registro de sesiones de la app que permita derogarla en su momento.

## Entregables clasificados por dependencias de BD

### Fase A — Sin migraciones, solo `api/server.ts` (+ micro-ajustes cliente)

#### A0. Hallazgo bloqueante de la auditoría (extra, no de los 5 ítems)
En `POST /api/auth/local-login` existe una aceptación de claves literales de respaldo **además de** la `FRENYER_ACCESS_KEY`. Cualquiera que conozca esas 2 claves obtiene rol `admin` (continuando con un valor alto de ingenuidad). Los valores literales **no se reproducen** ni en esta spec ni en el commit.

Tareas Höcher:
1. Eliminar las igualdades literales de la condición; quedar solo `safeCompare(candidate, ACCESS_KEY)`.
2. Activar aviso `logAuthEvent('ACCESO_LOCAL_FALLIDO', …)` en todo fallo (ya existe, verificar la rama).

#### A1. RBAC por rol en servidor (ítem 1)
Hoy: `authenticateSupabaseRequest` valida que haya sesión (token local o JWT de Supabase) pero no lee el rol en la mayoría de rutas; solo algunos endpoints (usuario asociado, propios del portal) distinguen. La Batica de defensa real hoy es `organization_id` (RLS globalmente deshabilitada por 0024).

Trabajo:
1. En `api/server.ts` (después de `applySessionContext`, en la resolución de sesión), adjuntar `role` al contexto como ya ocurre (`res.locals.supabaseContext.role`).
2. Nuevo helper `requireRole(minimumRoles)` similar en firma a `requireAuthForMethods`:
   - `interna` (ERP: inventario, finanzas, reportes, usuarios, proveedores, respaldos): rechaza si `role === 'cliente'`.
   - `operador` (caja/POS: ventas, cotizaciones): rechaza solo `cliente` (mantener; no subir el nivel por ahora).
   - `admin` (usuarios asociados, DELETE de usuario, respaldo Excel/JSON): **eliminada** la residencia en la lista interna de correos como sustituto de rol; aquí se confía en rol resolvido + (se vale) correos internos.
3. Aplicarla como capa extra a la lista existente de `app.use([...])` por familia de ruta; las rutas de tienda/portal (`/api/customer/*`, `/api/shop/*`) quedan en su estado, cada una con la resolución de sesión del comprador que ya usan (`resolveCustomerSession`).
4. En sesión `local` el rol ya viene firmado (payload `role`); se usa el mismo helper.
5. Cambio a segmentar: si la ruta `/api/sales` registra ventas (POS caja) y también las usa el panel, el nivel debe ser `operador`. Utiliza la carta de permisos ya existente en `defaultPermissionsForRole` como mapa de módulos (regla única, no duplicar la tabla).

Criterios de validación:
- [ ] Con sesión `cliente`, `GET /api/bank-accounts` → 403 con mensaje específico (distintivo de 401).
- [ ] Con sesión `cliente`, compras/inventario/expenses/bancos → 403.
- [ ] Con sesión de gerente/administrador/cajero → los módulos de su rol funcionan igual que hoy (regresión 0).
- [ ] El POS sige emitiendo ventas con cajero.

#### A2. Cierre de sesión con revocación real (ítem 2)
Hoy: `POST /api/auth/logout` solo borra cookies; el JWT municipal sigue válido hasta expirar (honor de que caduca ~1 h, y sessionCache se queda con l entry ~5 min).

Trabajo:
1. En el handler de logout: si la cookie venía de Supabase, llamar a `auth/v1/logout` con el token en `Authorization` (best effort, tolerar error y seguir).
2. Purgar `sessionCache.delete(token)` y cualquier `sessionInflight` vivo del token.
3. Sesiones `local`: la revocación es solo cookie (no hay registro del lado servidor que derogar). Documentado así.
4. Cliente (`AuthContext`): ya borra `frenyer_active_user/role/permissions`; añadir un `authenticatedFetch('/api/auth/logout', {method:'POST'})` en el flujo de cierre para disparar la revocación (verificar que ya lo haga; si ya lo debe hacer, solo confirmar).

Criterios:
- [ ] Tras logout, `GET /api/auth/session` con la cookie vieja → 401 (**inmediato**, no tras 1 h).
- [ ] El acceso a rutas con esa cookie viva vía `Authorization: Bearer <token>` → 401.

#### A5. Rate limiting por identidad (ítem 5)
Hoy: límites por IP en memoria (`login` 5/15 min, `register` 5/h, `local-login` 5/15 min) con penalización escalonada. Limitación de Vercel serverless: se reinicia por instancia. En el perfil de amenaza de la tienda (login en Supabase es vía proxy con "5 por IP"), la mejora costo-beneficio es la clave por correo + un padrino lógico.

Trabajo:
1. Claves duales: `login:${ip}` (ya existe) **más** `login-email:${cleanEmail}` (5/15 min con la misma penalización escalonada); análogo en `local-login`.
2. Aviso en la respuesta 429 del育人 cuánto falta por intento (ya lo dice) y en el log de `logAuthEvent` registrar si la traba fue por correo o por IP.
3. No introducir Redis/dependencias externas (aciente con el estilo del proyecto); el multiplicador de instancias en Vercel queda documentado como límite conocido, no resuelto.

Criterios:
- [ ] 6 intentos fallidos del mismo correo (aunque rote de IP/cabeceras) → 429 desde el primero del intento 6.
- [ ] Login correcto NO consumir ambos contadores al Resetio ni penaliza (limpiar contador de esa clave en éxito de login, decisión conservadora: sí, el reset del del correo).

### Fase B — Requiere migración nueva (0029) y decisión previa

#### B3. Política multi-dispositivo (ítem 3) — DECISIÓN PENDIENTE
Opciones:
- (3a) **Estado actual ratificado**: sesiones concurrentes ilimitadas, sin invalidación remota. Sólo se añade un botón "Cerrar sesión en todos mis dispositivos"? Fue sugerido en auditoría y queda propuesto para otra iteración; este spec, a su alcance se trata.
- (3b) **`sessions` con seguimiento**: tabla que registra sesión, dispositivo, emisor y `last_seen` — permite "cerrar todas las sesiones" y es la misma pieza que needs (B4). Migración aditiva (`0029_sessions_tracking.sql`): tabla `app_sessions(id, user_id, token_hash(sha256), device_label, created_at, last_seen, revoked_at)`; índice por usuario.

**Pregunta también pendiente desde constitution §5.3**: crear una migración nueva y tocar el flujo de autorización requieren confirmación previa del usuario.

#### B4. Timeout de inactividad server-side (ítem 4) — DECISIÓN PENDIENTE
Opciones:
- (4a) **Documentar el modelo actual** (`InactivityLock` 60 s/15 min es solo visual, interceptaca `passwordCheck` en server): no cambia código salvo doc en `docs/`.
- (4b) **Inactividad supervisada con server**: requiere la misma tabla de B3; el middleware actualiza en memoria/volumen `last_seen` y compara contra ventana de inactividad (propuesta: 30 min ERP, 2 h portal cliente); expirado → 401 con código dedicado que el cliente usa para lanzar la pantalla de bloqueo ya existente.

## Fuera de alcance (explícito)

- Re-habilitar Alma o cualquier integración LLM (Fase 3 teórica: permanece desactivada; las directrices heredadas del precedente sí aplican cuando vuelva).
- Cambiar el proveedor de tokens (seguimos con Supabase Auth + cookies firmadas por él).
- Redis, colas, o CDN WAF en Vercel.

## Orden de ejecución propuesto

1. A0 (una línea, crítica) → 2. A1 (RBAC) → 3. A2 (logout) → 4. A5 (rate limit) → decidir A/B → B3/B4 si se aprueba la migración.

## Estrategia de pruebas

- `npm run build` + `npm run lint` limpios (constitution §2) — ✓ verificados.
- E2E manual con sesión de `cliente` vs `gerente` vs `cajero` (matriz A1), logout seguido de reutilización forzada de cookies (A2), 6 fallos de login (A5) — ✓ verificados con script (ver sección «Resultado»).
- Verificar en dev (puerto 3000) que el panel ERP y la tienda no sufren regresiones de sesión (login local + Supabase).

## Resultado de la ejecución (2026-11-02)

| Criterio | Evidencia |
|---|---|
| Cliente con sesión → 403 en bancos/ventas/marca-put | E2E con token REAL de comprador: bancos 403 `ROLE_FORBIDDEN`, ventas 403, `PUT business-profile` 403 |
| `GET /api/business-profile` sigue visible para comprador | 200 |
| Rastreo público sin cambios | `/api/orders/track` 200 |
| `GET /api/users` con sesión de comprador → 403 | 403 (reservado a familia administrativa) |
| Personal puede operar | Login local admin → `/api/bank-accounts` 200 |
| Logout revoca la sesión real de Supabase | Tras logout: `Directa /auth/v1/user` 403 «Session from session_id claim in JWT does not exist»; vía proxy `SESIÓN` 401 al instante |
| Límite por correo escapa de rotar IP | 6 intentos con 6 IP distintas → el 6.º HTTP 429 «…para este correo» |
| `logout-all` con sesión real | 200 `scope='todas las sesiones del usuario'`; luego la sesión queda en 401 |
| Degradación sin 0029 | logout/logout-all ejecutados SIN la tabla: 200 sin romper (solo aviso) |
| Build/lint/test | `npm run build` ok · `npm run lint` limpio · `npm run test` code 0 (vitest confinado a `src/`; el repo no tenía pruebas propias — los "1415 pasados" eran de dependencias) |

QA: la revocación REAL se probó con un usuario temporal de Supabase creado y eliminado con service role en la misma ejecución; los tokens locales (HMAC `local.`) son sin estado y su invalidación es solo por cookie (decisión documentada). El botón de UI queda pendiente de verificación visual del usuario (la llamada que dispara ya está extendida).

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Bloquear al cajero con errores 403 al añadir RBAC | Mapa de roles derivado de `defaultPermissionsForRole`, no lista artisanal; matriz de prueba por rol |
| Logout revoca tokens de OTROS dispositivos del mismo usuario | `logout` de Supabase solo invalida la sesión del token actual (no `signOut({scope: 'global'})`) |
| Migración de sesiones toca flujo de autorización | Requiere aprobación previa del usuario; fase B separada |

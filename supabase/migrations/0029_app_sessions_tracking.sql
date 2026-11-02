-- ==============================================================================
-- MIGRACIÓN 0029 — Seguimiento de sesiones activas (app_sessions)
-- ==============================================================================
-- Objetivo:
--   Registrar las sesiones activas del sistema para habilitar:
--     1. Expiración por inactividad SUPERVISADA EN SERVIDOR (además del
--        bloqueo visual que ya existe en el panel): ciclos internos 30 min,
--        comprador web 2 h.
--     2. "Cerrar sesión en todos los dispositivos": el usuario puede revocar
--        de una vez todas sus sesiones activas.
--
-- Contexto:
--   El servidor (api/server.ts) mantiene por cada token una fila con el
--   HASH SHA-256 del token (NUNCA el token en claro). Esa fila es la fuente
--   de autorización adicional: si revoked_at tiene fecha, la petición con ese
--   token se rechaza (401) en todas las instancias que la consulten.
--
--   Aislamiento: la migración es ADITIVA e IDEMPOTENTE (se puede ejecutar
--   varias veces sin errores). El RLS queda deshabilitado para seguir el
--   mismo criterio del resto del esquema desde la 0024 (el servidor filtró
--   por organización/usuario);
--   esta tabla no contiene datos de negocio ni PII: solo hash, usuario,
--   etiqueta de dispositivo y marcas de tiempo.
--
--   Si esta migración NO se ha aplicado, el servidor degrada con un aviso:
--   las sesiones siguen funcionando como antes (sin seguimiento).
-- ==============================================================================

create table if not exists public.app_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  token_hash text not null unique,
  device_label text,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  revoked_at timestamptz
);

-- Índice de búsqueda por usuario (listado y revocación masiva).
create index if not exists app_sessions_user_idx on public.app_sessions (user_id);

-- Índice para la purga de filas antiguas (opcional a futuro).
create index if not exists app_sessions_last_seen_idx on public.app_sessions (last_seen);

-- Comentario de catálogo para documentar el propósito de la tabla.
comment on table public.app_sessions is
  'Sesiones activas del ERP/tienda: hash del token (nunca el token), usuario, dispositivo y marcas de actividad/revocación.';

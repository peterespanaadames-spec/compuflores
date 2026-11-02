-- ==============================================================================
-- MIGRACIÓN 0030 — Políticas RLS explícitas para app_sessions
-- ==============================================================================
-- Contexto:
--   La 0029 creó app_sessions y, al quedar RLS activo sin políticas, el
--   servidor quedó sin forma de escribir la fila de seguimiento con el token
--   del propio usuario (403 "violates row-level security policy").
--
--   Esta migración hace el acceso explícito y CON ALCANCE: cada usuario
--   autenticado solo puede ver y actualizar SUS PROPIAS sesiones
--   (user_id = auth.uid()). El service role no pasa por RLS (comportamiento
--   estándar de Supabase para tareas administrativas). Aditiva e idempotente.
-- ==============================================================================

alter table if exists public.app_sessions enable row level security;

-- Política integral: un usuario solo toca sus propias filas de sesión.
drop policy if exists app_sessions_owner_access on public.app_sessions;
create policy app_sessions_owner_access
  on public.app_sessions
  for all
  to authenticated
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

-- Grants en línea con el resto del esquema (el RLS es la valla real).
grant all on public.app_sessions to authenticated, anon;

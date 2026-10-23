-- ==============================================================================
-- MIGRACIÓN 0026 — Perfil de negocio completo en organizations
-- ==============================================================================
-- Objetivo:
--   Permitir que la pantalla Configuración -> Negocio guarde TODOS los datos
--   de identidad fiscal en la tabla `organizations` de Supabase, y no solo en
--   el almacenamiento local del navegador.
--
-- Contexto:
--   La tabla real `organizations` fue creada por 0002 con únicamente
--   (id, name, rif, phone, address, currency, created_at). El formulario de
--   Configuración guarda además email, whatsapp, eslogan, logo y favicon
--   (imagen como data URL), que no tienen columnas. Sin esta migración esos
--   campos no pueden persistir en la base.
--
-- Esta migración es ADITIVA e IDEMPOTENTE: se puede ejecutar varias veces
-- sin producir errores ni duplicidad.
-- ==============================================================================

-- 1. Correo de contacto del negocio.
alter table if exists public.organizations
  add column if not exists email text;

-- 2. Número de WhatsApp comercial.
alter table if exists public.organizations
  add column if not exists whatsapp text;

-- 3. Eslogan / frase comercial.
alter table if exists public.organizations
  add column if not exists slogan text;

-- 4. Logo corporativo (data URL).
alter table if exists public.organizations
  add column if not exists logo text;

-- 5. Favicon corporativo (data URL).
alter table if exists public.organizations
  add column if not exists favicon text;

-- 6. Permisos coherentes con el esquema actual (RLS deshabilitado desde 0023).
grant all on public.organizations to anon, authenticated;

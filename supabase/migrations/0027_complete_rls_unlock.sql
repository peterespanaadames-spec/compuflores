-- ==============================================================================
-- MIGRACIÓN 0027 — Completar la desprotección RLS que la 0023 dejó pendiente
-- ==============================================================================
-- Objetivo:
--   Finalizar la desactivación de RLS en las tablas del esquema `operaciones`
--   que la migración 0023 omitió: sale_items, payments y receivable_payments.
--
-- Contexto:
--   La 0023 deshabilitó RLS en la mayoría de las tablas públicas, pero el
--   listado no incluyó `sale_items`, `payments` ni `receivable_payments`.
--   Estas permanecen con RLS activo y una política basada en
--   is_org_member(organization_id); como la tabla `organization_members`
--   está vacía, TODO abono registrado (por ejemplo, el abono inicial de una
--   venta a crédito, o el cobro parcial de una CxC) falla con
--   «violates row-level security policy» (403) y no se graba en la base.
--
--   El servidor aplica siempre su propio control de inquilino por
--   organización al registrar operaciones, por lo que queda garantizado el
--   aislamiento por organización también sin RLS.
--
-- Esta migración es ADITIVA e IDEMPOTENTE: se puede ejecutar varias veces
-- sin producir errores ni duplicidad.
-- ==============================================================================

-- 1. Detalle de productos vendidos (si el RLS activo bloquea su registro).
alter table if exists public.sale_items disable row level security;

-- 2. Pagos de ventas (tabla opcional: puede no existir aún en el esquema).
alter table if exists public.payments disable row level security;

-- 3. Abonos de cuentas por cobrar (la tabla bloqueada por la política vacía).
alter table if exists public.receivable_payments disable row level security;

-- 4. Permisos coherentes con el resto del esquema.
grant all on public.sale_items to anon, authenticated;
grant all on public.receivable_payments to anon, authenticated;
-- payments solo si existe (supabase lo omite, si aún no se crea la tabla).
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'payments') then
    execute 'grant all on public.payments to anon, authenticated';
  end if;
end $$;

-- =============================================================================
-- MIGRACIÓN 0031 — FACTURAS / PEDIDOS EN ESPERA DEL POS (parked_invoices)
-- =============================================================================
-- Objetivo:
--   Persistir las ventas que el cajero coloca en espera (FACT. PEND.) para
--   que sobrevivan recargas de la página y cierres del navegador, y puedan
--   recuperarse desde cualquier dispositivo de la misma organización.
--
--   Cada fila guarda: número de control secuencial que lleva el POS
--   (ESP-001, ESP-002, ...), nombre y datos del cliente, los ítems del
--   carrito como JSONB y el total en USD. Se elimina al cobrar la venta
--   (restaurar carrito) o al descartarla manualmente.
--
--   Aislamiento: es ADITIVA e IDEMPOTENTE. RLS habilitado con política
--   permisiva siguiendo el mismo criterio del resto del esquema desde la
--   0024/0028 (el servidor y las funciones del cliente filtran por
--   organization_id activa; nunca se exponen datos entre organizaciones).
-- =============================================================================

create table if not exists public.parked_invoices (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete cascade default '00000000-0000-0000-0000-000000000001',
    control_number text not null,
    client_name text not null default 'Cliente sin registrar',
    client_rif text,
    client_phone text,
    client_address text,
    items jsonb not null default '[]'::jsonb,
    total_usd numeric(12,2) not null default 0,
    created_by text,
    created_at timestamptz not null default now()
);

-- Un número de control no puede repetirse dentro de la misma organización.
create unique index if not exists parked_invoices_org_control_idx
    on public.parked_invoices (organization_id, control_number);

-- Listado del modal ordenado por control (más reciente primero).
create index if not exists idx_parked_invoices_org_created
    on public.parked_invoices (organization_id, created_at desc);

alter table if exists public.parked_invoices enable row level security;
drop policy if exists "allow_all_parked_invoices" on public.parked_invoices;
create policy "allow_all_parked_invoices" on public.parked_invoices
    for all to anon, authenticated using (true) with check (true);
grant all on public.parked_invoices to anon, authenticated;

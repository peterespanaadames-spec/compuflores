-- =============================================================================
-- FRENYER ERP — CONFIGURACIÓN DE IMPRESIÓN / TICKETS / PERIFÉRICOS
-- =============================================================================

create table if not exists public.print_settings (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid references public.organizations(id) on delete cascade default '00000000-0000-0000-0000-000000000001',
    default_format text not null default 'ticket80',
    cash_drawer_trigger boolean not null default true,
    header_message text,
    footer_message text,
    created_at timestamptz not null default now(),
    updated_at timestamptz default now()
);

alter table if exists public.print_settings add column if not exists default_format text not null default 'ticket80';
alter table if exists public.print_settings add column if not exists cash_drawer_trigger boolean not null default true;
alter table if exists public.print_settings add column if not exists header_message text;
alter table if exists public.print_settings add column if not exists footer_message text;
alter table if exists public.print_settings add column if not exists updated_at timestamptz default now();

create index if not exists idx_print_settings_org on public.print_settings(organization_id);

alter table if exists public.print_settings enable row level security;
drop policy if exists "allow_all_print_settings" on public.print_settings;
create policy "allow_all_print_settings" on public.print_settings for all to anon, authenticated using (true) with check (true);
grant all on public.print_settings to anon, authenticated;
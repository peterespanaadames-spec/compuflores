-- ==============================================================================
-- MIGRACIÓN 0025 — Cuentas por cobrar con cliente no registrado
-- ==============================================================================
-- Objetivo:
--   Permitir registrar cuentas por cobrar manuales donde el cliente puede ser
--   un nombre libre (sin fila en public.customers), además de guardar el
--   concepto de la cuenta.
--
-- Contexto:
--   La tabla real `accounts_receivable` fue creada por 0002 con
--   `customer_id uuid NOT NULL`. En un esquema donde la tabla ya existe, la
--   migración 0016 no altera nada (usa `CREATE TABLE IF NOT EXISTS`), por lo
--   que en la base viva faltan las columnas `customer_name` y `concept` y el
--   `customer_id` sigue obligatorio. Esto rompía el guardado del formulario
--   "Agregar cuenta pendiente" desde el POS/CxC.
--
-- Esta migración es ADITIVA e IDEMPOTENTE: se puede ejecutar varias veces
-- sin producir errores ni duplicidad.
-- ==============================================================================

-- 1. Columna para el nombre libre del cliente (cuando no hay id registrado).
alter table if exists public.accounts_receivable
  add column if not exists customer_name text;

-- 2. Concepto/descripción breve de la cuenta (ya usada por la aplicación).
alter table if exists public.accounts_receivable
  add column if not exists concept text default 'Venta a crédito o saldo pendiente';

-- 3. Hacer opcional el vínculo a clientes registrados: las cuentas manuales
--    guardarán el nombre en `customer_name`; las ventas a crédito del POS
--    siguen vinculando siempre su `customer_id`.
alter table if exists public.accounts_receivable
  alter column customer_id drop not null;

-- 4. Permisos coherentes con el esquema actual (RLS deshabilitado desde 0023).
grant all on public.accounts_receivable to anon, authenticated;

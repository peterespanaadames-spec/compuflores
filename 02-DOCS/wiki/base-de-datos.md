# Base de datos (Supabase) — migraciones

Origen: `supabase/migrations/`. El usuario las aplica manualmente en el SQL Editor del proyecto Supabase (regla del proyecto: nunca el asistente crea migraciones estructurales sin preguntar).

## Secuencia

| Migración | Qué hace |
| --- | --- |
| 0001_inicial | Base del esquema (organizaciones, usuarios, membresías) |
| 0002_completo_scheme | Esquema completo del negocio (productos, ventas, bancos…) |
| 0003_políticas_rls | Políticas RLS iniciales |
| 0004_bank_movements | Tabla de movimientos bancarios |
| 0005_account_payable | Obligaciones por pagar |
| 0006_suppliers | Proveedores |
| 0007_correct_payable | Corrección del esquema de cuentas por pagar |
| 0008_suppliers_link | Vinculación de payables con proveedores |
| 0009_lock_down_rls | Endurecimiento de RLS para la API |
| 0010_auth_signup | Alta de organización al registrarse |
| 0011_quotes | Módulo de cotizaciones |
| 0012_atomic_bank | Movimientos bancarios atómicos |
| 0013_purchases | Módulo de compras |
| 0014_suppliers_columns | Columnas garantizadas de proveedores |
| 0015_branches_warehouses | Sucursales y almacenes |
| 0016_expenses | Módulo de gastos |
| 0016b_suppliers_fix | Corrección suppliers/payables/purchases |
| 0017_inventory_movements | Movimientos de inventario (kárdex) |
| 0018_orders | Módulo de pedidos de la tienda |
| 0019_receivable_payments_rls | Corrección RLS de abonos por cobrar |
| 0020_suppliers_unique | Anti-duplicados de proveedores |
| 0021_rbac_profiles | RBAC con perfiles y primer usuario |
| 0022_shop_customer_tables | Tablas del portal de cliente (pedidos de tienda) |
| 0023_rls_off | Desactivación parcial de RLS (sin cobertura en sale_items/payments/receivable_payments/members) |
| 0024_profile_extensions | Extensiones de perfiles |
| 0025_receivable_manual | Cuentas CxC con cliente manual (`customer_name`/`concept`, `customer_id` opcional) |
| 0026_business_profile_extensions | Email/WhatsApp/eslogan/logo/favicon en `organizations` |
| 0027_complete_rls_unlock | Desactiva RLS también en `sale_items`, `payments`, `receivable_payments` (sustitue el toque de service role del servidor) |

## Estado de aplicación (último estado conocido — 2026-10-23)

- El usuario confirmó la aplicación **paso a paso**; 0025, 0026 y 0027 fueron el lote final entregado. Si el servidor sigue usando el bloque de respaldo con clave de servicio para abonos, es señal de que 0027 aún no está aplicada.
- `payments`, `payment_methods` y `bank_movements` pueden no existir en la BD activa: el servidor tolera el 404 y lo reporta como `warnings` en los payloads.
- Con clave de unidad (anon) las filas de `receivable_payments` quedan ocultas por política; para verificarlos se usa la clave de servicio solo en lectura desde el servidor.

## Tablas del flujo de dinero (regla de dominio)

- Venta a crédito → fila en `accounts_receivable` (deuda del cliente).
- Abono → fila en `receivable_payments` **y** movimiento bancario de INGRESO en el banco asociado.
- Todo monto se guarda con su `exchange_rate` del momento (bimonetariedad de auditoría).
- Redondeo de 2 decimales aplicado en `POST /api/sales` y abonos, nunca en el cliente.

## Perfil de negocio

- ` organizations`: nombre, sliders/configuración storefront; 0026 añade email, whatsapp, eslogan, logo y favicon (Config → Negocio persiste ahí desde su migración).
- `profiles`: rol RBAC del usuario interno (`internalRoles` comparadas en el login).

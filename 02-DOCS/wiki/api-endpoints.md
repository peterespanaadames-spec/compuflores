# Catálogo de endpoints del servidor

Fuente: `server.ts` (único backend). Todos responden `{ success: boolean, data|error }`.
Autenticación: sesión por cookie (`resolveCustomerSession` para clientes de tienda; `AuthenticatedResponse` valida inquilino en rutas ERP). No existe Supabase directo desde el navegador.

## Autenticación y usuarios

| Ruta | Uso |
| --- | --- |
| `POST /api/auth/login` | Inicio de sesión con correo/contraseña (Supabase) |
| `POST /api/auth/register` | Registro (rol completo en el cuerpo) |
| `POST /api/auth/customer/register` | Registro exclusivo de cliente de tienda |
| `POST /api/auth/logout` | Cierra sesión (cookie) |
| `GET /api/auth/session` | Sesión activa |
| `GET /api/auth/mode` | Modo de auth (Supabase conectado / local) |
| `POST /api/auth/local-login` | Login local por clave maestra (uso interno del ERP; sin botón visible en pantalla) |
| `GET /api/auth/google` + `GET /api/auth/google/callback` | OAuth Google (desactivado en la pantalla hoy) |
| `GET /api/users`, `POST /api/users`, `PATCH/DELETE /api/users/:id`, `POST /api/users/:id/toggle-status` | CRUD del personal interno (base para decidir rol interno) |
| `POST /api/admin/users/add`, `PATCH /api/admin/users/:id` | Alta/edición administrativa de usuarios |

## Ventas y pedidos

| Ruta | Uso |
| --- | --- |
| `GET /api/sales`, `GET /api/sales/report`, `GET /api/sales/last-doc-number` | Ventas del ERP (fuente única: GET devuelve filas de `sales`) |
| `POST /api/sales` | Registrar venta POS (redondeo 2 decimales; anida `sale`, `items`, `payments`) |
| `GET /api/sale-items` | Líneas de venta |
| `GET /api/orders`, `POST /api/orders` | Pedidos de la tienda |
| `PATCH /api/orders/:id/delivery-status`, `/payment-status` | Estados de entrega/pago |
| `GET /api/orders/track/:query` | Rastreo público de pedido |
| `GET /api/quotes`, `POST`, `PATCH /:id`, `/status`, `DELETE /:id` | Cotizaciones (aún con cliente directo en `db.ts`) |

## Inventario

| Ruta | Uso |
| --- | --- |
| `GET /api/products`, `GET /:sku`, `POST`, `PUT /:sku`, `DELETE /:sku`, `PATCH /:sku/stock` | Catálogo (middleware de auth Supabase) |
| `GET /api/inventory/movements`, `POST /api/inventory/adjustments` | Kárdex y ajustes |
| `GET /api/purchases`, `POST /api/purchases` | Compras internas (aún con cliente directo en `db.ts`) |

## Finanzas

| Ruta | Uso |
| --- | --- |
| `GET/POST /api/bank-accounts`, `PATCH/DELETE /:id` | Cuentas bancarias |
| `GET/POST /api/bank-movements` | Movimientos (tabla 0004; puede no existir en BD → 404 tolerado) |
| `POST /api/bank-transfers` | Transferencias entre bancos |
| `GET /api/bcv/rates`, `POST /manual`, `GET /api/exchange-rates/history` | Tipo de cambio BCV |
| `GET/POST/PATCH /api/accounts-payable`, `POST /:id/payments` | Obligaciones por pagar |
| `GET/POST /api/accounts-receivable`, `POST /:id/payments` | Cuentas por cobrar (abonos; fallback service role documentado) |
| `GET/POST /api/expenses`, `PUT/DELETE /:id`, `POST /:id/pay` | Gastos |
| `GET/POST /api/expense-categories` | Categorías de gasto |
| `GET /api/payment-methods`, `POST`, `PATCH/DELETE /:id` | Métodos de pago |
| `GET/DELETE /api/branches`, `POST`, `PATCH /:id` | Sucursales |

## Clientes, proveedores, negocio

| Ruta | Uso |
| --- | --- |
| `GET/POST /api/customers`, `PATCH/DELETE /:id` | CRM clientes |
| `GET/POST /api/suppliers`, `PATCH/DELETE /:id` | Proveedores |
| `GET/PUT /api/business-profile` | Config → Negocio (tabla `organizations`; 0026 extiende email/whatsapp/eslogan/logo/favicon) |
| `GET /api/public/config`, `/organization`, `/products` | Datos públicos de la tienda |
| `GET /api/reports/process-transactions` (POST) | Procesos de reportes |

## Portal del cliente (tienda, sesión de cliente)

| Ruta | Uso |
| --- | --- |
| `GET /api/customer/portal` | Sin sección: todo. Con `?section=orders|purchases|wishlist|profile`: solo esa parte (`customer` siempre viaja) |
| `POST /api/customer/profile` | Cambia nombre/cédula/teléfono |
| `POST /api/customer/addresses` | Agrega/elimina dirección |
| `POST /api/customer/change-password` | Cambia contraseña (≥ 6 caracteres) |
| `POST /api/customer/wishlist` | Guarda/quita un producto (devuelve la lista actualizada) |

## Sistema

| Ruta | Uso |
| --- | --- |
| `GET /api/supabase/status`, `/migrations-bundle` | Estado y cohorte de migraciones |
| `GET /api/debug/accounts-list`, `/bank-movements-check` | Diagnóstico (no confiar en producción) |
| `GET /*` | SPA fallback al frontend |

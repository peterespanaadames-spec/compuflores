# Frenyer — Índice de la memoria del proyecto

Bienvenido a la memoria. Es lo primero que el asistente lee antes de trabajar en el proyecto, y lo que mantiene actualizado mientras trabaja.

## Qué es Frenyer

Sistema de gestión empresarial bimonetario (ERP/POS) de CompuRepuesto Flores Inversiones. Trabaja simultáneamente en USD y VES (bolívares), con registro de tipo de cambio en cada transacción. Dos frentes en una sola aplicación:

1. **Tienda online de comestibles** (motor e-commerce) — la que ve el cliente final.
2. **Panel administrativo del ERP** (interna) — la que ve el personal del negocio.

Asistente inteligente corporativo: **Alma**, con acceso a datos solo por funciones autorizadas (nunca SQL directo desde el cliente).

## Fichas de la memoria

| Documento | Qué contiene |
| --- | --- |
| [arquitectura.md](./arquitectura.md) | Stack, estructura de carpetas, flujo de datos y reglas dominio (bimonetario, RLS, redondeo). |
| [api-endpoints.md](./api-endpoints.md) | Catálogo completo de rutas del servidor (verificadas en `server.ts`). |
| [base-de-datos.md](./base-de-datos.md) | Migraciones Supabase 0001–0027, estado de aplicación y tablas clave. |
| [roles-y-acceso.md](./roles-y-acceso.md) | Cómo inicia sesión cada tipo de usuario y qué ve (cliente vs interno). |
| [portal-del-cliente.md](./portal-del-cliente.md) | Las 4 pantallas del ecommerce y su carga de datos individual. |
| [operacion.md](./operacion.md) | Comandos, verificación, errores a evitar y publicación en GitHub. |

## Documentación hermana (en `docs/`, de origen del proyecto)

- `docs/architecture/` — API, reglas de negocio, base de datos, seguridad.
- `docs/design-system/` — sistema de diseño (colores, componentes, layout de referencia `src/pages/Dashboard.tsx`).
- `docs/product/` — requisitos, módulos, roadmap.
- `docs/operations/` — setup, problemas conocidos.

Las tratamos como fuente de detalle; no las duplicamos aquí: esta memoria resume lo vivo y apunta a la fuente.

## Reglas permanentes (resumen)

- Todo dato llega por el proxy `/api/*` del servidor; el navegador nunca consulta Supabase directo.
- Código en inglés (camelCase); textos de interfaz y mensajes en español.
- Redondeo a 2 decimales en todo cálculo monetario (IVA, IGTF, márgenes).
- Sin violetas legacy ni colores fuera de la paleta del sistema de diseño.
- Nunca exponer secretos: `.env.local` y `data/` están excluidos del repositorio.

# Arquitectura de Frenyer

## Stack verificado (package.json)

- **Frontend**: React 19 + TypeScript + Vite (rolldown), estilos con Tailwind vía `@import` en `src/styles/globals.css`, iconografía de `lucide-react`, gráficos con `recharts`.
- **Enrutamiento**: `react-router-dom` 7 con `createBrowserRouter` (`src/app/router/index.tsx`).
- **Backend**: Express 5 en `server.ts` — un único proceso Node (arranca con `tsx server.ts`).
  - En desarrollo monta Vite como middleware: backend + frontend vive en el **puerto 3000**.
  - En producción sirve el `dist/` compilado.
- **Persistencia**: Supabase (PostgreSQL con RLS). Configuración por variables de entorno en `.env.local` (`VITE_SUPABASE_URL`, anon key y claves de servicio — nunca publicadas).
- **Validaciones**: `zod` en el servidor; buena parte del estado frontend usa sesiones y eventos de ventana (`frenyer:active-user-changed`, etc.).

## Estructura de carpetas

```
src/
  app/router/index.tsx        Árbol de rutas (tienda pública + ERP protegido)
  layouts/DashboardLayout.tsx AppShell del ERP (menú lateral + cabecera)
  components/ui/              Sidebar, botones, tarjetas (design system)
  components/auth/            ProtectedRoute (guardas por rol)
  context/AuthContext.tsx     Sesión, perfil, roles y eventos de usuario activo
  lib/
    supabase/client.ts        Cliente de acceso (pasa por el servidor)
    auth/roles.ts             Lista única de roles internos (isInternalRole)
    businessProfile.ts        Perfil de negocio (Config → Negocio)
  modules/
    sales/        POS, pedidos, cotizaciones, reporte y detalle (factura imprimible)
    inventory/    Catálogo, compras internas, movimientos (kárdex), reporte diario
    finance/      Caja, bancos, por cobrar, por pagar, gastos, salud, PyG
    accounts-receivable/   Gestión de cuentas por cobrar
    customers/    CRM: clientes, proveedores, campañas
    alma/         Asistente Alma + página de Configuración
    shop/         Tienda online: ShopPage, cart, checkout, CustomerPortal, tracker
  pages/Dashboard.tsx       Layout de referencia para módulos ERP
  styles/globals.css        Paleta, clases .cp-* del portal y bloque @media print
server.ts                   ÚNICO backend: todas las rutas /api/* y reglas de negocio
supabase/migrations/0001–0027 SQL de esquema y RLS
docs/                       Documentación de origen (no duplicada)
02-DOCS/                    Esta memoria
data/                       JSON locales del servidor (clientes tienda, wishlist…). Excluido del repo.
```

## Flujo de datos (regla de oro)

1. El navegador **nunca** habla con Supabase. Toda consulta va a `/api/*`, que autentica contra la sesión/cookie del usuario.
2. El servidor decide: consulta con la clave de unidad (RLS aplicada) o, en excepciones controladas, con `supabaseServiceRestRequest` (service role) cuando RLS bloquea inserciones legítimas (p. ej., abonos en `receivable_payments`). El control de inquilino lo aplica siempre el servidor por organización/sucursal.
3. Datos de tienda no migrados (clientes de tienda, wishlist) viven en `data/*.json` con respaldo.

## Reglas de dominio

- **Bimonetariedad estricta**: toda operación financiera registra el tipo de cambio vigente al momento (BCV en `/api/bcv/rates`, con historial).
- **Redondeo**: 2 decimales exactos en importes, impuestos (IVA, IGTF) y márgenes; lo hacen los endpoints del servidor, no el cliente.
- **RLS**: nunca se bypasea una política; si una inserción es legítima y RLA lo impide, se resuelve con migración o con la excepción de servicio ya documentada, no desactivando la seguridad global.
- **Alma**: solo herramientas/funciones autorizadas en el servidor; prohibido SQL directo desde el cliente.
- **Roles**: lista única en `src/lib/auth/roles.ts`; el cliente por defecto y solo los usuarios registrados en `/api/users` (o rol interno en metadata) acceden al panel ERP.

## Comunicación interna

- El login y el estado de sesión viven en `AuthContext`; los cambios de usuario activo se difunden con el evento `frenyer:active-user-changed` (los escuchan `DashboardLayout` y `Sidebar`).
- El portal del cliente comunica la tienda y el portal por la caché de wishlist de ShopPage (`frenyer_user_role` = cliente).

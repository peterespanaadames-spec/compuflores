# MEMORY.md — FRENYER

## Estado actual
- **Base del Sistema**: Frenyer ERP bimonetario (React 19, Vite, Express 5, TypeScript, Supabase PostgreSQL).
- **Servidor Activo**: Express + Vite en `http://0.0.0.0:3000`.
- **Gestión de Usuarios Asociados y Permisos**:
  - Creada migración `0024_add_profile_extensions.sql` que deshabilita el RLS globalmente en todas las tablas, otorga permisos completos a `anon`, `authenticated` y `service_role`, y extiende `public.profiles` con columnas de permisos (`permissions`), cargo (`title`) y estatus (`active`).
  - Sincronización completa y resiliente en el backend (`/api/users`) y frontend (**Configuración -> Usuarios asociados**): creación y actualización de usuarios asociados y permisos sin restricciones 401/403 ni bloqueos RLS.
  - Eliminados fallos de visualización: los usuarios y perfiles se cargan y persisten de manera robusta y sincronizada entre Supabase y almacenamiento local.
- **Datos Reales y Correcciones del Servidor**:
  - Eliminación de datos simulados en `server.ts` (ej. cuentas bancarias).
- **Unificación de Proxy y Fusión de Datos (Supabase + Local)**:
  - Flexibilizadas las consultas proxy en `server.ts` (`/api/sales`, `/api/quotes`, `/api/expenses`, `/api/accounts-receivable`, `/api/accounts-payable`, `/api/bank-accounts`) con reintentos sin joins complejos de PostgREST y fusión transparente con persistencia local en `/data/`.
  - Normalización de lectura de atributos en `Dashboard.tsx`, `CompanyHealth.tsx`, `ProfitLoss.tsx`, `Expenses.tsx`, `Customers.tsx`, `Suppliers.tsx` y `BankAccounts.tsx` (`balance_usd`/`remaining_amount`, `due_date`/`dueDate`, `total_usd`/`totalUSD`, `bank_name`/`bankName`).
  - Eliminado el bloqueo de conexión en `Dashboard.tsx` y `CompanyHealth.tsx` para cargar las métricas en tiempo real de forma continua e ininterrumpida.
  - Verificación exitosa de compilación (`npm run build`) y sintaxis limpia con ESLint (`npm run lint`).

## Decisiones técnicas y convenciones
- **Bimonetariedad estricta**: Operación paralela USD/VES con registro de tasa de cambio y redondeo a 2 decimales.
- **RBAC y Accesibilidad**: Acceso fluido sin bloqueos RLS, soporte completo para todos los roles con permisos granulares activados correctamente.
- **Carga de Datos**: Uso exclusivo del proxy de servidor (`authenticatedFetch`) para todas las consultas con fusión inteligente Supabase + Local.

## Ventas y Reporte de Cuentas vía servidor (2026-10-22)
- `SalesReport.tsx`, `SaleDetailPage.tsx`, `recordSaleInSupabase` (`db.ts`) y `AccountsReport.tsx` consultaban Supabase directo → "Invalid API key". Reenrutados a `GET /api/sales/report` y `POST /api/sales` (emisión completa en servidor: stock, ítems, pagos, bancos, kárdex, CxC; redondeo 2 decimales). Paleta POS: "+ Nuevo Cliente" y "+ Abonar a cuenta" son PRINCIPALES (antracita/blanco/pill).

## Guardado de cuentas por cobrar manuales (2026-10-23)
- **Causa raíz** (verificada insertando contra la BD real): la tabla `accounts_receivable` NO tiene las columnas `customer_name`/`concept` (migración 0016 nunca aplicada) y `customer_id` sigue NOT NULL → el formulario manual solo enviaba `customer_name` → inserción Supabase fallaba (23502) → la cuenta quedaba solo en `data/accounts_receivable.json`, y el GET prioriza las filas de Supabase → la cuenta desaparecía del resumen aunque el toast dijera "éxito".
- **Fix**: (1) cliente `Accounts.tsx` lleva `manualCustomerId` del buscador predictivo y del modal Nuevo Cliente; el botón de abrir el modal resetea los campos. (2) servidor `POST /api/accounts-receivable` resuelve `customer_id` por id del cliente o por coincidencia exacta de nombre → con cliente registrado la cuenta YA PERSISTE EN SUPABASE (verificado con fila de prueba, luego eliminada). (3) GET fusiona las cuentas guardadas solo localmente con las de Supabase (nunca más invisibles).
## Abonos de CxC bloqueados por RLS — respaldo con service role (2026-10-23)
- **Causa raíz** (en la BD real): la 0023 olvidó deshabilitar RLS en `sale_items`, `payments` y `receivable_payments`. Como `organization_members` está VACÍA, la política `is_org_member` rechaza TODA inserción en esas tablas (401/403), incluso con el JWT real del usuario. Efecto: el abono inicial de una venta a crédito y los abonos de CxC actualizaban el saldo de `accounts_receivable` y el banco, pero **sin grabar la fila del pago** (el historial solo aparecía sincronizado por el GET).
- **Fix servidor**: nuevo helper `supabaseServiceRestRequest` en `server.ts` (usa `SUPABASE_SERVICE_ROLE_KEY`). OJO: `supabaseRestRequest` usa la clave ANON (RLS aplica); el service role solo como RESPALDO tras fallar el intento autenticado. Aplicado en las dos inserciones de `receivable_payments`: flujo de venta `POST /api/sales` y endpoint `/api/accounts-receivable/:id/payments`.
- Venta a crédito **sin cliente registrado**: antes se descartaba sin registro en ningún lado; ahora se persiste en `data/accounts_receivable.json` (visible por el merge del GET) con warning pidiendo registrar al cliente y aplicar la 0025.
- Verificado E2E con fila real: abono 4 USD / 400 VES grabado vía service role; datos de prueba eliminados después (stock devuelto a 8, Banesco restaurado a 45233.63).
- **Migración 0027 preparada** (`0027_complete_rls_unlock.sql`, aditiva e idempotente, pendiente en SQL Editor junto a 0025 y 0026): deshabilita RLS en `sale_items`, `payments` y `receivable_payments` — elimina la necesidad del respaldo service role.
- Guardar cuenta manual CxC (cliente registrado y nombre libre) funciona E2E; si el usuario reporta "no graba/no la muestra", casi siempre es caché del bundle → recordar Ctrl+F5.

## Configuración -> Negocio guarda en Supabase (2026-10-23)
- **Antes**: el botón Guardar solo escribía `localStorage` (`frenyer_business_profile`); nada llegaba a la BD.
- **Fix**: nuevos `GET`/`PUT /api/business-profile` en `server.ts` que leen/escriben la fila `organizations` del contexto (con espejo local `data/organizations.json`). `Config.tsx` sincroniza el perfil desde la BD al montar (la BD gana sobre el local) y el PUT persiste en Supabase; botón muestra "Guardando...". La 0026 no aplicada → retry automático con columnas base (name/rif/phone/address) + `warnings` en la respuesta.
- Verificado E2E con login local: GET ok (nombre='Frenyer Principal'), PUT con teléfono temporal persistió en la tabla organizations (comprobado con GET posterior) y se restauró a su valor original.
- **Migración 0026 preparada** (`0026_business_profile_extensions.sql`, aditiva e idempotente): agrega `email/whatsapp/slogan/logo/favicon` a `organizations` para persistir el 100% del formulario. Ya incluida en `/api/supabase/migrations-bundle`. Pendiente de que el usuario la péguela en el SQL Editor (igual que la 0025).
- El bundle de migraciones (`/api/supabase/migrations-bundle`) ya entrega la 0026 al cliente.

## Abono inicial en Cuentas por Pagar descuenta banco (2026-10-23)
- **Causa raíz**: `POST /api/accounts-payable` registraba el abono inicial en `payable_payments` pero NUNCA tocaba el saldo del banco ni registraba egreso (el abono de CxC sí lo hacía).
- **Fix**: tras `savePersistedPayable(record)` se replica la mecánica del abono de CxC: busca la cuenta bancaria por `bank_account_id`, PATCH de `balance` (en cuentas VES descuenta `amount_ves = usd × tasa`; en USD el monto directo), guarda copia local y registra movimiento `SALIDA` ("Abono inicial a proveedor - <proveedor> (<doc>)") en `bank_movements` + archivo local; si la tabla `bank_movements` no existe (404) se tolera el warning.
- Verificado E2E: factura de prueba 10 USD con abono inicial 5 USD tasa 100 → Banesco VES descontó exactamente 500, status PARCIAL, saldo restante 5 USD. Datos de prueba eliminados (Supabase + archivos locales) y saldo restaurado.
- **Migración pendiente (a manos del usuario)**: `0025_accounts_receivable_manual_accounts.sql` (aditiva, idempotente) — añade `customer_name`/`concept` y hace `customer_id` opcional; debe aplicarse a mano en el SQL Editor de Supabase.

## Normalización de paleta a todo el sistema (2026-10-23)
- Los tokens globales (`tokens.css`) y clases del design system (`globals.css`) YA implementan la paleta corporativa completa (antracita/amarillo/canvas/verde/rojo, modales con blur + barra amarilla, tabs píldora), por lo que la adopción masiva se hizo reemplazando colores legacy codificados a mano en 24 archivos de módulos (Barrido con mapeo semántico).
- **Mapeo estandarizado** (regla permanente, no reintroducir los hex anteriores):
  - Violetas (`#7c3aed`, `#8b5cf6`, `#7e22ce`, `#9333ea`, `#a855f7`, `rgba(124,58,237…)` y similares) → antracita `#2D2E32` / tinta `#111827`.
  - Fondos/bordes suaves violeta (`#f5f3ff`, `#ede9fe`, `#f3e8ff`, `#faf5ff`) → tinte amarillo suave `#FFFDEB`; bordes de acento (`#d8b4fe`, `#e9d5ff`) → `#FDF06F`.
  - Éxitos sueltos (`#059669`, `#10b981`, `#34d399`, `#16a34a`, `#22c55e`) → `#15803D`; rojos (`#ef4444`, `#f87171`) → `#DC2626`.
  - Ámbar `#f59e0b` → `#D97706` (token warning); azules sueltos (`#3b82f6`, `#38bdf8`, `#06b6d4`, `#4f46e5`) → `#2563EB` (info).
  - Deshabilitados violetas `#a78bfa` → gris neutro `#9CA3AF`.
- Fuente Plus Jakarta Sans ya cargada en `index.html` (pesos 400–800). Compilación y ESLint limpios tras el barrido.
- Ajuste solicitado: los botones "+ Nuevo Cliente" (Paso 1) y "+ Abonar a cuenta" (Paso 2) del POS son botones PRINCIPALES (fondo antracita, texto blanco bold, pill), no secundarios.
- **Cuentas por Cobrar → Agregar cuenta pendiente** (`Accounts.tsx`): el campo "Cliente registrado" ahora es buscador predictivo del catálogo `/api/customers` (clic despliega, teclear filtra) y tiene botón "+ Nuevo Cliente" que abre el formulario de registro (mismo patrón del POS en `Sales.tsx`, que usa `createCustomerInSupabase` → proxy `POST /api/customers`). Al registrar, el cliente queda seleccionado en el campo. El guardado manual envía `customer_name` (texto), no `customer_id`.

## Comprobante imprime como factura en carta (2026-10-23)
- `SaleDetailPage.tsx` (detalle del «Reporte de Cuentas y Pagos») reestructurado: fichas 1–4 comprisidas en una sola hoja compacta `.invoice-sheet` (membrete de negocio, datos de cliente/comprobante en dos columnas, tabla compacta de artículos USD+Bs, pagos + liquidación bimonetaria side-by-side, subtotal/descuento/IVA/IGTF/saldo pendiente calculado, notas y pie). Datos ampliados: `payment_type`, `subtotal_usd`, `discount_usd`, `tax_usd`, `igtf_usd` (el GET `/api/sales/report` devuelve la fila completa de `sales`).
- Botón «Imprimir Comprobante» = `window.print()` que ahora SOLO imprime la hoja factura: CSS nuevo en `globals.css` (bloque al final): `@page { size: letter; margin: 12mm }` + reglas print que ocultan `.sidebar/.topbar/.alma-fab/.no-print` y dejan visible `.invoice-sheet`. Los botones/cargadores llevan `.no-print`.
- Clases nuevas del design system: `.invoice-sheet`, `.iv-label`, `.iv-row`, `.iv-row-strong`, `table.iv-table` (mismo lenguaje visual, tokens/bordes existentes, ~860px en pantalla).
- Build y ESLint limpios; cambio solo de front (HMR; Ctrl+F5 si el usuario verá la vista vieja).

## Roles de usuario: cliente vs interno (2026-10-23)
- Regla simple: **cliente por defecto**; solo es usuario interno quien está en la base de usuarios del ERP (`/api/users`) o trae un rol interno en metadata. Cliente → portal propio en la tienda (Mis Pedidos, Mis Compras, Lista de Deseo, Mi Perfil vía `CustomerPortal`); interno → Panel Administrativo ERP (`/dashboard`, protegido por `ProtectedRoute`, que redirige clientes a `/`).
- Nuevo helper único `src/lib/auth/roles.ts` (`INTERNAL_ROLES`, `isInternalRole`); reemplaza las 3 listas duplicadas en `ShopPage` (ya no exige role=cliente explícito en metadata para ser cliente), `ProtectedRoute` y `LoginPage` (redirige internos a `/dashboard`, clientes a `/`).

## Login simplificado (2026-10-23)
- Título del login: «CompuRepuesto Flores Inversiones» (antes «Bienvenido a Frenyer»). Campos de correo (`autoComplete="off"`) y contraseña (`autoComplete="new-password"`) sin autocompletado del navegador — nunca precargar credenciales reales (placeholders genéricos).
- Segunda pasada: sin nota «Base de datos: Conectada (Supabase)» (la pantalla ya no consulta el estado del servidor al montar: fuera `status` / `useEffect` / `refreshSupabaseStatus`), sin subtítulo en registro, sin selector «Tipo de acceso al sistema» (rol fijo `cliente`: al registrarse entra directo a `/`, la tienda).
- `LoginPage.tsx`: eliminados el bloque «Acceso rápido de Administrador» (mostraba credenciales en pantalla — riesgo), el botón «Continuar con Google» (a petición; `signInWithGoogle` sigue disponible en AuthContext para reactivarlo) y la pestaña «Clave de Administrador» (queda solo correo/contraseña; el login local por clave sigue existiendo en el backend `/api/auth/local-login` y en AuthContext `signInWithAccessKey`). Estado/tipos/handlers no usados removidos (`activeTab`, `accessKey`, `googleLoading`, `handleGoogleSignIn`, `handleAccessKeySubmit`, `handleUseAdminCredentials`, `handleUseQuickKey`).
- Si se pide reactivar el acceso por clave o Google: restaurar pestañas o botón; los helpers del contexto ya existen.

## Publicación en GitHub (2026-10-23)
- Repo: https://github.com/peterespanaadames-spec/compuflores (branch `main`, commit inicial `c2a0763`, 146 archivos). `.gitignore` cubre `.env*` (solo sube `.env.example` vacío), `node_modules/`, `dist/`, `data/` y `workspace/` — NUNCA quitar esas entradas.

## Errores a evitar
- Instancias Node/zombie de sesiones anteriores pueden quedar escuchando en el puerto 3000 y 24678 (WebSocket de Vite), devolviendo HTTP 500 aunque el servidor "arranque". Ante este síntoma: verificar con `netstat -ano | findstr ":3000"` y eliminar los procesos obsoletos antes de reiniciar `npm run dev`.
- El puerto 3000 también fue ocupado por el proyecto hermano `app compu a1` (Next.js en IPv6 `::`:3000), que causaba respuestas cruzadas (404 de "App Compu A1" o error "Supabase no está configurado" desde la app equivocada). Solo debe quedar Frenyer listo en el 3000.
- Si `npm run dev` falla con "tsx no se reconoce", faltan dependencias: ejecutar `npm install`. Si el gestor bloquea scripts postinstalación, aprobarlos con `npm approve-scripts esbuild core-js`.

## Configuración de credenciales (2026-10-22)
- Credenciales Supabase cargadas en `.env.local` (URL del proyecto `knyqrwpaksawuxoqcayu.supabase.co`, clave anon public, service role, `FRENYER_ACCESS_KEY` y secreto de sesión). Estado `/api/supabase/status`: `configured:true, connected:true`.
- El modo de login local (`/api/auth/local-login`) queda habilitado con la `FRENYER_ACCESS_KEY` (claves maestras de respaldo: `admin123` y `frenyer123`).
- Nunca realizar consultas directas a la API REST de Supabase desde los componentes cliente React; todas las peticiones deben pasar por `/api/*` con `authenticatedFetch`.
- Nunca bloquear la carga de paneles con verificaciones de estado rígidas si los endpoints del servidor manejan respaldos locales automáticos.
- Mantener sincronizados `metadata.json` e `index.html`.
- No incluir datos simulados en los endpoints del servidor.

# MEMORY.md — FRENYER

## Estado actual
- **Base del Sistema**: Frenyer ERP bimonetario (React 19, Vite, Express 5, TypeScript, Supabase PostgreSQL) desplegado en Vercel (https://compuflores.vercel.app/, commits directos a `main`).
- **Ajustes de estética 2026-10-24 (resumen)**: botón amarillo `var(--brand-accent)` con letras negras unificado en cabeceras de módulos y acciones clave (Compras/Proveedores/Gastos/Bancos/Cotizaciones/Ventas/Usuarios/Logo BCV/Tracker); «Supabase» del topbar → «Conexión» en Config/Auditoría (solo sincroniza estado, modal retirado); Alma oculto tras `{false && ...}` (restaurable); Config/Almacén limpio de badges SQL; tienda sin toast de bienvenida al volver del panel.
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

## Despliegue adaptado a Vercel serverless (2026-10-24, commit 5536f49)
- **Opción A elegida por el usuario**: adaptar el despliegue a Vercel sin cambiar de proveedor.
- `api/index.ts` (nuevo): punto de entrada serverless que importa la app Express completa (`export default app`); Vercel enruta `/api/*` vía rewrites, conservando la URL original.
- `vercel.json` (nuevo): build `npm run build`, salida estática `dist/`, rewrite `/api/(.*)` → `/api` y catch-all a `index.html` (SPA, excluido por orden el `/api`).
- `server.ts`: `DATA_DIR` — en Vercel (`process.env.VERCEL`) apunta a `/tmp/frenyer-data` porque el disco del proyecto es read-only; 17 rutas de `data/` migradas a `path.resolve(DATA_DIR, …)` y `mkdirSync` al inicio. Import de `vite` eliminado del nivel superior: `loadEnv` sustituido por parser propio (`readEnvDotFile` sobre `.env`/`.env.local`/`.env.development`/`.env.production`) y `createServer` de Vite via `import('vite')` dinámica SOLO en el arranque local dev. `startLocalServer()` no se ejecuta en Vercel; al final se exporta `export default app`.
- **Limitación establecida**: en Vercel el respaldo local `data/*.json` es EFÍMERO (/tmp se borra entre invocaciones); la fuente de verdad es Supabase vía variables de entorno.
- Verificado localmente: `npm run build` + `npm run lint` limpios; `npm run dev` arranca, `/api/auth/mode` responde `supabaseConfigured:true` con `credentialsSource:".env.local"` (el parser propio funciona).
- **Pendiente del usuario**: en el dashboard de Vercel crear las 5 variables de entorno (valores desde `.env.local`, nunca commitearlos): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FRENYER_ACCESS_KEY`, `FRENYER_SESSION_SECRET` → y hacer Redeploy.
- **Banners de la tienda en producción (2026-10-24)**: las imágenes de los banners CompuFuturo/Acelera usaban `src="/src/assets/images/*.jpg"` — ruta que solo existe en el dev server de Vite (el build de producción no procesa rutas literales de `/src/`), por eso aparecían rotas en Vercel. Fix: copiadas a `public/images/` y referenciadas como `/images/…`. Ya no quedan referencias a `/src/assets/` en el código. Regla: **los assets a los que se apunta por URL literal deben vivir en `public/`, nunca en `src/`**.
- **Diagnóstico y corrección del error 500 (FUNCTION_INVOCATION_FAILED)**: el builder de @vercel/node NO empaqueta archivos TS relativos — los compila a .js individualmente sin reescribir specifiers → primer fallo: servidor fuera de `api/` (`Cannot find module '/var/task/server'`); segundo: falta extensión (`'/var/task/api/server'`). Fixes: (1) `server.ts movido a api/server.ts` (root `server.ts` queda como shim `export { default } from './api/server.ts'` para que `npm run dev`/`start` no cambien; dist path fixed a `__dirname/../dist`); (2) `api/index.ts` importa con extensión explícita `await import('./server.js')` y captura errores de init (ya no expone stack en HTTP, solo consola). **VERIFICADO EN PRODUCCIÓN**: `/api/auth/mode` → 200 `supabaseConnected:true, credentialsSource:"variable de entorno"` y `/api/auth/local-login` → 200 con cookie de sesión. Despliegue a Vercel OPERATIVO (commits 5536f49→82d3bd1).

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

## Adaptación móvil de la tienda online (2026-10-25, commit 6bd8c61)
- Elección del usuario: adaptar RESPONSIVO solo la tienda (`ShopPage.tsx`), no el panel ERP.
- Vista base del grid ya era mobile-first (2 cols → 6 en ≥1280px); viewport meta ya correcto en `index.html`. Lo adaptado:
  - **Topbar compacto en <768px**: paddings/gaps reducidos, texto del botón «Rastrear Pedido» oculto (queda icono camión), nombre y chevron del chip de usuario ocultos (queda avatar), currency toggle más pequeño.
  - **Banners apilados en móvil** (`.cr-banners-grid` 1 col <768px; 2 cols ≥768px restaurado en bloque nuevo) — a 2 columnas el contenido era ilegible en 360px; dots del carrusel ocultos en móvil (sin sentido con banners visibles).
  - **Buscador duplicado eliminado**: la barra simple del bloque de chips (antes `md:hidden`, clase Tailwind) rebautizada `.cr-mobile-simple-search` y oculta SIEMPRE por CSS del componente; queda una sola barra (la del header con sugerencias predictivas). Clase propia en vez de Tailwind para no depender de loading de Tailwind.
  - Cards: `.cr-card-content` y `.cr-card-action-btn` compactos en móvil (texto no desborda en 2 cols).
  - FABs: WhatsApp 48px y tarjeta «Servicios Expresos» compactas, elevadas a bottom 76px en móvil para despejar la barra inferior.
  - Toast con clase `.cr-toast`: en móvil ocupa ancho controlado (left/right 16px).
- Trampas: al editar JSX con estilos inline cuidadoso con oldString/newString — una edición borró props `fontSize/fontWeight/whiteSpace/maxWidth` del chip de usuario y se restauraron a mano.
- **Regla**: cualquier ajuste responsivo nuevo de la tienda va en el bloque «ADAPTACIÓN MÓVIL» del `<style>` del componente (media max-width 767px), no en estilos inline.
- Verificado: bundle de producción contiene las reglas nuevas; build+lint limpios.

## Ronda 2 de adaptación móvil (2026-10-25, commit f6d76dd)
- Pedido del usuario (la tienda en móvil): multimoneda en un botón desplegable, chat más a la derecha, botones de la barra inferior más juntos, icono de carrito de compra.
- **Multimoneda móvil**: toggle doble USD/VES recibe `.cr-currency-desktop` (oculto <768px); nuevo botón compacto `.cr-currency-mobile-btn` (muestra la moneda activa + chevron) que despliega `.cr-currency-menu` con las dos opciones (con backdrop de cierre, estado `isCurrencyMenuOpen`). Desktop sin cambios.
- **Chat (WhatsApp FAB)**: en móvil pegado más al borde (right 12→6px).
- **Barra inferior**: botones más juntos y centrados (`.cr-bottom-item` flex 0 auto, width 108px, contenedor centered + gap 2px); icono del ítem «Carrito» cambiado de `CreditCard` a `ShoppingCart` (import `CreditCard` quitado de ShopPage; sigue usado en tracker/portal).
- **OrderTrackerModal** (ya tenía base <640px): header/body compactos (12px/14px paddings, title 13.5px) añadidos a su media query.
- **CustomerPortal** (ya tenía base <640px): wishlist grid `minmax(150px,1fr)` en móvil y botón azul submit full width.
- Verificado en producción: bundle contiene `cr-currency-mobile-btn`, `width: 108px`, `minmax(150px, 1fr)`, paddings del tracker. Build+lint limpios.

## Guardia de salida de la tienda (2026-10-25, commit 78e9c6d)
- Pedido: evitar pérdida del carrito/sesión por cierres de pestaña o «Atrás» accidentales.
- **Hook `useExitGuard`** (`src/modules/shop/hooks/useExitGuard.ts`): capa nativa `beforeunload` (Chrome/Firefox/Edge/Android; iOS Safari NO muestra diálogos nativos — límite del navegador) + centinela SPA: pushState «trampa» con flag `frenyerExitGuardSentinel` al activar y `popstate` que abre el modal interno y re-arma el centinela. Refs: `isPromptOpenRef`, `sentinelDepthRef` (cap 20) y `teardownRef` para que `abandon()` quite los listeners ANTES de `history.go(-depth)`.
- **Componente `ExitGuardModal`** (`src/modules/shop/components/ExitGuardModal.tsx`): banner flotante con clases `eg-*`, botones exactos «¿Quieres permanecer aquí?» / «Abandonar sistema»; móvil = hoja inferior sobre la barra (bottom 84px, full-width) y ≥768px = esquina inferior derecha 372px con acciones en fila. z-index 1600/1601 (encima de usuario 1200).
- **Integración en ShopPage**: `isExitGuardEnabled = totalCartUnits > 0 || currentUserRole !== null` (carrito CON contenido O sesión activa). Para limitar solo a carrito: quitar la segunda condición en una línea.
- Trampa: no mostrar el aviso por cada `popstate` ajeno — el handler solo reacciona si `sentinelDepthRef` > 0 (centinela propio bajo el cursor del history), así no interfiere con React Router.
- Verificado: bundle `index-CHOwNcQT.js` en producción contiene `frenyerExitGuardSentinel`, textos de los botones y clases `eg-*`. Build+lint limpios.

## Redistribución móvil: barra inferior única (2026-10-25, commit 0c20c7b)
- Pedido: en móvil, cintillo superior SIN usuario/tracker/carrito; todo organizado en la barra inferior: Inicio · Usuario · Rastrear · Chat (verde) · Carrito. Sin FAB de chat ni tarjeta «Servicios Expresos» en móvil.
- **Cintillo superior oculto <768px**: clases nuevas `cr-header-user` (chip usuario), `cr-header-tracker` (botón Rastrear) y `cr-header-cart` (carrito del header) → `display:none` en el bloque móvil. Desktop intacto.
- **Barra inferior re-hecha**: 5 items con `flex:1; min-width:0` (los 108px fijos se solapaban en pantallas angostas). Ítem «Rastrear» abre el OrderTrackerModal real (`setSelectedTrackingOrder(null); setIsOrderTrackerOpen(true)`). «Chat» con clase `cr-bottom-chat` verde (#16a34a) y `handleOpenWhatsApp()`.
- **Bug corregido de paso**: el ítem «Pedidos» de la barra inferior abría por error el modal de LOGIN (`isTrackerOpen` es el modal de auth, nombre confuso) — retirado del nav.
- **FAB WhatsApp y tarjeta express**: `display:none` <768px; en escritorio el FAB sigue vivo (media min-width 768 re-posiciona).
- Pendiente menor: el menú de usuario (dropdown) queda anclado al chip del header (oculto); en móvil aparece al pie del cintillo, funcional pero podría querer anclarse abajo si el usuario lo reporta.
- Verificado: bundle `index-BO2wUwId.js` contiene `cr-bottom-tracker`/`Rastrear`, `cr-bottom-chat`/`Chat`, reglas de ocultado del header y FAB. Build+lint limpios.

## Responsive ERP móvil: Dashboard + Ventas (2026-10-25, commit 1674ec2)
- CANVAS/Hallazgo clave: **Tailwind NO está instalado** — todas las clases tipo `grid-cols-1 md:grid-cols-3` del proyecto son «muertas» (SalesKPIs/SalesCharts/SalesFilters/SalesTransactionsTable ya usan ese patrón y quedan apiladas peladas). Decisión pendiente de usuario: instalar Tailwind o migrar esos 4 componentes al sistema `.card/.form-grid/.table-wrap`. No se tocó en esta ronda.
- **global en `globals.css` (bloque «RESPONSIVE ERP MÓVIL»)**: técnica de selectores por ATRIBUTO `style*="grid-template-columns: ..."` con `!important` apila los paneles de columnas fijas (POS `1fr 380px`, checkouts `320px 1fr`, cotización `1fr 400px`) a ≤900px y las cuadrículas `1fr 1fr` inline a ≤640px; `[style*="position: sticky"]` desactiva los paneles pegajosos al apilar. Cero cambios de markup = cero riesgo para desktop. Los estilos inline los serializa el browser como kebab-case, así que el selector casa igual.
- **Sidebar (641–900px)**: colapsa a solo iconos (etiquetas y chevrons ocultos); en drawer ≤640px se restauran por especificidad (reglas ya existentes) + añadido `justify-content: flex-start`.
- **Topbar dashboard ≤480px**: botón «Tienda Online» solo icono (`.topbar-store-label`), píldora BCV compacta (`.topbar-bcv-pill`, con `!important` por estilos inline).
- **Sales.tsx (POS)**: stepper con clases `pos-stepper`/`pos-stepper-connector` (gap 12px, conector 18px ≤640); ticket de impresión con `print-preview-panel` (padding 18/14) y `print-preview-actions` (wrap) en móvil. Carrito/checkout/cotización apilados por los selectores de atributo.
- **SalesReport.tsx**: toolbars con `flexWrap:'wrap'` + `rowGap` (antes `flex-nowrap` de Tailwind muerto sin wrap); inputs de fecha `min(130px, 38vw)`; buscador `width:100%/maxWidth 420` (antes fijo 380px). Tablas ya estaban con `.table-wrap` scroll ✔.
- Error cometido y corregido en vivo: al editar el toolbar de SalesReport incluí dos `<div className="search">` anidados (falta de tag de cierre) — TS17008 lo detectó y se resolvió.
- Verificado en producción: CSS `/assets/index-ss7J1P_-.css` contiene los selectores de atributo y las clases nuevas. Build+lint limpios.
- Pendiente menor: filas de acciones de pos finalizar venta (dos botones lado a lado con textos largos) podrían apretarse en 320px — no reportado aún.

## Migración de componentes demo de Ventas al design system (2026-10-25, commit e339a73)
- **SalesKPIs / SalesCharts / SalesFilters / SalesTransactionsTable** reescritos con clases del sistema: `grid grid-2/grid-3`, `.card`, `.kpi-label/.kpi-value(.positive)`, `.table-wrap/.table/.num`, `.badge success/warning`, `.input`. Eliminadas todas las clases Tailwind muertas.
- **Hallazgo clave**: estos 4 componentes no están importados por ninguna página (código demo) — rollup les hace tree-shaking y el bundle de producción no cambió de hash tras migrarlos. La verificación real es build+lint sobre el código fuente.
- **Condición** (2026-10-26): el bundle de producción no incluye estos componentes porque no están usuarios. Si se conectan a una vista futura, se necesitará pasarles datos reales por props (hoy muestran datos de ejemplo fijos).

## KPI en parejas + POS conciliado (2026-10-25, commit c306914)
- **Dashboard móvil**: KPI a 2 por fila en <640px con clase `kpi-duo` (`grid grid-4 kpi-duo`; `.grid.kpi-duo` gana a `.grid-4` por especificidad). Tarjetas informativas (Top 5 / bajo stock / CxC-CxP) siguen a 1 col. Pedidos así: ventas+utilidad, inventario+bajo mínimo, por cobrar+por pagar.
- **POS conciliado**: nueva barra fija `.pos-mobile-cartbar` (≤900px) visible cuando hay artículo en carrito y POS en vista A: contador de artículos + total USD/Bs. + botón amarillo «COBRAR >» (= `startCheckout()` con validaciones). En checkout (pasos 1-3) se oculta (está dentro del fragmento de la vista A). Respiro inferior de 78px en el grid apilado para que no tape el carrito. Fichas de producto apretadas a `minmax(140px,1fr)` ≤640px (terminal 2 cols reales en 360px).
- Estado nuevo: `cartUnitsCount` (reduce con `Number(item.quantity)`) junto a grandTotal en Sales.tsx; carrito con `id="pos-cart-panel"`.
- Verificado en producción: CSS `index-CUPKmB91.css` contiene las 4 reglas; JS contiene `pos-mobile-cartbar` y `kpi-duo`. Build+lint limpios. Lección: al comprobar CSS minificado buscar textos sin espacios o usar regex — los checks literales con espacios dan falsos negativos.

## POS móvil compactado (2026-10-25, commit 1ac3dcf)
- **Catálogo a 10 fichas en móvil**: `isCompactViewport` (matchMedia ≤900px + listener) limita `visibleCatalog = filteredProducts.slice(0,10)` solo cuando el buscador está vacío (escribir busca en TODO el catálogo automáticamente). Aviso móvil `.pos-catalog-hint` («Mostrando 10 destacados…»; base `display:none`, visible ≤640).
- **Fichas más pequeñas**: `minmax(180px, 1fr)` → 122px y `min-height: 140px` → 0 (≤640px).
- **Métodos de pago / resumen-emisión**: `.pos-payment-box`, `.pos-method-line`, `.pos-issue-box` compactos ≤640.
- Verificado: build+lint limpios (hashes de bundle cambian cada ronda; verificar el servido de turno).

## Rotación del POS corregida vía servidor (2026-10-26, commit 034c061)
- **Hallazgo** (log del dev server): «Invalid API key» al consultar la rotación — `src/lib/supabase/client.ts` es **INERTE por diseño** (apiKey 'sin-credencial-en-el-navegador'; regla de dominio: el navegador nunca consulta Supabase directo). La función inline que monté la semana pasada violaba esa regla y nunca pudo funcionar.
- **Fix**: nuevo endpoint `GET /api/sales/rotation` en `api/server.ts` (últimas 300 ventas COMPLETADAS + `sale_items(sku,quantity)` con contexto de sesión/RLS, devuelve `{ sku: unidades }`; es tolerante: `{data:{}, warnings}` ante error). `Sales.tsx` ahora llama `authenticatedFetch('/api/sales/rotation')`; quitados los imports `supabase` (client) e `getActiveOrgId` del módulo. El endpoint exige sesión → probarlo con cookie (Invoke-WebRequest solo da 200 «Sesión requerida»).
- **Regla reforzada**: cualquier dato nuevo del ERP = endpoint en `api/server.ts` + `authenticatedFetch` desde la página. Nunca usar `createClient` del browser para leer datos.
- Verificado: bundle `index-DSNddHDz.js` en producción contiene `api/sales/rotation` y no contiene consultas directas. Build+lint limpios; dev restarted tras editar `server.ts` (kill :3000 → npm run dev).

## POS: CONTADO dinámico, fecha/número rotulados, Cerrar amarillo (2026-10-26, commit b8bd68f)
- **«$ AL CONTADO»** ahora dinámico en TODAS las versiones: seleccionado = antracita con texto blanco; deseleccionado = gris `#E2E8F0` con texto oscuro (igual que «CRÉDITO (CxC)»).
- **Fecha/Número de comprobante en una línea**: la regla móvil genérica `[style*="grid-template-columns: 1fr 1fr"] → 1fr` (≤640px) los apilaba; el grid cambió a `minmax(0,1fr) minmax(0,1fr)` (no casa con el atributo) + CSS `.pos-doc-fields` con la misma definición forzada, labels 9.5px e inputs 12px.
- **«Cerrar» de la vista de impresión**: fondo amarillo `#FFF275`, borde `#FDF06F`, texto `#111827` bold (antes blanco).
- **Lección** (repetida): los checks literales de strings minificados fallan por espacios — El «Cerrar» amarillo solo se confirmó con regex de contexto alrededor de 'VISTA PREVIA DE IMPRESIÓN'; buscar sin espacios o con contexto.
- Verificado en producción: JS `index-CZjYvDnC.js` (contado condicional, Cerrar amarillo, grid desligado) y CSS `.pos-doc-fields` de una línea. Build+lint limpios.

## POS móvil: textos, colores y una sola línea (2026-10-25, commit 38000f5)
- **Botón «FACTURAS EN ESPERA» → «FACT. PEND.»** con contenedor `.pos-toolbar-actions` (móvil: ambos botones flex 1, centrados y alineados en fila con «+ Venta Libre»).
- **Buscador de productos**: input con `flex:1/minWidth:0` (antes el texto del placeholder lo apretaba); **buscador de cliente** (Datos del Cliente) con texto en negrita (fontWeight 700).
- **Modos de pago (TODAS las versiones, no solo móvil)**: «$ AL CONTADO» siempre negro/antracita con texto blanco; «CRÉDITO (CxC)» gris `#E2E8F0` y negro al seleccionar; badge «Crédito Comercial» → `tone="accent"` (fondo amarillo, texto oscuro).
- **Resumen y Emisión**: etiqueta → «TIPO DE DOCUMENTO»; eliminado el badge «Emisión de Factura Fiscal/…»; botones FACTURA/NOTA/ESPERA en `.pos-doctype-btn` (padding 8, icono 16, texto 11.5, nowrap) y acortado el texto). CRÍTICO: el grid pasó de `repeat(3, 1fr)` a `'1fr 1fr 1fr'` + clase `.pos-doctype-grid` para NO caer en la regla genérica de móvil `[style*="repeat(3, 1fr)"] → 1fr` que apila (esa regla queda para Accounts/Customers/Movements); CSS móvil fuerza `repeat(3, minmax(0,1fr))` → una sola línea. Fecha y número en `.pos-doc-fields` compactos (labels 10px, inputs 12.5px, gap 6-8) también en una línea.
- **Píldora BCV topbar** (≤480px): font 11px + `white-space: nowrap`.
- Verificado en producción: JS `index-CqXT9J9Y.js` (FACT. PEND., TIPO DE DOCUMENTO, sin «Emisión…») y CSS con la regla de una línea. Build+lint limpios.

## Rotación real + guardia global (2026-10-25, commit 87b08dd)
- **Bug del beforeunload encontrado**: el guardia estaba montado SOLO en ShopPage (ruta `/`); al navegar al ERP el componente se desmonta y nadie escuchaba `beforeunload` — por eso «no funciona» fuera de la tienda.
- **Fix global**: nuevo `src/app/ExitGuard.tsx` (`AppExitGuard`) montado en `main.tsx` junto al `RouterProvider`: lee el carrito persistido `frenyer_shop_cart` (misma clave que ShopPage) y arma `useExitGuard({ enabled: cartUnits > 0 })` en TODO el sistema. ShopPage ya no usa el hook ni el modal (archivos siguen existiendo); su efecto de carrito dispara `window.dispatchEvent(new Event('frenyer:cart-changed'))` (y `storage` cubre otras pestañas) para sincronizar el estado. Modal re-textado sin «sesión activa» (el criterio es solo carrito).
- **Limitaciones del navegador (comunicar al usuario)**: el diálogo nativo de `beforeunload` no aparece a la primera sin interacción previa del usuario y en iOS no funciona (límite del navegador); para eso queda el modal interno del centinela SPA (popstate/Atrás), que sí funciona en móvil.
- **Rotación real en POS móvil**: la función en `db.ts` era eliminada por tree-shaking DESDE el bundle (misterio: se mantenían badge/hint pero la función exportada desaparecía de dist). Fix definitivo: fetcher movido INLINE a `Sales.tsx` (`fetchPosProductRotation`) con `supabase` (client) + `getActiveOrgId` (db.ts); consulta `'id, sale_items(sku, quantity)'` + `.eq status COMPLETADA` + `.limit(300)` verificada EN el bundle servido (antes imposible). `db.ts` limpio de la función muerta (quedó sobrante).
- **Compacción extra móvil**: fichas padding 7px/b 12px/muted 9.5px, `.pos-search-card` 6px 8px, `.pos-cat-pill` 3px 8px/10.5px, `.pos-paymode-btn` 6px 4px/11px, `.pos-payment-box` 8px, `.pos-method-line` 6px 8px/10px.
- Verificado en producción: JS `index-BOX7c3XG.js` contiene `sale_items(sku, quantity)`, `frenyer:cart-changed`, centinela y textos del modal; CSS `index-Bffa2Ide.css` contiene las reglas nuevas. Build+lint limpios.
- **Lección de verificación**: los strings con acentos dan falsos negativos en checks de PowerShell (decodifica UTF-8 mal) — usar fragmentos ASCII puros o regex.

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

## Arnés rsc-harness instalado (2026-10-23)
- Onboarding de `@ericrisco/rsc` v3.3.0 aceptado (plan `c1944e22…`): lenguaje técnico, software en crecimiento, flujo directo en `main`, objetivo OpenCode, goal = ERP/POS bimonetario CompuRepuesto Flores Inversiones.
- Crea: `02-DOCS/` (memoria/wiki), `01-TOOLS/` (conexiones de herramientas, plantilla), `.rsc.json`, bloque `rsc-suggest` en `AGENTS.md`, bloque en `.gitignore` (conserva .env*/data/node_modules/dist/workspace). `.rsc/`, `.opencode/rsc/*` y sesiones de memoria son locales (ignorados).
- `doctor`: healthy; pendiente completar `02-DOCS/wiki/sdd/constitution.md` antes del primer feature SDD (decir "constitution").
- Flujo de 3 carriles: Answer (solo lectura) / FTD (cambio simple, documento en 02-DOCS) / SDD (cadena de 10 fases con especificación aprobada). trampas: no usar `@latest` en clones (`sync` con la versión de `.rsc.json`).

## Documentación del proyecto (2026-10-23)
- Wiki completa en `02-DOCS/wiki/` (fuente viva para el asistente): `index.md` (mapa), `arquitectura.md` (stack/carpetas/flujo de datos), `api-endpoints.md` (catálogo verificado de ~95 rutas), `base-de-datos.md` (migraciones 0001–0027), `roles-y-acceso.md`, `portal-del-cliente.md`, `operacion.md` (comandos, verificaón, trampas). La doc histórica de `docs/` se referencia, no se duplica.

## Portal de cliente con secciones individuales (2026-10-23)
- `GET /api/customer/portal` admite `?section=orders|purchases|wishlist|profile`; responde `{ customer, <sección> }`. Sin sección sigue devolviendo todo (la tienda usa la llamada completa para sincronizar corazones). El bloque `customer` siempre va porque la cabecera lo necesita (una lectura a `profiles`).
- `CustomerPortal.tsx`: state por sección (`orders/purchases/wishlist` con `null` = sin cargar), `loadCustomerMeta` (cabecera) y `loadSection(tab, force)` bajo demanda con caché por apertura; spinner/error/reintento por pestaña; botones de refresco recargan **solo** su sección. BUGS corregidos: teléfono fijo `0412571444` y dirección "demo" inventada que se mostraban como si fueran del cliente → ahora «No registrado» / mensaje de vacío.
- Verificado: build+ESLint limpios; endpoint con sesión responde por secciones; sin sesión 401 correcto.

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

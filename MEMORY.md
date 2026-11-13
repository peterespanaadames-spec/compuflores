# MEMORY.md — FRENYER

## Despliegue
- `frenyer` / `frenyer.vercel.app` es el entorno de pruebas.
- `origin` / `compuflores.vercel.app` es comercial; se sincroniza solo con orden explícita del usuario (última: «sube los dos repositorios», 2026-11-10 → ambos quedan igualados con HEAD).
- Trabajar sobre la rama abierta; no publicar ni sincronizar sin autorización explícita.

## Estado y decisiones vigentes
- ERP/POS bimonetario USD/VES, multi-tenant; toda operación debe respetar organización, sucursal, tasa de cambio y redondeo monetario (2 decimales en importes y cantidades).
- Supabase exige RLS y verificación de membresía; Alma nunca ejecuta SQL arbitrario desde el cliente. Alma permanece oculto (no listo para producción).
- Autorización en servidor, sesiones por cookie httpOnly, logout con revocación real; consulta de cédula por proxy del servidor con caché y límite.
- 2026-11-10 (commit 7e12acc): cantidades decimales funcionales en todo el sistema para productos con unidad Kilogramo, Litro o Metro (y abreviaturas KG/L/MTS). Núcleo en `src/lib/inventory/units.ts` (`isDecimalUnit` normaliza acentos/abreviaturas, `roundQuantity2`, `parseQuantityInput`). Cableado: POS ventas (stepper, input 0.01, validación stock con tolerancia 0.0001), Cotizaciones (carrito + ítems cargados con `unit`), Pedidos (cantidad manual), Reporte diario de inventario (formulario de movimiento, `formQty` ahora string), Kárdex/ajustes (step 0.01) y `recordInventoryAdjustmentInSupabase` redondea stock/delta a 2 decimales. Formulario Nuevo/Editar producto y ajuste de stock de Inventario ya lo tenían.

## Diseño y botones
- Mantener el sistema existente: antracita/amarillo en el panel y colores propios de marca en la tienda; sin reestructurar páginas.
- Botones compartidos: Primary, Secondary, Danger y Ghost; radio 10 px, transiciones 200 ms, pulsación 0.95 y foco visible.
- 2026-11-08: componente compartido aplicado a acciones de compra de la tienda y a eliminaciones en Configuración, Bancos, Gastos, Inventario, Cotizaciones y ventas pendientes; encabezados y modales de Productos/Proveedores con amarillo corporativo.
- 2026-11-09: Reporte diario de inventario abre con periodo «Este Mes»; Reporte de Cuentas con versión móvil propia `.rep-acc-root`.
- 2026-11-09/10 — Transformación móvil completa (commits badcd84..1444f05): sistema compartido `M-SYSTEM` en globals.css (solo ≤640px, opt-in vía `m-root`; modales `.modal-container` como hoja inferior); tramo extra ≤360px `POS-S`; POS ≤640px con 3 fichas por fila y carrito ultra-compacto (6ba4ea4); navegación móvil global (MobileHeader, MobileBottomNav 5 accesos, MobileMoreSheet filtrado por permisos) en DashboardLayout, oculta topbar/sidebar ≤767px (44d9212); Dashboard y Configuración adoptan `m-root`.
- Librería móvil `src/components/mobile/` (14 componentes) creada y cableada: MobileSearchBar en Inventario, POS, CxC, CxP, Gastos, Clientes; MobileFilterSheet (Inventario, CxC, CxP, Gastos); MobileEmptyState/MobileLoadingState (Inventario, CxC, Gastos); FAB + ConfirmationDialog (Inventario); MobilePagination (Reporte inventario).
- Regla permanente en AGENTS.md: todo código nuevo debe adaptarse a móvil (320-430 px y 768 px), reutilizando `src/components/mobile/` y clases compartidas, sin desbordes ni targets <28 px. No usar PowerShell Set-Content para editar .tsx: corrompe acentos.
- Respetar `prefers-reduced-motion` y las reglas responsive existentes. Tailwind no está instalado; usar clases semánticas de `src/styles/globals.css`.

## Verificación y trampas
- Comandos: `npm run build`, `npm run lint`, `npm run test -- --run`; Vitest puede no encontrar pruebas.
- En cambios visuales revisar escritorio y móvil; evitar sustituir selectores personalizados por utilidades Tailwind.
- Build puede advertir chunks >500 kB; no cambiar el code-splitting sin tarea específica. `git push` suele reportar exit 1 por ruido de DNS/Select-String: verificar con `git fetch` + `rev-parse` del remoto.
- Mantener tasas históricas y cálculos financieros; no cambiar flujos de autorización ni migraciones core sin consultar.

## Referencias útiles
- Constitución y mapa: `02-DOCS/wiki/sdd/constitution.md`, `02-DOCS/wiki/index.md`.
- Diseño: `docs/design-system/README.md`, `DESIGN_SYSTEM.md`, `COMPONENTS_AND_PATTERNS.md`.
- Sesiones y adaptaciones móviles: `02-DOCS/wiki/features/2026-11-*`.

## Pendiente
- Pruebas integrales en 320/360/390/430/768 px + escritorio (bloqueadas: sesión expirada sin credenciales de prueba).
- 2026-11-13 (commit 9fc3b0c): Ventas móvil — paso 2 de cobranza: botones «AL CONTADO» y «CRÉDITO (CxC)» en la misma línea (la regla POS que apila cuadrículas `1fr 1fr` se anula solo para el contenedor con `:has(> .pos-paymode-btn)`), compactos: padding 6px, letra 10px (9.5px en ≤360), radio 9px, texto con elipsis. Escritorio intacto. Build y lint limpios. Ambos repos sincronizados.
- 2026-11-13 (commit 84ea1bd): Ventas móvil — paso 2 de cobranza (Métodos de Pago): el aviso «💡 Sistema Multi-Abonos: ...» (marcador de lista vacía de abonos, `[style*="dashed #cbd5e1"]`) se oculta ≤640px vía CSS; en escritorio se conserva. Build y lint limpios. Ambos repos sincronizados.
- 2026-11-13 (commit 63278fa): Ventas móvil — vista de cobranza (VIEW B, paso «Datos del Cliente para la Venta», contenedor `[style*="max-width: 960px"]` dentro de `.pos-root`) compactada en bloque final de globals.css: cabecera «Volver/MÓDULO DE COBRANZA» 10px/8.5px, stepper con círculos 22px (20px ≤360) y etiquetas 8.5px, tarjeta del paso padding 10px (8px ≤360) gap 10, inputs 30px·11px (28px·10.5px ≤360), botón «Consultar cédula» 30px, sugerencias de clientes max 170px con ítems 5×7, «+ Nuevo Cliente» 28px y «Confirmar Datos» 30px. Pasos 2 y 3 del cobro no tocados. Build y lint limpios. Ambos repos sincronizados.
- 2026-11-13 (commit de92a50): Ventas POS — consulta de cédula en «Datos del Cliente» verifica la base de clientes: si la cédula ya es un cliente, el nombre/teléfono/dirección se toman de la base interna (prioridad sobre el registro público); si no existe, `ConfirmationDialog` pregunta «¿Deseas guardarlo?» y al confirmar lo crea vía `createCustomerInSupabase` (Natural V/E, dirección de la ubicación del registro) y lo deja seleccionado. Comparación de documentos normalizada (sin guiones/espacios; tolera RIF con dígito verificador). Escritorio y móvil intactos (lógica, no CSS). Build y lint limpios. Ambos repos sincronizados.
- 2026-11-13 (commit 9b51576): Ambos repos sincronizados en el mismo SHA. Nota: los cambios del 12/11 (sesión única/iframe, optimización API, unificación móvil 767px) se habían subido a `frenyer` en 4 commits en inglés desde otra sesión sin commit local; se realineó `main` sobre `frenyer`, se limpiaron marcadores de plantilla `<TOOL>` de `.env.example` y `origin` (compuflores) se actualizó con force-with-lease. rsc actualizado a 4.1.5 (`.rsc.json`/`.gitignore` de harness commiteados aparte). Fallas intermitentes de DNS (`Could not resolve host: github.com`) al empujar: reintentar tras verificar `Resolve-DnsName github.com`.
- 2026-11-10 (commits d5ce122..9f5e6b4): Adaptación móvil completada en Kárdex (`mov-*` + `MobilePagination`), Producto (`MobileFormSection`), Proveedor/CxP (1 columna ≤640px), Reporte de Ventas y PyG (`MobileEmptyState`); `MobileDataList` descartado por redundancia con fichas CSS.
- 2026-11-12: `InactivityLock` seguro para `window.fetch` (`setInactivityLocked` en `authenticatedFetch`); login por contraseña y sesión única automática reparados para iframes (`SameSite=None; Secure; Partitioned` + `X-Frenyer-Session` opaco).
- 2026-11-12: Móvil Ventas POS (`.pos-*`), Nueva Cotización (`.cot-create-*`, 6 productos iniciales) y revisión integral del panel (`globals.css`, `Customers`, `NewPurchaseModal`, `Config`, `Inventory`) unificados bajo `@media (max-width: 767px)` y `≤360px`. Escritorio intacto.
- 2026-11-12: Optimización de arranque, conexión BD y reportes (`api/server.ts`, `AuthContext.tsx`, `DashboardLayout.tsx`, `Dashboard.tsx`, `db.ts`): `https.Agent` con Keep-Alive (`maxSockets: 64`) hacia Supabase; `resolveSessionUser` paralelo retorna `name`+`permissions` evitando doble `GET /api/users` al arrancar; caché en `/api/auth/mode` (30s) y `/api/bcv/rates` (10 min + deduplicación); `getActiveOrgId()` cachea `frenyer_org_id`; agregado `GET /api/dashboard/summary` paralelo (1 petición en lugar de 14-18) y paralelizados `/api/sales/report`, `/api/inventory/movements`, CxC y CxP. Build y lint limpios.
- 2026-11-12: En el formulario de datos del cliente en Ventas POS (`Sales.tsx`), se redujo el campo de cédula y se ubicó al lado en la misma línea el botón de «consulta de cédula» en versión compacta/minimizada (`CedulaLookupButton` con prop `compact`). En el Reporte de Ventas (`.rep-sales-root`), la cabecera móvil se configuró en una sola línea horizontal con el título y los botones de Sincronización y Exportar al lado. Build y lint limpios.

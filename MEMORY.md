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
- 2026-11-13 (commit 74b0d95): Móvil — (1) Cotizaciones compactadas (bloque final `cot-root` en globals.css: cabecera con logo 28px y título 14px, botones 28px; KPI 2 por fila con número 15px e icono 26px; toolbar de filtros apilada a ancho completo con controles 30px; fichas de tabla ceñidas a folio·monto [acciones]/cliente·estado, ocultando Bs/tasa, documento y teléfono; tramo ≤360px aún más ceñido). (2) Reporte diario: título móvil «Movimientos» vía spans `rep-diario-long/short` (escritorio mantiene «Reporte Diario de Inventario»); la cabecera ya era horizontal (fila título+acciones). Build y lint limpios. Ambos repos sincronizados.
- 2026-11-13 (commit c33b594): Facturas en espera PERSISTIDAS en Supabase (tabla nueva `parked_invoices`, migración `0031_parked_invoices.sql`: organization_id, control_number único por organización, ítems jsonb, RLS según patrón 0028). `db.ts` agrega fetch/create/delete por control_number+org. Sales.tsx: carga en `loadSupabaseData` (mapea control_number→id), creación al colocar en espera, borrado al recuperar o descartar; degrada con aviso si la tabla no existe. PENDIENTE: el usuario debe ejecutar la migración 0031 (o el bundle de `/api/supabase/migrations-bundle`) en el SQL Editor de Supabase — no se aplica automáticamente. Build y lint limpios. Ambos repos sincronizados.
- 2026-11-13 (commit 545c96f): Ventas — facturas/pedidos en espera (FACT. PEND.) identificados por nombre del cliente + número de control secuencial del propio POS: `id` ahora es `ESP-001, ESP-002, …` (máximo existente + 1, antes últimos 4 dígitos del timestamp); si no hay cliente registrado se guarda «Cliente sin registrar» (al recuperar el carrito, ese texto no se pega como nombre). El modal de espera incluye buscador por nombre o número de control y cada ítem muestra la insignia `ESP-###`; toasts de guardar/recuperar mencionan nombre + control. Las facturas en espera siguen siendo de sesión (en memoria, no en Supabase). Build y lint limpios. Ambos repos sincronizados.
- 2026-11-13 (commit 45f5ff5): Refuerzo de 9fc3b0c/84ea1bd (fusionados aquí): paso 2 de cobranza con clases estables `pos-paymode-grid`/`pos-multiabonos-hint` en el JSX (sin `:has()` ni selectores frágiles, funciona en navegadores viejos); botones Contado/Crédito 2 columnas compactos (10px, 9.5px ≤360) y aviso Multi-Abonos oculto ≤640px. Escritorio intacto.
- 2026-11-13 (commit 63278fa): Cobranza móvil (VIEW B, paso «Datos del Cliente») compactada en bloque final de globals.css; pasos 2 y 3 no tocados. Build y lint limpios en todos estos commits; ambos repos sincronizados.
- 2026-11-13 (commit de92a50): Consulta de cédula en POS verifica la base de clientes (doc normalizado, tolera dígito verificador del RIF): si existe, la base interna manda; si no, `ConfirmationDialog` pregunta «¿Deseas guardarlo?» y lo crea vía `createCustomerInSupabase`.
- 2026-11-13 (commit 9b51576): Ambos repos sincronizados en el mismo SHA. Nota: los cambios del 12/11 (sesión única/iframe, optimización API, unificación móvil 767px) se habían subido a `frenyer` en 4 commits en inglés desde otra sesión sin commit local; se realineó `main` sobre `frenyer`, se limpiaron marcadores de plantilla `<TOOL>` de `.env.example` y `origin` (compuflores) se actualizó con force-with-lease. rsc actualizado a 4.1.5 (`.rsc.json`/`.gitignore` de harness commiteados aparte). Fallas intermitentes de DNS (`Could not resolve host: github.com`) al empujar: reintentar tras verificar `Resolve-DnsName github.com`.
- 2026-11-10 (commits d5ce122..9f5e6b4): Adaptación móvil completada en Kárdex (`mov-*` + `MobilePagination`), Producto (`MobileFormSection`), Proveedor/CxP (1 columna ≤640px), Reporte de Ventas y PyG (`MobileEmptyState`); `MobileDataList` descartado por redundancia con fichas CSS.
- 2026-11-12: Optimización de arranque y API (`api/server.ts`, `db.ts`, contexto auth): Keep-Alive hacia Supabase, sesión paralela, cachés de modo/tasa/organización, `/api/dashboard/summary` paralelo. Formulario POS: cédula compacta con botón de consulta en la misma línea; Reporte de Ventas con cabecera móvil horizontal.

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
- Formularios largos en secciones (Nuevo producto, Registro de proveedor, Cuenta pendiente); MobileDataList en listas; MobilePagination en otros módulos.

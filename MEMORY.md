# MEMORY.md — FRENYER

## Despliegue
- `frenyer` / `frenyer.vercel.app` es el entorno de pruebas.
- `origin` / `compuflores.vercel.app` es comercial; se sincroniza solo con orden explícita del usuario (última: «actualiza los ambos repositorios», 2026-11-09 → `3a72db0`, igualado con `frenyer`).
- Trabajar sobre la rama abierta; no publicar ni sincronizar sin autorización explícita.

## Estado y decisiones vigentes
- ERP/POS bimonetario USD/VES, multi-tenant; toda operación debe respetar organización, sucursal, tasa de cambio y redondeo monetario.
- Supabase exige RLS y verificación de membresía; Alma nunca ejecuta SQL arbitrario desde el cliente.
- Autorización en servidor, sesiones por cookie httpOnly y logout con revocación real. Seguimiento de sesiones 0029/0030 aplicado.
- Inicio de sesión reemplaza la sesión anterior sin modal; al cerrar el navegador se elimina la cookie de sesión.
- Consulta de cédula integrada por proxy del servidor, con caché y límite de solicitudes; nunca guardar claves ni tokens en memoria.
- Tienda pública: el catálogo permite filtrar por división y agregar productos al carrito. Ajustes móviles y guardia de salida documentados en el historial anterior.

## Diseño y botones
- Mantener el sistema existente: antracita/amarillo en el panel y colores propios de marca en la tienda; sin reestructurar páginas.
- Botones compartidos: Primary, Secondary, Danger y Ghost; radio 10 px, transiciones 200 ms, pulsación 0.95 y foco visible.
- 2026-11-08: componente compartido aplicado a acciones de compra de la tienda y a eliminaciones en Configuración, Bancos, Gastos, Inventario, Cotizaciones y ventas pendientes.
- 2026-11-08: encabezados de Productos e inventario y Proveedores, más los modales Nuevo producto y Registrar proveedor, usan el amarillo corporativo; conservar la estructura existente.
- 2026-11-09: Reporte diario de inventario abre con el periodo «Este Mes» (no «Hoy»); el resto de filtros y la exportación no cambian.
- 2026-11-09: Reporte de Cuentas (/cuentas/reporte) con versión móvil ≤640px — patrón propio `.rep-acc-root`: botones con etiqueta corta (Act./Excel/Impr.), KPI 2 por fila conservando la tasa BCV, filtros apilados y tabla como fichas de 2 líneas (fecha · comprobante · monto [ojo] / cliente). Tipo, método, banco y monto VES solo en escritorio.
- 2026-11-09: Rediseño móvil global (Fases 0–6, commits badcd84..9be80ed). Nuevo sistema compartido `M-SYSTEM` en globals.css: solo aplica ≤640px y solo dentro de páginas con clase raíz `m-root` (opt-in). Reglas compartidas: h1 15px, subtítulos ocultos, `.grid-4` KPI 2 por fila, botones de cabecera 32px en filas envueltas, tablas convertidas a fichas (el orden por columnas lo define cada página). Modales globales (`.modal-container`) como hoja inferior a ancho completo ≤640px. Raíces por página: fin-exp-root (Gastos), fin-cxc-root, fin-cxp-root, ped-root (Pedidos), cot-root (Cotizaciones), saldet-root (Detalle venta), crm-root (Clientes), sup-root (Proveedores), pnl-root, ch-root (Salud), mov-root (Kárdex), invcom-root (Compras internas). Pos/Shop y las raíces ya probadas (rep-sales/inv/acc, bank-*, inv-*) NO llevan m-root, por lo que no cambian. NO usar PowerShell Set-Content para editar .tsx: corrompe acentos (ya pasó en Suppliers/Customers).
- 2026-11-09: Tramo extra compacto ≤360px (~menores a 6,2"), commit 1ad3026, bloque `POS-S` en globals.css: POS con catálogo (fichas de 92px), carrito y barra fija aún más pequeños (raíz `pos-root`), y el mismo tamaño aplicado a ped-root, cot-root, saldet-root y rep-sales-root (KPI, botones y fichas una medida menor). Escritorio y el tramo estándar ≤640px no cambian.
- 2026-11-09: POS ≤640px (commit f79a60d): catálogo con EXACTAMENTE 3 fichas por fila (repeat(3), que encajen con elipsis), carrito reducido (padding 10, stepper 36px, importes 10px) y botones paymode/doctype/toobar/cartbar una medida menor. El tramo ≤360px mantiene 3 por fila con letra aún menor.
- 2026-11-10: Navegación móvil global implementada (commit 44d9212): componentes `mobile/MobileHeader`, `MobileBottomNav` (5 accesos: Inicio, Ventas, Inventario, Reportes, Más) y `MobileMoreSheet` (Bottom Sheet con todos los módulos filtrados por permisos). Integrados en `DashboardLayout`: cabecera móvil compacta, barra inferior fija con área segura, oculta topbar/hamburguesa/sidebar en ≤767px. CSS global `mobile-header/bottom-nav/more-sheet` con animación de entrada. Dashboard adopta `m-root`. Escritorio intacto.
- 2026-11-10: Librería de componentes móviles compartidos (commit a715fb7): `MobilePageContainer`, `MobileBottomSheet`, `MobileSearchBar`, `MobileFilterSheet` + trigger, `MobileEmptyState`, `MobileLoadingState`, `CompactStatCard`, `CompactProductCard`, `MobileDataList` + item, `MobileForm` (section/field), `MobileActionSheet`, `ConfirmationDialog`, `MobilePagination`, `FloatingActionButton`. CSS global compacto incluido. Reutilizables en todos los módulos; pendiente cablearlos en las pantallas.
- 2026-11-10: Cableado inicial de `MobileSearchBar` (commit cbdd46a) en Inventario, Ventas (POS), Cuentas por cobrar, Cuentas por pagar y Gastos. `FloatingActionButton` en Inventario (Nuevo producto). Build y lint limpios. Pendiente: filtros en Bottom Sheet, formularios en secciones, eliminaciones con confirmación, listas de datos compactas en el resto de módulos.
- Respetar `prefers-reduced-motion` y conservar las reglas responsive existentes.
- Tailwind no está instalado; usar componentes y clases semánticas de `src/styles/globals.css`.

## Verificación y trampas
- Comandos: `npm run build`, `npm run lint`, `npm run test -- --run`; Vitest puede no encontrar pruebas.
- En cambios visuales revisar escritorio y móvil; evitar sustituir selectores personalizados por utilidades Tailwind.
- Build puede advertir chunks minificados mayores a 500 kB; no cambiar el code-splitting sin una tarea específica.
- Mantener las tasas históricas y los cálculos financieros; no cambiar flujos de autorización ni migraciones core sin consultar.

## Referencias útiles
- Constitución y mapa: `02-DOCS/wiki/sdd/constitution.md`, `02-DOCS/wiki/index.md`.
- Diseño: `docs/design-system/README.md`, `DESIGN_SYSTEM.md`, `COMPONENTS_AND_PATTERNS.md`.
- Estado de sesiones: `02-DOCS/wiki/features/2026-11-02-reemplazo-sesion.md`, `2026-11-03-cierre-navegador.md`.
- Adaptaciones móviles: `02-DOCS/wiki/features/2026-11-02-reporte-ventas-movil.md`, `2026-11-02-reporte-inventario-movil.md`, `2026-11-02-movimientos-bancarios-movil.md`.

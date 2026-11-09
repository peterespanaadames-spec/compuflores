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

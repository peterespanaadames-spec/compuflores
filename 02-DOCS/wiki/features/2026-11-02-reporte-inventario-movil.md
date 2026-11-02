---
type: feature
title: Reporte Diario de Inventario — versión móvil compacta
status: done
created: 2026-11-02
tags: [inventario, reportes, movil]
---

# Reporte Diario de Inventario móvil (/inventarios/reporte-diario)

## Intención
Quitar textos largos e innecesarios, compactar los 3 botones en una línea, KPI en
2 tarjetas por fila, filtros 2 por línea y la tabla de movimientos solo con lo
esencial. Solamente ≤640px; escritorio intacto.

## Alcance
- Raíz con clase `rep-inv-root`; botones con `rep-head-actions` (patrón ya existente)
  y textos largos/cortos vía `rep-long`/`rep-short`:
  **Registrar Movimiento → Mov.** · **Sincronizar → Sinc** · **Exportar → icono puro**.
- Textos fuera en móvil: párrafo descriptivo de la cabecera y subtítulos «≈ Bs.» de los KPI.
- KPI: 2 por fila (grid-4 forzado), letra chica, sin subtítulos.
- Filtros: búsqueda a línea completa, pestañas de periodo repartidas (`inv-period-tabs`),
  los 2 selectores (tipo y almacén) comparten línea al 46% (`inv-filter-selects`),
  alturas de 30–34px. Rango personalizado con fechas en versión corta.
- Tabla de movimientos (`rep-inv-table`): fichas de 2 líneas en flex —
  línea 1: fecha · documento (+copiar) · tipo · monto USD/≈Bs [ojo];
  línea 2: producto (+SKU) · cantidad con signo coloreado.
  Ocultas en móvil (`rep-col-oculta`): Almacén, Costo Unitario y Responsable.
- Paginación compacta (30px).

## Verificación
`npm run build` ✓ · `npm run lint` ✓.

---
type: feature
title: Reporte de Ventas — versión móvil compacta
status: done
created: 2026-11-02
tags: [ventas, reportes, movil]
---

# Reporte de Ventas móvil (2/11/2026)

## Intención
El usuario pidió ajustar SOLO la versión móvil de `/ventas-flash/reporte`: botones
minimizados, KPI en 2 tarjetas por fila y el detalle de transacciones en una sola
línea (fecha · comprobante · tipo · monto · acción), con acabado agradable.

## Alcance (todas las reglas son solo ≤640px; escritorio intacto)
- `SalesReport.tsx`: raíz con clase `rep-sales-root`, cabecera con `rep-head-actions`,
  Sincronizar con `rep-sync-btn`, tabla `rep-sales-table`, columnas ocultas en móvil
  marcadas con `rep-col-oculta` (Cliente, Método/cuenta, Monto VES y Estado) y
  badges de tipo con etiqueta larga/corta (`rep-long`/`rep-short`: Nota Entrega→Nota,
  Pedido Web→Ped. Web; Factura no necesita abreviatura).
- `globals.css`: nuevo bloque «RESPONSIVE REPORTE DE VENTAS MÓVIL» antes de `@media print`.
  - KPI: 2 por fila (fuerza 2 en vez del 1 por fila genérico), gaps de 8px, letra chica y sin subtítulos.
  - Botones: cabecera (Sincronizar queda solo icono), toolbar de periodo y selectores a 2 columnas, alturas 30–32px.
  - Tabla: celdas sin salto de línea, paddings compactos, comprobante recortado con elipsis si desborda, botón de acción de 28px.
  - Sin scroll lateral (todo cabe).

## Detalle experto
Como la columna Estado sale de la línea móvil, el monto USD lleva un **punto de color**
(`rep-dot`, solo visible en móvil): verde = completada/entregada/pagada, ámbar = pendiente.

## Verificación
`npm run build` ✓ · `npm run lint` ✓. Las vistas Productos y Métodos de Pago conservan
su scroll horizontal habitual (el pedido solo menciona el detalle de transacciones).

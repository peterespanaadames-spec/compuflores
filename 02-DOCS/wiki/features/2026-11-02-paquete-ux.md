---
type: feature
title: Paquete UX — stock por defecto 3, decimales kg/metro y botones bancarios móvil
status: done
created: 2026-11-02
tags: [ventas, inventario, finanzas, movil]
---

# Paquete UX del 02-11-2026 (3 mejoras)

## Decisión ratificada por el usuario
Al pedir «stock 3 por defecto», eligió **Ambos**: el campo Stock se prellena con 3 al crear
un producto Y el stock mínimo (avisos de bajo inventario) parte de 3. La venta libre sigue
naciendo con stock libre (9999) para no bloquear servicios abiertos.

## 1. Stock por defecto 3
- `Inventory.tsx` (`handleOpenNewProduct` + estado inicial): «Stock» y «Stock mínimo» prellenados con **3** en vez de 0.
- `Sales.tsx` (venta libre): el producto autogenerado se crea con `min_stock: 3` (antes 0). Su stock operativo sigue siendo 9999 (ítem abierto sin límite).

## 2. Decimales para Kilogramo y Metro
- Nueva utilidad `src/lib/inventory/units.ts`: `isDecimalUnit()`, `roundQuantity2()`, `parseQuantityInput()`.
- `Inventory.tsx`: creación/edición y ajuste rápido de stock aceptan decimales (paso 0.01) si la unidad es Kilogramo o Metro (comparación insensible a mayúsculas); parse `parseFloat` redondeado a 2 decimales solo para esas unidades, el resto sigue entero.
- `Sales.tsx`: el catálogo y el carrito ahora llevan la unidad del producto (`PosProduct.unit`, `CartItem.unit`); el input de cantidad del POS usa `min=0.01`/`step=0.01` para kg/m, la validación de checkout admite cantidades ≥ 0.01 (antes `Math.max(1,…)` forzaba 1 y bloqueaba stocks < 1), y el redondeo a 2 decimales evita colas flotantes.

## 3. Botones bancarios en móvil (una sola línea)
- `BankAccounts.tsx`: los botones de cabecera obtienen la clase `bank-head-actions` y doble etiqueta (`bank-btn-long` en escritorio / `bank-btn-short` en móvil):
  - «Transferir entre Cuentas» → **Transferir**
  - «Ingresar saldo» → **Ingresar**
  - «Retirar saldo» → **Retirar**
  - «Sincronizar» mantiene su texto (cabe).
- `globals.css` (bloque RESPONSIVE FINANZAS MÓVIL ≤640px): fila `nowrap`, alto 32px, fuente 10px, huecos de 6px — el escritorio no cambia.

## Verificación
`npm run build` ✓ · `npm run lint` ✓ · `npm run test` código 0 (sin pruebas en el repo).
Limitación conocida: el stock de productos que no son kg/m queda entero en Base de Datos; los kg/m guardan decimales a 2 lugares.

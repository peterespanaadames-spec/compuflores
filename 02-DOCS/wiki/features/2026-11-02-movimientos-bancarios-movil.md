---
type: feature
title: Cuentas Bancarias — pantalla de movimientos en móvil
status: done
created: 2026-11-02
tags: [finanzas, movil]
---

# Movimientos bancarios en móvil (2/11-2026)

## Intención
Los botones bancarios de la pantalla de movimientos deben quedar en una sola
línea (32px, fuente 10px, «Transferir»/«Ingresar»/«Retirar») y toda la vista de
movimientos verse reducida y ajustada al celular. Escritorio intacto.

## Alcance (reglas solo ≤640px, en el bloque RESPONSIVE FINANZAS MÓVIL)
- Barra superior del detalle: contenedor con clase `bank-head-actions` (patrón ya
  existente) → los 3 botones comparten línea con etiquetas cortas
  (`bank-btn-long`/`bank-btn-short`); «Volver a cuentas» vive fuera, intacto.
- Cabecera de cuenta reducida: avatar 36px (`bank-acct-avatar`), título 15px,
  saldo 20px (`bank-bal-value`), paddings menores.
- Toolbar compacta: pestañas Todos/Este Mes/Personalizado reparten la línea
  (`bank-mov-tabs`), Sincronizar/Exportar a 30px repartidos (`bank-mov-actions`),
  fechas personalizadas a 38vw.
- Tabla de movimientos (`bank-mov-table`, antes sin clase): layout fijo con
  proporciones (fecha 21%, tipo 17%, detalle 34%, monto 28%), tipografía 10.5px,
  conceptos y referencias con elipsis, sin deslizamiento lateral que se pierda:
  las columnas CUENTA/USUARIO/TASA/COMISIÓN ya estaban ocultas en móvil.
- Fecha: escritorio completa con hora (`mov-date-full`); móvil solo fecha
  (`mov-date-short`) para que la línea respire.

## Verificación
`npm run build` ✓ · `npm run lint` ✓. Computador (≥640px) no cambia nada.

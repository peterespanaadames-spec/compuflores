---
type: constitution
title: Frenyer — Constitution
description: Principios no negociables del proyecto SDD.
tags: [sdd, constitution]
timestamp: 2026-10-29T00:00:00Z
topic: sdd
status: ratified
version: 1.0.0
---

# Frenyer — Constitution

> Ratificada el 2026-10-29. Versión 1.0.0. Toda fase SDD posterior (specify, plan, implement, verify) obedece estos principios.

## 1. Stack canon

1. **Frontend React + Vite + TypeScript + Tailwind (vía `@import` en `globals.css`)**. No se introducen librerías visuales ajenas sin acuerdo del equipo de diseño.
2. **Enrutamiento con React Router DOM v6 (`createBrowserRouter`)**, árbol central en `src/app/router/index.tsx`.
3. **Backend/persistencia en Supabase (PostgreSQL con RLS obligatoria)**; el servidor Express (`api/server.ts`) es la vía preferida para operaciones de negocio (patrón sesión→service role→archivo local).
4. **Gráficos con Recharts**, iconos con Lucide React.
5. **Un solo archivo de estilos semánticos con tokens** (`src/styles/globals.css`); no CSS huérfano ni estilos en línea sin justificación.

## 2. Calidad (barra mínima)

1. `npm run build` (tsc + vite) y `npm run lint` (ESLint) deben quedar limpios antes de dar un cambio por finalizado.
2. Tipado estricto en TypeScript; props explícitas y desestructuradas en componentes funcionales.
3. Todo cambio se verifica de forma interactiva en los flujos afectados (acordeones del Sidebar, modales, vistas móvil/escritorio).

## 3. Convenciones

1. **Código en inglés (`camelCase`)** para variables, funciones, rutas y archivos. **UI, etiquetas, mensajes de error y comentarios en español.**
2. Componentes React funcionales con tipado estricto.
3. Estética: canvas gris frío muy claro, tarjetas blancas con borde `1px solid var(--border)`, radio `var(--radius-lg)` (16px), acento violeta `var(--brand-500)`. Seguir `docs/design-system/DESIGN_SYSTEM.md`.
4. **Modificaciones incrementales por módulo**; no mezclar refactor visual amplio con cambios de datos.
5. Actualizar `MEMORY.md` al terminar cada tarea; sincronizar metadata (`metadata.json`, `index.html`).

## 4. Reglas de dominio (no negociables)

1. **Bimonetariedad estricta**: toda operación financiera, flujo de caja o cuenta bancaria calcula y registra el tipo de cambio vigente en el momento de la transacción.
2. **Redondeo a dos decimales exactos** en importes, impuestos (IVA 16 %, IGTF 3 %) y márgenes.
3. **Seguridad RLS**: las consultas filtran siempre por organización y sucursal activa; nunca datos globales sin validación de membresía.
4. **Sin SQL arbitrario para Alma**: el copiloto interactúa solo mediante herramientas autorizadas en el servidor.
5. **Pagos**: `CONTADO` o `CREDITO`; en crédito se exige cliente real (no "Consumidor final") con nombre, RIF, teléfono y dirección.

## 5. Ramificación y entrega

1. Trabajo directo sobre la rama por defecto (`main`); sin ramas ni PR salvo acuerdo explícito.
2. El servidor de desarrollo corre en el puerto `3000` con host `0.0.0.0`.
3. Autorización para instalar dependencias, crear migraciones estructurales core o modificar el flujo de autorización (perfiles/membresías) requiere confirmación previa.

## 6. Seguridad y privacidad

1. Nunca exponer secretos, contraseñas de servicio ni API keys en código de cliente.
2. Nunca romper ni bypassar políticas RLS en PostgreSQL.
3. Las rutas nuevas `/api/*` deben registrarse en el middleware `authenticateSupabaseRequest`.

## 7. UX / accesibilidad

1. La aplicación debe ser 100 % responsiva (móvil, tablet, escritorio).
2. Los modales críticos no se cierran al hacer clic fuera salvo que se indique; Escape sigue cerrando por teclado.
3. Las acciones destructivas requieren confirmación explícita.

## 8. Performance

1. Evitar bundles excesivos; preferir carga bajo demanda cuando aplique.
2. No bloquear el hilo principal con operaciones pesadas en el render.

## 9. Conocimiento y decisiones

1. **Autoría de git es del humano**: no añadir `Co-Authored-By` ni créditos de asistente en commits.
2. Las decisiones importantes se registran en `MEMORY.md` (estado, porqué, errores a evitar) y, si se vuelven reglas permanentes, se proponen para `AGENTS.md`.
3. Las fuentes de verdad del proyecto viven en `docs/` y `02-DOCS/wiki/`; mantenerlas sincronizadas con el código.

## Definition of Done (barra que `verify` ejecuta)

- [ ] `npm run build` limpio (sin errores TS).
- [ ] `npm run lint` limpio (sin errores ESLint).
- [ ] Flujo afectado probado de forma interactiva en móvil y escritorio.
- [ ] Documentación (`docs/` y/o `02-DOCS/wiki/`) actualizada si cambió comportamiento.
- [ ] `MEMORY.md` actualizado.
- [ ] Sin secretos en el cliente ni bypass de RLS.

## Amendment log (append-only)

| Fecha | Versión | Cambio | Porqué |
|-------|---------|--------|--------|
| 2026-10-29 | 1.0.0 | Ratificación inicial a partir de `AGENTS.md` y `docs/`. | Establecer guardrails SDD para el proyecto. |
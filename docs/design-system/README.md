# Design System — Frenyer

> **Fuente de verdad visual:** Modern Minimal SaaS.
> La implementación debe respetar los tokens, componentes, patrones, responsive y accesibilidad
> definidos para Frenyer.
>
> Implementación real: `src/styles/tokens.css` (21 variables) y `src/styles/globals.css`
> (1 440 líneas de clases semánticas).

---

## Documentos

| Documento | Contenido |
|---|---|
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Tokens, base, layout, tipografía, responsive, accesibilidad |
| [COMPONENTS_AND_PATTERNS.md](COMPONENTS_AND_PATTERNS.md) | Catálogo de componentes, patrones y clases disponibles |
| [IMPLEMENTATION_PROMPT.md](IMPLEMENTATION_PROMPT.md) | Instrucciones de implementación para nuevas pantallas |

---

## Fundamentos

Canvas gris frío muy claro, superficies blancas, acentos antracita y amarillo, bordes de 1 px,
radio compartido de 10 px para botones, sombras discretas, sans serif moderna y espaciado en
múltiplos de 4 px. Usa tokens semánticos y estados completos.

---

## Advertencia importante

> ⚠ **No hay Tailwind en este proyecto.** No existe `tailwind.config.*` ni `postcss.config.*`, y
> `tailwindcss` no está en `package.json`.
>
> Todo el diseño se hace con **clases semánticas** definidas en `src/styles/globals.css`.
> Escribir `className="flex items-center gap-2 text-sm"` produce un elemento **sin estilo**.
>
> Hay seis archivos que ya usan utilidades de Tailwind por error
> (`AuthCallback.tsx`, `SaleDetailModal.tsx`, `ProtectedRoute.tsx`, `LoginPage.tsx`,
> `Suppliers.tsx`, `SalesKPIs.tsx`, `SalesTransactionsTable.tsx`). Esos son **errores**,
> no precedentes. Ver [KNOWN_ISSUES P-17](../operations/KNOWN_ISSUES.md#p-17).

---

## Tokens

Todos los colores, radios y sombras se consumen como variables CSS, nunca como valores hex
sueltos.

```css
/* Extracto relevante de src/styles/tokens.css */
:root {
  --brand-dark: #2D2E32;
  --brand-accent: #FFF275;
  --danger: #DC2626;
  --radius-sm: 10px;
  --button-radius: var(--radius-sm);
  --button-motion-duration: 200ms;
  --button-press-duration: 120ms;
  --button-press-scale: 0.95;
}
```

`globals.css` lo importa en la línea 1: `@import './tokens.css';`

> ⚠ **No hay tokens de espaciado, tipografía ni z-index.** El espaciado está en píxeles
> dentro de cada clase y los tamaños de fuente se fijan por clase. Si necesitas espaciado
> consistente, **añade tokens** antes de seguir extendiendo valores sueltos.

---

## Reglas de implementación

1. **Responsive obligatorio.** Toda pantalla debe funcionar en móvil (360 px), tablet (768 px) y
   escritorio (1440 px). El shell usa un grid de 2 columnas a partir de 640 px.
2. **Accesibilidad.** Etiquetas asociadas a sus campos, `aria-label` en botones de solo icono,
   foco visible, contraste AA sobre `--surface`.
3. **Sin excepciones visuales.** Si una pantalla necesita un estilo que no existe, **añade la
   clase al Design System** en vez de usar estilos en línea.
4. **Estados completos.** Cada acción tiene estado de carga, vacío, error y éxito.
5. **Acciones críticas reales.** Los botones principales deben persistir en el backend, no
   simular.
6. **Tokens siempre.** `var(--brand-500)`, `var(--radius-lg)`, `var(--border)`… nunca `#8b78e8`.

---

## Referencias

- Layout de referencia: `src/pages/Dashboard.tsx`
- Navegación de referencia: `src/components/ui/Sidebar.tsx`
- Shell de referencia: `src/layouts/DashboardLayout.tsx`

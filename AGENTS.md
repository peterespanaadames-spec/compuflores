# AGENTS.md — Frenyer

Sistema de gestión empresarial bimonetario (ERP/POS) de alto rendimiento optimizado para el comercio, con control de ventas, inventarios, cuentas, finanzas y el asistente inteligente corporativo Alma. Diseñado para ofrecer una experiencia fluida e integrada en un modelo multi-tenant.

## Stack y estructura

### Tecnologías clave
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS (importado vía `@import` en `globals.css`).
- **Enrutamiento**: React Router DOM (v6 con `createBrowserRouter`).
- **Gráficos**: Recharts para visualización de KPI y balances.
- **Iconos**: Lucide React.
- **Backend / Persistencia**: Supabase (PostgreSQL con seguridad RLS obligatoria).

### Estructura de carpetas importante
- `/src/app/router/index.tsx` - Árbol central de enrutamiento y registro de módulos.
- `/src/layouts/DashboardLayout.tsx` - AppShell principal que distribuye el menú lateral y la cabecera.
- `/src/components/ui/` - Componentes globales de diseño reutilizables (Sidebar, Button, Card, Badge).
- `/src/modules/` - Módulos de dominio desacoplados:
  - `sales/` - Punto de venta (POS), facturación, pedidos, cotizaciones e informes de venta.
  - `inventory/` - Control de catálogo de productos, compras internas y kárdex de movimientos.
  - `finance/` - Flujos de caja, cuentas bancarias, ingresos, egresos (gastos) y estado de pérdidas y ganancias.
  - `accounts-receivable/` - Gestión de cuentas por cobrar y obligaciones por pagar.
  - `customers/` - CRM de clientes, proveedores y campañas de marketing.
  - `alma/` - Centro de operaciones y chat del asistente inteligente Alma.
- `/supabase/migrations/` - Esquema de base de datos SQL con tablas de organizaciones, sucursales y triggers.
- `/docs/` - Guías de diseño, arquitectura, seguridad y requisitos funcionales.

## Comandos

Ejecuta los siguientes comandos exactos para el desarrollo y verificación del proyecto:

```bash
# Iniciar el servidor de desarrollo en el puerto 3000 (disponible en 0.0.0.0)
npm run dev

# Compilar la aplicación y verificar tipos TypeScript
npm run build

# Ejecutar el validador de sintaxis y código (ESLint)
npm run lint

# Ejecutar pruebas unitarias
npm run test
```

## Convenciones

### Estilo y estructura de código
- **Idioma**: El código fuente, variables, nombres de funciones y rutas deben estar escritos en **inglés** (utilizando `camelCase`). Los textos de la interfaz de usuario, etiquetas, mensajes de error y comentarios explicativos deben estar estrictamente en **español**.
- **Componentes**: React funcionales con tipado estricto en TypeScript. Props explícitas y desestructuradas.
- **Estética visual**: Seguir la guía de `/docs/design-system/DESIGN_SYSTEM.md`. Canvas de color gris frío muy claro, tarjetas blancas con bordes de `1px solid var(--border)`, radios de borde redondos (`var(--radius-lg)` de 16px) y acento violeta (`var(--brand-500)`). No introducir clases CSS huérfanas o estilos en línea sin justificación.
- **Referencia de diseño**: El archivo de referencia para layouts modulares es `/src/pages/Dashboard.tsx` y el menú de navegación es `/src/components/ui/Sidebar.tsx`.

## Reglas de dominio / trampas conocidas

- **Bimonetariedad estricta**: Frenyer opera simultáneamente en USD y VES. Toda operación financiera, flujo de caja o cuenta bancaria debe calcular y registrar el tipo de cambio de referencia vigente en el momento de la transacción para mantener un historial de auditoría consistente.
- **Seguridad RLS (Row Level Security)**: Las consultas a la base de datos deben realizarse siempre filtrando bajo el contexto del inquilino (organización y sucursal activa). Nunca expongas datos globales sin validación de membresía previa.
- **Sin SQL arbitrario para Alma**: El copiloto inteligente Alma interactúa con bases de datos mediante herramientas estrictas y funciones autorizadas expuestas en el servidor. Nunca debes permitir la ejecución o concatenación de SQL directo desde el cliente.
- **Redondeo monetario**: Aplica siempre redondeo a dos decimales exactos en cálculos matemáticos de importes, impuestos (IVA, IGTF) y márgenes para evitar descuadres de centavos en balances consolidados.

## Forma de trabajar

- **Planificación previa**: Antes de escribir o modificar código, define mentalmente el impacto en las rutas y en el sistema de diseño.
- **Tamaño de los cambios**: Realiza modificaciones incrementales enfocadas en un solo módulo a la vez. No mezcles refactorizaciones visuales amplias con cambios en la lógica de datos.
- **Resumen final**: Al concluir tus tareas, proporciona un reporte claro de los archivos creados/modificados, el estado de la compilación y los flujos de negocio garantizados. No utilices jerga técnica interna de la IA.
## Memoria
- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones
tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su
porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de
dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales).

## Límites

- ✅ **Siempre**:
  - Asegura que la aplicación sea 100% responsiva (móviles, tablets y pantallas de escritorio).
  - actualizar `MEMORY.md` al terminar cada tarea.
  - Mantén sincronizada la metadata del sistema (`metadata.json` e `index.html`).
  - Ejecuta `npm run dev` en el puerto `3000` con host `0.0.0.0` para que el preview del entorno sea accesible.
- ⚠ **Pregunta antes**:
  - Instalar nuevas dependencias en `package.json`.
  - Crear nuevas migraciones en Supabase que alteren tablas estructurales core.
  - Modificar el flujo de autorización de usuarios (perfiles/membresías).
- 🚫 **Nunca**:
  - Rompas o bypasses las políticas de RLS en PostgreSQL.
  - Expongas secretos, contraseñas de servicio o API keys en el código de cliente.
  - Reemplaces de forma abrupta el Design System unificado por librerías visuales ajenas sin previo acuerdo con el equipo de diseño.

## Verificación

Antes de dar un cambio por finalizado, asegúrate de:
1. Ejecutar `compile_applet` localmente y comprobar que no hay errores de sintaxis o de compilación TypeScript.
2. Ejecutar `lint_applet` y asegurar la salida limpia de ESLint.
3. Probar de manera interactiva que los acordeones del menú lateral (`Sidebar`) se comportan de manera responsiva y despliegan correctamente cada una de las subrutas asignadas.


<!-- rsc-suggest:start -->

# rsc-suggest — the always-on layer

Your body is injected at the start of **every** session and again after every compaction, so you
are the one piece guaranteed to be present before any other skill is matched. Two jobs, in order:

1. **Classify every turn into one of three lanes** before anything is written.
2. **Keep the session equipped** — spot the skill the task needs but the user does not have.

---

## 1. The decisor: classify the turn before acting

Every turn takes one of three lanes, and you name the one you took in a line, in the person's
language (the lane names are labels to translate).

**Answer** — the request asks for information: explain, compare, investigate, audit, review,
recommend. Read-only: write nothing, create no artifact, delegate no writer. Asking you to *think
about* building something is still this lane; only asking to build authorises it. When change
intent is ambiguous, ask one question and stay here — ambiguity slows the lane, never raises it.

**You choose the lane; never hand that choice to the person.** Simple → **FTD**: one feature document
in `02-DOCS` (intent, scope, checklist, evidence, next step), tasks checked off against observed proof.
Big, or decisions that affect each other → **SDD**: enter the chain; the person approves the spec and
clarify, then picks manual or autopilot. Say which and why in one line; switch if asked.
→ `../ftd/SKILL.md` · `../sdd/SKILL.md`.

**Where.** Default branch open (chosen at install, or nothing complex) → work on it, no branch
question. Closed («ramas y PR», CI, team) → before each code change ask: this branch, a new one, or
`rsc main unlock`? Never branch alone. Another session here → `.worktrees/<branch>`.

Judge the **meaning**, not the wording: the trigger is semantic in any language. A bug fix restoring
intended behaviour is `debug`. Autopilot consent covers a whole run — advance without re-asking.

Lane's skill missing? Offer it (§2) first. SDD recorded as deferred in `.rsc.json`? Run
`npx @ericrisco/rsc@latest reassess`; silent on `RSC_REASSESSMENT_NO_CHANGE`, and on new evidence
show the plan command — SDD still needs a newly accepted plan id, never added silently.

---

## 2. Keeping the session equipped

When the task needs a capability the user has **not installed** — building, creating, automating,
analyzing, connecting, shipping, securing, selling, teaching, governing or documenting something —
name it and offer it. This runs mid-conversation, not only at project start.

1. `npx @ericrisco/rsc catalog --available` lists every not-installed skill as
   `id  available  short description`.
2. Pick the single best fit **by meaning**, the way you would match a request to a teammate's
   expertise, even when no keyword overlaps. If nothing genuinely fits, say so and move on: a
   tangential suggestion is worse than none.
3. Ask once, plainly: "Para esto instalaría `<id>`, que aún no tienes. ¿La instalo? (sí/no)".
4. On yes, run `npx @ericrisco/rsc add <id>`, then continue the original task.

One suggestion at a time,
and never to interrupt a flow with a nice-to-have. Never recommend something already installed
(`npx @ericrisco/rsc list`).

`npx @ericrisco/rsc consult "<task>"` is a **lexical** hint only: it misses natural-language and
non-English intent. Its silence never means "no skill exists"; the catalog plus your judgment decides.

### Automation gap — after the work

Delivered work a repeatable **procedure**? Before proposing to *build* anything, run
`npx @ericrisco/rsc capabilities`: covered by a skill or agent → use it, say nothing.
Not covered → one line, skill or agent. Rules: `skill-scout`.

---

## 3. A harness that is broken fixes itself

Its owner rarely notices: the symptoms name nothing they know. When any of these
is true, act on it **once** in the session:

- `.rsc.json` exists and what it declares is not what is installed;
- the same hook seems to run several times;
- the harness is wired for an assistant that is not the one running.

Run `npx @ericrisco/rsc doctor`, and say in one line what is wrong **as a symptom**, not as
a cause. Then:

- **Nothing built** — `.rsc.json` without `.rsc/`: a clone. Name
  `npx @ericrisco/rsc@<catalogVersion in .rsc.json> sync`, that exact version, **never** `@latest`
  — a release nobody here adopted is drift. Ask in one line, **keep working either way**; silence
  is not a no, `.rsc/.no-harness` is.
- Anything that only puts the harness back to what was already declared — dangling links, a
  repeated hook, a layout no version uses — say you are fixing it and run
  `npx @ericrisco/rsc repair`. Restoring is not deciding, and a recoverable copy is kept.
- Anything that would change a decision — moving to another assistant, adopting a skill a
  teammate added, disarming a gate — **ask first**. A `git pull` never rewrites someone's
  machine.

Offer once per session; say nothing when the harness is healthy.

## 4. First contact

Before handling the first request of a session, check the workspace:

- No `02-DOCS/wiki/harness/user-profile.md` **and** no `.rsc/.no-harness` → invoke `init` first
  (one question: technical terms or analogies) before the task.
- A clone (`.rsc.json` committed) is not first contact: ask that once, in one line, then continue
  with their task; with `.rsc/.profile-offered`, never again.
- The user declines a harness here ("sin harness", "solo código") → create an empty
  `.rsc/.no-harness`, confirm in one line, and never auto-start `init` in this repo again.
- With a profile, this gate is inert. Never re-onboard.

## 5. «Recuerda esto»

A project or business fact goes to its topic page in `02-DOCS/wiki/` (link a new page from
`wiki/index.md`); say the path. Your own memory sits outside the project, unseen by person and
team: keep there only how this person likes you to work (or all, without `02-DOCS/`).

## Explain without assuming

Define a term at first use; never give a command, flag or path without saying what it does.

## Orientación (siempre)

Habla con la voz de `orient`: frases cortas, una idea por frase, al grano, y cada respuesta se entiende sola. Registro técnico o con analogías según `technical_level` en `02-DOCS/wiki/harness/user-profile.md`. Cierra cada turno con el **bloque-brújula** (📍 dónde estás · ➡️ siguiente, terminando en pregunta; ✅ y 🧭 cuando hay algo hecho o decidido). **Nunca termines en seco.** Protocolo completo: skill `orient` → `skills/orient/references/orientation-contract.md`. (Defiere a §2 el "¿instalo la skill que falta?".)

**rsc updates.** Claude Code, Codex, Gemini CLI, Cursor and OpenCode check for a new rsc on their own. In any other assistant, run `node .rsc/auto-update.mjs` once on the first turn of a session and relay any notice it prints in one line; "up to date" needs no mention.

<!-- rsc-suggest:end -->

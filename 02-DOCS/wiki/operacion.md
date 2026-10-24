# Operación: comandos, verificación y errores a evitar

## Comandos

```bash
npm run dev      # ÚNICO proceso: Express 5 + Vite middleware en http://localhost:3000 (host 0.0.0.0)
npm run build    # tsc -b && vite build  (verificación de tipos + binario estático)
npm run lint     # eslint . (salida limpia = sin problemas)
npm run test     # vitest
npm run start    # node server.ts (producción local)
```

## Publicación en GitHub

Repo: https://github.com/peterespanaadames-spec/compuflores (rama `main`, flujo directo en main — elegido en el arnés).

```bash
git add -A
git commit -m "mensaje descriptivo"
git push          # mensajes de error de stderr en PowerShell son ruido; verificar por 'main -> main'
```

`.gitignore` excluye (NUNCA quitar): `.env*` (sube solo `.env.example`), `data/`, `node_modules/`, `dist/`, `workspace/`, `.rsc/`, `.worktrees/`, enlaces de skills gestionados.

## Verificación de un cambio (checklist)

1. `npm run build` limpio (tipos TypeScript).
2. `npm run lint` limpio.
3. Prueba de flujo interactiva (login cliente/interno, acordeones del menú lateral, pantalla afectada).
4. Si el cambió `server.ts`: **no hay hot-reload del backend** — reiniciar `npm run dev` SIEMPRE. El frontend sí recalenta con Ctrl+F5 si el usuario ve versión vieja.

## Errores a evitar (trampas conocidas)

- **Procesos zombie en el 3000/24678**: HTTP 500 aunque el servidor "arranque". Diagnosticar con `netstat -ano | findstr ":3000"` y matar procesos obsoletos antes de reiniciar.
- **Editar server.ts con el servidor corriendo**: los cambios no se aplican hasta reiniciar.
- **Secretos**: `.env.local` tiene credenciales Supabase + `FRENYER_ACCESS_KEY`; nunca imprimirlas ni subirlas.
- **RLS**: no desactivar políticas; si una operación legítima fracasa, revisar la migración correspondiente o usar el bloque de servicio ya documentado (temporal hasta 0027 aplicada).
- **Colores**: prohibido reintroducir violetas legacy; seguir `docs/design-system/DESIGN_SYSTEM.md`.
- **Puerto 3000 ocupado por 'app compu a1'** (proyecto hermano): siempre verificar antes de levantar dev.

## Arnés rsc (memoria)

- La memoria vive en `02-DOCS/` y se actualiza al terminar cada tarea; este archivo es la hoja de operación.
- Para arnés enfermo: `npx @ericrisco/rsc@<versión de .rsc.json> sync` (no `@latest`) o `rsc repair`.

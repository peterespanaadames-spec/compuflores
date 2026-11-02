---
type: feature
title: Reemplazo de sesión al iniciar sesión con otra cuenta
status: done
created: 2026-11-02
tags: [sesiones, login, ux]
---

# Reemplazo de sesión en el login

## Intención
Durante las pruebas del bloque de seguridad, el usuario encontró fricción: al abrir `/login` con una sesión activa (p. ej. `fotocopiasfyp@gmail.com`), el sistema bloqueaba el ingreso de otra cuenta con un modal obligatorio («Tienes otra sesión abierta»). La auditoría original de sesiones dejaba abierto el diseño de la «política de reemplazo»; esta decisión la ratifica: **nuevo inicio = reemplazo automático**.

## Alcance
- `LoginPage.handleSubmit`: si hay sesión activa al presionar «Entrar/Registrarse», se llama `signOut()` (revoca la sesión real en Supabase, borra cookies y limpia identidad local) y continúa el flujo con las credenciales escritas. El texto de error bloqueante fue retirado.
- El modal informativo sigue apareciendo al VISITAR `/login` con sesión activa (con texto actualizado que avisa que introducir credenciales reemplaza automáticamente). El botón «Cerrar sesión» se mantiene para cerrarlo sin iniciar sesión.
- No se cambian endpoints: la revocación real ya existía (`POST /api/auth/logout`, 2026-11-02).

## Comportamientos garantizados
- Iniciar sesión con otra cuenta NUNCA pide cerrar manualmente la anterior si se introducen credenciales.
- La sesión anterior queda REVOCADA en servidor (no solo borrada del navegador) — no habrá «sesiones fantasma» vivas tras el reemplazo.
- El carrito/compras a medio proceso en `localStorage` no se tocan (comportamiento preexistente).

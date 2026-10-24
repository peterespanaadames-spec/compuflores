# Roles y acceso

Fuente: `src/lib/auth/roles.ts`, `ProtectedRoute`, `AuthContext`, `ShopPage`.

## Regla simple

**Cliente por defecto.** Solo es usuario interno quien:
1. está registrado en la base de usuarios internos del ERP (`GET /api/users`), **o**
2. trae un rol interno en su metadata de Supabase.

La lista de roles internos vive en UN solo sitio (`isInternalRole`) y la usan la tienda, las rutas protegidas y el login.

## Qué ve cada uno

| Tipo | Al iniciar sesión | Acceso |
| --- | --- | --- |
| Cliente de la tienda | Va a `/` (la tienda) | Menú de cuenta con: Mis Pedidos, Mis Compras (Facturación), Lista de Deseo, Mi Perfil; si visita `/dashboard` el sistema lo devuelve a la tienda |
| Usuario interno | Va a `/dashboard` | Panel ERP completo (DashboardLayout + Sidebar con acordeones) |

## Flujo de sesión

1. `POST /api/auth/login` → cookie de sesión en el dominio y sesión Supabase en el navegador.
2. `AuthContext.resolveProfile` arma el perfil (nombre, rol, permisos), lo guarda en localStorage (`frenyer_active_user`, `frenyer_user_role`, `frenyer_user_permissions`) y difunde el evento `frenyer:active-user-changed`.
3. `ProtectedRoute` permite el panel ERP solo si el rol efectivo es interno; los clientes van a `/`.
4. Al cerrar sesión se limpia cookie + claves `frenyer_*` de localStorage.

## Registro público

- La pantalla de registro (`/registro`) es **exclusiva de clientes de tienda** (rol fijo `cliente`); después de registrarse entra a la tienda.
- Los usuarios internos se crean desde el ERP (Config/usuarios) — nunca desde la pantalla pública.
- El botón de Google y la pestaña de clave maestra están **retirados de la pantalla** (aunque sus endpoints `auth/google` y `auth/local-login` siguen existiendo en el servidor).
- La pantalla de login no muestra credenciales por defecto ni estado de base de datos (no consulta `/api/supabase/status` al montar).

## Trampas conocidas

- Una sesión abierta de antes de la reforma de roles conserva el rol viejo en `frenyer_user_role`: al ver comportamientos extraños cerrar sesión y volver a entrar (o Ctrl+F5).
- El rol guardado en localStorage es parte del cache: la autoridad real está en `/api/users` y el servidor vuelve a verificar en cada llamada `/api/*`.

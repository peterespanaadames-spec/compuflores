# FTD: Portal de cliente con secciones cargadas individualmente

## Intención

Las cuatro pantallas del cliente de la tienda (Mis Pedidos, Mis Compras, Lista de Deseos, Mi Perfil) abren hoy con una única consulta que carga todo. Si una consulta falla, la pantalla entera falla. El cliente debe recibir cada pantalla con sus propios datos, cargados solo cuando la llama.

## Alcance

- `server.ts` — `GET /api/customer/portal` acepta `?section=orders|purchases|wishlist|profile` y responde solo esa parte (el bloque `customer` siempre va incluido porque la cabecera lo necesita). Sin parámetro, responde todo (retrocompatibilidad con la sincronización de la lista de deseos de la tienda).
- `src/modules/shop/components/CustomerPortal.tsx` — cabecera + datos del cliente se cargan al abrir; cada pestaña descarga sus datos al abrirla la primera vez (con caché en la sesión del modal), con su propio estado de carga, error y botón reintentar/actualizar.

## Checklist

- [x] Servidor: respuesta por secciones sin romper la llamada completa.
- [x] Portal: carga individual por pestaña y refresco por pestaña.
- [x] Compilación TypeScript y ESLint limpios.

## Evidencia

- `GET /api/customer/portal?section=orders` responde `{ customer, orders }` sin tocar compras/wishlist.
- Cada pestaña muestra "Cargando…" solo en su propio contenido.

## Próximo paso

Verificación en vivo en localhost:3000 con sesión de cliente.

# Portal del cliente (ecommerce)

Fuente: `src/modules/shop/components/CustomerPortal.tsx`, `ShopPage.tsx`, `server.ts` (rutas `/api/customer/*`).

## Las 4 pantallas

| Pantalla | Datos | Endpoint de carga |
| --- | --- | --- |
| Mis Pedidos | Historial con filtro por fecha + botón rastrear | `GET /api/customer/portal?section=orders` |
| Mis Compras (Facturación) | Facturas digitales con total y estado PAGADA | `GET /api/customer/portal?section=purchases` |
| Lista de Deseo | Tarjetas con foto/SKU/precio, agregar al carrito o quitar | `GET /api/customer/portal?section=wishlist` |
| Mi Perfil | Cuenta (nombre/cédula/teléfono), direcciones, cambio de contraseña | `GET /api/customer/portal?section=profile` (direcciones/contraseña con POST propios) |

## Cómo carga (según quedaron los cambios de 969fc4d)

- Al abrir el portal solo se descarga la **ficha del cliente** (`section=profile`) para la cabecera.
- Cada pestaña descarga **sus datos al abrirla por primera vez** (caché mientras el modal queda abierto) y el botón ⟳ recarga solo esa sección.
- Cada sección tiene su propio spinner, error y "Reintentar": un fallo de pedidos no bloquea deseos.
- Sin `section`, el endpoint sigue respondiendo todo (compatibilidad con los corazones ❤ de la tienda, que sincronizan wishlist por su lado).

## Correcciones aplicadas (no reintroducir)

- El perfil ya no muestra un teléfono fijo inventado (0412571444) ni una dirección "demo" hardcodeada: con datos vacíos se informa "No registrado"/"Aún no tienes direcciones registradas".
- El registro público crea cuentas de cliente con rol fijo (ver [roles-y-acceso.md](./roles-y-acceso.md)); el rol no se oferece para elegir en la pantalla.

## Componentes relacionados

- `OrderTrackerModal` — rastreo de pedido en vivo por número/cedula (`GET /api/orders/track/:query`).
- Corazón de wishlist en tarjetas de producto — Post a `/api/customer/wishlist` directo desde ShopPage; requiere sesión de cliente.

# FTD: Autocompletado de persona por cédula (API cedula.com.ve)

## Intención

Al incorporar una persona natural (cliente nuevo, datos de un pedido, perfil del portal), quien consulta el cedulado y obtiene nombres, RIF y ubicación de la persona y reparten los campos de tipo y ubicación con los datos del registro, y los campos quedan editables por el usuario.

## Cómo funciona el servicio

- API pagada: `GET https://api.cedula.com.ve/api/v1?app_id=<APP-ID>&token=<TOKEN>&nacionalidad=<V|E>&cedula=<N>`.
- Devuelve `{ primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, rif, cne: { estado, municipio, parroquia, centro_electoral } }`.
- Cada consulta gasta créditos prepagados de la cuenta del negocio. Credenciales van SOLO en variables de entorno del servidor: `CEDULA_APP_ID` y `CEDULA_TOKEN` (jamás en el cliente).

## Alcance

- `api/server.ts` — `GET /api/cedula-lookup?doc=V-12345678` (público para la tienda anónima, con límite de ritmo por IP y caché local de búsquedas exitosas en `data/cedula_lookups.json` para no gastar los créditos dos veces con lo mismo). Sin credenciales → 503 y la UI lo oculta.
- `src/lib/cedulaLookup.ts` (nuevo) — parser del documento (`V-12345678`/`V12345678`/`12345678`) y llamada al proxy con sesión.
- **Trigger mixto** (decisión del usuario):
  - Panel ERP (POS, Clientes, CxC, Cotizaciones): botón explícito «Consultar» junto al campo de documento.
  - Tienda (checkout del pedido) y portal del cliente: automático al dejar el campo con formato válido.
- Superficies: `Sales.tsx`, `Customers.tsx`, `Accounts.tsx`, `Quotes.tsx`, `ShopPage.tsx`, `CustomerPortal.tsx`.
- Fuera de alcance: proveedores y RIF jurídicos (el API solo cubre personas naturales V/E).

## Mapeo a los campos (todos editables después)

- Nombres y apellidos → campo nombre completo / razón social.
- RIF → campo «Cédula / RIF» (conviene tiparse al RIF de registro).
- Estado · Municipio · Parroquia → campo dirección (donde existe).

## Checklist

- [x] Servidor: endpoint con credenciales por ambiente, límite de ritmo y caché.
- [x] Cliente: lib compartida de consulta y normalización.
- [x] ERP: botón «Consultar» en los 4 formularios (solo tipo Natural V/E).
- [x] Tienda + portal: consulta automática sin tocar lo que ya escribió el usuario.
- [x] Compilación TypeScript y ESLint limpios.
- [ ] Credenciales cargadas en `.env.local` y Vercel (a manos del usuario).

## Evidencia

- Completa tras la verificación con `npm run dev` y sesión real en cada superficie.

## Próximo paso

Implementar servidor → lib → superficies → build/lint → verificación E2E con una cédula real de un cliente.

// Lista única de roles internos del ERP.
// Cualquier otro rol (por ejemplo 'cliente' o 'customer') es usuario de la tienda.
export const INTERNAL_ROLES = [
  'gerente',
  'administrador',
  'admin',
  'cajero',
  'ventas',
  'inventario',
  'almacenista',
  'contador',
  'superadmin',
  'soporte',
  'director',
  'propietario',
  'asociado',
  'personal'
] as const;

// Determina si un rol corresponde a un usuario interno del ERP.
export function isInternalRole(role?: string | null): boolean {
  return (INTERNAL_ROLES as readonly string[]).includes((role || '').trim().toLowerCase());
}

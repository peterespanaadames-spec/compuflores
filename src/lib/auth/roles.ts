// Lista única de roles internos del ERP.
// Cualquier otro rol (por ejemplo 'cliente' o 'customer') es usuario de la tienda.
const INTERNAL_ROLES = [
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

// Permiso por módulo (mismo vocabulario que usa el Sidebar en permissionKey).
const ALL_MODULE_PERMISSIONS = ['ventas', 'inventario', 'finanzas', 'reportes', 'usuarios'];

/**
 * Permisos por defecto según el rol, mismo vocabulario del servidor
 * (`defaultPermissionsForRole`). Se usa cuando el perfil del usuario no
 * trae permisos guardados, para que el menú lateral no quede recortado.
 */
export function defaultPermissionsForRole(role?: string | null): string[] {
  const r = (role || '').trim().toLowerCase();
  if (['admin', 'administrador', 'propietario', 'gerente', 'manager', 'superadmin', 'director'].includes(r)) {
    return [...ALL_MODULE_PERMISSIONS];
  }
  if (['cajero', 'cashier'].includes(r)) {
    return ['ventas'];
  }
  if (['almacenista', 'inventario'].includes(r)) {
    return ['inventario', 'reportes'];
  }
  if (['contador', 'soporte'].includes(r)) {
    return ['finanzas', 'reportes'];
  }
  return [...ALL_MODULE_PERMISSIONS];
}

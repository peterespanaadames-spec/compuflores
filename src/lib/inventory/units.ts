/** Unidades que admiten cantidades con decimales (venta e inventario). */
const DECIMAL_UNITS = ['kilogramo', 'metro'];

/**
 * ¿La unidad permite cantidades decimales?
 * Ej.: 0.5 kg de tornillos a granel, 1.25 m de cable.
 * La comparación es insensible a mayúsculas y acentos de mayúsculas.
 */
export function isDecimalUnit(unit?: string | null): boolean {
  if (!unit) return false;
  return DECIMAL_UNITS.includes(unit.trim().toLowerCase());
}

/** Limita una cantidad a 2 decimales (evita descuadres de centavos/gramos). */
export function roundQuantity2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Convierte un valor de input a cantidad válida (número, 2 decimales). */
export function parseQuantityInput(raw: string): number {
  const parsed = parseFloat(raw);
  return isNaN(parsed) ? 0 : roundQuantity2(parsed);
}

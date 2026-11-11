/** Unidades que admiten cantidades con decimales (venta e inventario). */
const DECIMAL_UNITS = [
  // Kilogramos
  'kilogramo', 'kilogramos', 'kilo', 'kilos', 'kg',
  // Litros
  'litro', 'litros', 'l',
  // Metros
  'metro', 'metros', 'mts', 'm'
];

/** Normaliza una unidad: minúsculas y sin acentos (ej. «Kilómetro» no aplica, pero «Kilogramo» = «kg»). */
function normalizeUnit(unit: string): string {
  return unit
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * ¿La unidad permite cantidades decimales?
 * Ej.: 0.5 kg de tornillos a granel, 1.25 L de pintura, 2.75 m de cable.
 * La comparación es insensible a mayúsculas, acentos y acepta abreviaturas (KG, L, MTS).
 */
export function isDecimalUnit(unit?: string | null): boolean {
  if (!unit) return false;
  return DECIMAL_UNITS.includes(normalizeUnit(unit));
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

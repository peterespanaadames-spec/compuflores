/**
 * Botón «Consultar cédula» reutilizable en los formularios de incorporación
 * del panel ERP (clientes, POS, cotizaciones, cuentas por cobrar).
 * Hereda el estilo de Button (variante secundaria) y devuelve los datos del
 * registro por medio de onFound; el formulario decide dónde colocarlos.
 */
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from './Button';
import { lookupCedula, parseCedulaDoc, type CedulaLookupData } from '../../lib/cedulaLookup';

export function CedulaLookupButton({
  docInput,
  disabled,
  onFound,
  onError
}: {
  /** Valor actual del campo «Cédula / RIF» del formulario. */
  docInput: string;
  disabled?: boolean;
  /** Datos confirmados por el registro (nombres, RIF, ubicación). */
  onFound: (data: CedulaLookupData) => void;
  /** Mensaje para la UI (toast) cuando la consulta no produce datos. */
  onError?: (message: string) => void;
}) {
  const [isConsulting, setIsConsulting] = useState(false);

  const runLookup = async () => {
    if (isConsulting) return;
    if (!parseCedulaDoc(docInput)) {
      onError?.('Escribe la cédula completa (ej. V-12345678) antes de consultar.');
      return;
    }
    setIsConsulting(true);
    const outcome = await lookupCedula(docInput);
    setIsConsulting(false);
    if (outcome.ok) {
      onFound(outcome.data);
    } else {
      onError?.(outcome.message);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={runLookup}
      disabled={disabled || isConsulting}
      title="Consulta los datos de la persona en el registro y rellena el formulario"
      style={{ height: 34, fontSize: 12, fontWeight: 700, padding: '0 14px', whiteSpace: 'nowrap', background: '#111827', color: '#ffffff', border: '1px solid #111827', boxShadow: 'none' }}
    >
      <Search size={14} style={{ marginRight: 6 }} />
      {isConsulting ? 'Consultando…' : 'Consultar cédula'}
    </Button>
  );
}

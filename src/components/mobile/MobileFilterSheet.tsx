import { SlidersHorizontal } from 'lucide-react';
import { MobileBottomSheet } from './MobileBottomSheet';

export function MobileFilterSheet({ open, onClose, onApply, children }: { open: boolean; onClose: () => void; onApply?: () => void; children: any }) {
  return (
    <MobileBottomSheet open={open} onClose={onClose} title="Filtros">
      <div className="mobile-filter-sheet__body">{children}</div>
      <div className="mobile-filter-sheet__actions">
        <button type="button" className="btn secondary" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn primary" onClick={() => { onApply?.(); onClose(); }}>Aplicar</button>
      </div>
    </MobileBottomSheet>
  );
}

export function MobileFilterTrigger({ onClick, activeCount = 0 }: { onClick: () => void; activeCount?: number }) {
  return (
    <button type="button" className="mobile-filter-trigger" onClick={onClick}>
      <SlidersHorizontal size={14} />
      <span>Filtros</span>
      {activeCount > 0 && <span className="mobile-filter-trigger__badge">{activeCount}</span>}
    </button>
  );
}

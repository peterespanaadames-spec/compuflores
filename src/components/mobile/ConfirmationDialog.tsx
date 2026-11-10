import { AlertTriangle } from 'lucide-react';

export function ConfirmationDialog({ open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false, onConfirm, onCancel }: { open: boolean; title: string; message: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="mobile-confirm__backdrop" onClick={onCancel}>
      <div className="mobile-confirm" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-confirm__icon"><AlertTriangle size={22} /></div>
        <div className="mobile-confirm__title">{title}</div>
        <div className="mobile-confirm__message">{message}</div>
        <div className="mobile-confirm__actions">
          <button type="button" className="btn secondary" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className={`btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

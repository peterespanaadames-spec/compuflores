import type { ReactNode } from 'react';

export function MobileBottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="mobile-more-sheet__backdrop" onClick={onClose}>
      <div className="mobile-more-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mobile-more-sheet__handle" />
        {title && (
          <div className="mobile-more-sheet__header">
            <span>{title}</span>
            <button type="button" onClick={onClose} aria-label="Cerrar">✕</button>
          </div>
        )}
        <div className="mobile-more-sheet__body">{children}</div>
      </div>
    </div>
  );
}

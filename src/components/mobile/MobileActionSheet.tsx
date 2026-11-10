import { MobileBottomSheet } from './MobileBottomSheet';

export function MobileActionSheet({ open, onClose, title, actions }: { open: boolean; onClose: () => void; title?: string; actions: { label: string; icon?: any; danger?: boolean; onClick: () => void }[] }) {
  return (
    <MobileBottomSheet open={open} onClose={onClose} title={title}>
      <div className="mobile-action-sheet">
        {actions.map((a, i) => {
          const Icon = a.icon;
          return (
            <button key={i} type="button" className={`mobile-action-sheet__item ${a.danger ? 'is-danger' : ''}`} onClick={() => { a.onClick(); onClose(); }}>
              {Icon && <Icon size={16} />}
              <span>{a.label}</span>
            </button>
          );
        })}
      </div>
    </MobileBottomSheet>
  );
}

import { Plus } from 'lucide-react';

export function FloatingActionButton({ onClick, label = 'Nuevo' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className="mobile-fab" onClick={onClick} aria-label={label}>
      <Plus size={20} />
    </button>
  );
}

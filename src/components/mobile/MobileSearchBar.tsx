import { Search, X } from 'lucide-react';

export function MobileSearchBar({ value, onChange, placeholder = 'Buscar…', onClear }: { value: string; onChange: (v: string) => void; placeholder?: string; onClear?: () => void }) {
  return (
    <div className="mobile-searchbar">
      <Search size={14} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {value && (
        <button type="button" onClick={() => { onChange(''); onClear?.(); }} aria-label="Limpiar">
          <X size={13} />
        </button>
      )}
    </div>
  );
}

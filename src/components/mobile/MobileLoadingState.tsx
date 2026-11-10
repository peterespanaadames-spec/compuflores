export function MobileLoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="mobile-loading-state">
      <div className="mobile-loading-state__spinner" />
      <span>{label}</span>
    </div>
  );
}

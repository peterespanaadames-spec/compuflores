export function MobilePagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mobile-pagination">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>Anterior</button>
      <span>{page} / {totalPages}</span>
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Siguiente</button>
    </div>
  );
}

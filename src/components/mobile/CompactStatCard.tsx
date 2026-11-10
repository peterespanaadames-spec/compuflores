export function CompactStatCard({ label, value, tone = 'default', subtitle }: { label: string; value: string | number; tone?: 'default' | 'success' | 'danger' | 'warning'; subtitle?: string }) {
  const color = tone === 'success' ? '#15803D' : tone === 'danger' ? '#DC2626' : tone === 'warning' ? '#D97706' : '#111827';
  return (
    <div className="compact-stat-card">
      <div className="compact-stat-card__label">{label}</div>
      <div className="compact-stat-card__value" style={{ color }}>{value}</div>
      {subtitle && <div className="compact-stat-card__subtitle">{subtitle}</div>}
    </div>
  );
}

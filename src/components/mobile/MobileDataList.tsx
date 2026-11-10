import type { ReactNode } from 'react';

export function MobileDataList({ children }: { children: ReactNode }) {
  return <div className="mobile-data-list">{children}</div>;
}

export function MobileDataListItem({ title, subtitle, right, onClick, leading }: { title: string; subtitle?: string; right?: ReactNode; onClick?: () => void; leading?: ReactNode }) {
  const Comp: any = onClick ? 'button' : 'div';
  return (
    <Comp className="mobile-data-list__item" onClick={onClick}>
      {leading && <div className="mobile-data-list__leading">{leading}</div>}
      <div className="mobile-data-list__main">
        <div className="mobile-data-list__title">{title}</div>
        {subtitle && <div className="mobile-data-list__subtitle">{subtitle}</div>}
      </div>
      {right && <div className="mobile-data-list__right">{right}</div>}
    </Comp>
  );
}

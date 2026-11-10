import type { ReactNode } from 'react';

export function MobilePageContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`content m-root mobile-page ${className}`.trim()}>{children}</div>;
}

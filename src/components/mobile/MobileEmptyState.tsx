import { Inbox } from 'lucide-react';

export function MobileEmptyState({ title, description, icon }: { title: string; description?: string; icon?: any }) {
  const Icon = icon || Inbox;
  return (
    <div className="mobile-empty-state">
      <Icon size={28} strokeWidth={1.5} />
      <div className="mobile-empty-state__title">{title}</div>
      {description && <div className="mobile-empty-state__desc">{description}</div>}
    </div>
  );
}

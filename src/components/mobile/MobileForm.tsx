import type { ReactNode } from 'react';

export function MobileFormSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mobile-form-section">
      {title && <div className="mobile-form-section__title">{title}</div>}
      <div className="mobile-form-section__body">{children}</div>
    </section>
  );
}

export function MobileFormField({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return (
    <label className="mobile-form-field">
      <span className="mobile-form-field__label">{label}</span>
      {children}
      {error && <span className="mobile-form-field__error">{error}</span>}
    </label>
  );
}

import type { ReactNode } from 'react';

interface DetailCardSectionProps {
  title: string;
  /** e.g. section-level Edit — keeps layout aligned with the title row. */
  headerAction?: ReactNode;
  children: ReactNode;
}

export function DetailCardSection({ title, headerAction, children }: DetailCardSectionProps) {
  return (
    <section className="border-border bg-muted/30 rounded-xl border p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-foreground text-xs font-semibold tracking-wide uppercase">
          {title}
        </h3>
        {headerAction !== undefined ? (
          <div className="text-foreground -mt-0.5 shrink-0">{headerAction}</div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

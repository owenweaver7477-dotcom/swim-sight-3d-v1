import React from 'react';

export default function PageHeader({ eyebrow, title, subtitle, children, action }) {
  return (
    <div className="mb-6 pb-5 border-b border-border">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          {eyebrow && (
            <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground mb-1.5">{eyebrow}</div>
          )}
          <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0 mt-1">{action}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
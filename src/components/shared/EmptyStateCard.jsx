import React from 'react';
import { cn } from '@/lib/utils';

export default function EmptyStateCard({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('p-10 rounded-xl border border-dashed border-slate-300 bg-white text-center', className)}>
      {Icon && <Icon className="w-9 h-9 text-slate-300 mx-auto mb-3" />}
      <div className="text-sm font-semibold text-slate-700 mb-1">{title}</div>
      {description && <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto mb-4">{description}</p>}
      {action && action}
    </div>
  );
}
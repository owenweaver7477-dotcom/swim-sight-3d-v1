import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

export default function HelpBox({ text, className = '' }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 ${className}`}>
      <HelpCircle className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
      <p className="text-[11px] text-slate-600 leading-relaxed flex-1">{text}</p>
      <button onClick={() => setDismissed(true)} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
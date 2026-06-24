import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function PilotReadinessWarning({ className = '' }) {
  return (
    <div className={`print:hidden rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-950 ${className}`} role="status">
      <div className="flex items-start gap-2">
        <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" aria-hidden="true" />
        <div>
          <div className="text-xs font-bold">Pilot recovery mode</div>
          <p className="mt-0.5 text-[11px] leading-5">
            Some AI and backend-assisted features are being hardened. Use manual coach review if AI processing is unavailable.
          </p>
        </div>
      </div>
    </div>
  );
}

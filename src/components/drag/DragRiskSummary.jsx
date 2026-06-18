import React from 'react';

const CATEGORIES = [
  { label: 'Body Line Risk',     zones: ['hips', 'torso', 'full_body'],  overlays: ['body_line', 'hip_drop'] },
  { label: 'Head Position Risk', zones: ['head'],                         overlays: ['head_lift'] },
  { label: 'Kick Width Risk',    zones: ['knees', 'ankles'],              overlays: ['kick_width'] },
  { label: 'Streamline Risk',    zones: ['streamline', 'full_body'],      overlays: ['streamline_break'] },
  { label: 'Overall Drag Risk',  zones: null,                             overlays: null },
];

const LEVEL_ORDER = { high: 3, medium: 2, low: 1, unknown: 0 };

const LEVEL_STYLE = {
  high:    'text-red-700 bg-red-50 border-red-200',
  medium:  'text-amber-700 bg-amber-50 border-amber-200',
  low:     'text-green-700 bg-green-50 border-green-200',
  unknown: 'text-slate-500 bg-slate-50 border-slate-200',
};

function dominantLevel(items) {
  if (!items.length) return 'unknown';
  return items.reduce((best, item) => {
    return (LEVEL_ORDER[item.drag_risk_level] || 0) > (LEVEL_ORDER[best] || 0)
      ? item.drag_risk_level
      : best;
  }, 'unknown');
}

export default function DragRiskSummary({ dragItems }) {
  const approved = dragItems.filter(d => d.approval_status === 'approved');
  if (!approved.length) return null;

  const rows = CATEGORIES.map(cat => {
    let relevant;
    if (cat.zones === null) {
      relevant = approved;
    } else {
      relevant = approved.filter(d =>
        cat.zones.includes(d.drag_zone) ||
        (cat.overlays && cat.overlays.includes(d.overlay_type))
      );
    }
    return { label: cat.label, level: dominantLevel(relevant) };
  });

  return (
    <div className="p-3 rounded-lg bg-secondary/40 border border-border space-y-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Hydrodynamic Risk Estimate</div>
      {rows.map(row => (
        <div key={row.label} className="flex items-center justify-between gap-2">
          <span className="text-xs text-foreground">{row.label}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${LEVEL_STYLE[row.level]}`}>
            {row.level === 'unknown' ? 'Unknown' : row.level.charAt(0).toUpperCase() + row.level.slice(1)}
          </span>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">
        Based on approved resistance overlays only. Not a lab-measured value.
      </p>
    </div>
  );
}

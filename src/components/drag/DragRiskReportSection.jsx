import React from 'react';
import { Waves } from 'lucide-react';

const RISK_STYLES = {
  high:    { label: 'High Risk',    cls: 'text-red-700 bg-red-50 border-red-200' },
  medium:  { label: 'Medium Risk',  cls: 'text-amber-700 bg-amber-50 border-amber-200' },
  low:     { label: 'Low Risk',     cls: 'text-green-700 bg-green-50 border-green-200' },
  unknown: { label: 'Unknown',      cls: 'text-slate-500 bg-slate-50 border-slate-200' },
};

const OVERLAY_LABELS = {
  body_line:        'Body Line Drag',
  frontal_area:     'Frontal Area Warning',
  flow_arrows:      'Water Flow Arrows',
  kick_width:       'Kick Width Zone',
  streamline_break: 'Streamline Break',
  head_lift:        'Head Lift Marker',
  hip_drop:         'Hip Drop Marker',
};

const ZONE_LABELS = {
  head: 'Head', shoulders: 'Shoulders', torso: 'Torso', hips: 'Hips',
  knees: 'Knees', ankles: 'Ankles', arms: 'Arms', streamline: 'Streamline', full_body: 'Full Body',
};

export default function DragRiskReportSection({ dragItems = [] }) {
  // Items may come from two sources:
  // 1. Internal (AIReportPage/PrintableReport): have approval_status + included_in_report — filter strictly.
  // 2. Public (SharedReportPage via getSharedReport): already pre-filtered by the backend, no approval fields — pass through.
  const included = dragItems.filter(d =>
    d.approval_status === undefined
      ? true // pre-filtered by backend — trust it
      : d.approval_status === 'approved' && d.included_in_report
  );
  if (!included.length) return null;

  return (
    <div className="px-8 py-6 border-t border-slate-200 print:break-inside-avoid">
      <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
        <span className="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
        Hydrodynamic Drag Focus
        <span className="text-sm font-normal text-slate-500">({included.length})</span>
      </h2>
      <p className="text-[11px] text-slate-500 mb-5 leading-relaxed">
        These overlays estimate likely resistance areas based on coach annotations and video evidence.
        They are coaching aids — not exact drag measurements.
      </p>

      <div className="space-y-4">
        {included.map((item, idx) => {
          const riskCfg = RISK_STYLES[item.drag_risk_level] || RISK_STYLES.unknown;
          return (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden print:border-slate-300 print:break-inside-avoid">
              <div className="px-5 py-3 bg-amber-50/60 border-b border-amber-100">
                <div className="flex items-start gap-3 flex-wrap">
                  <span className="text-xs font-bold text-slate-400 font-mono mt-0.5">{idx + 1}.</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-slate-900">
                        {OVERLAY_LABELS[item.overlay_type] || item.overlay_type || 'Drag Risk Overlay'}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${riskCfg.cls}`}>
                        {riskCfg.label}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {item.drag_zone && (
                        <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                          Zone: {ZONE_LABELS[item.drag_zone] || item.drag_zone}
                        </span>
                      )}
                      {item.stroke_phase && (
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.stroke_phase}
                        </span>
                      )}
                      {item.timestamp_start != null && (
                        <span className="text-[10px] font-mono text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                          @ {item.timestamp_start.toFixed(1)}s
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                        Coach reviewed
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 space-y-3">
                {item.measurement_summary && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Evidence Summary
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{item.measurement_summary}</p>
                  </div>
                )}
                {item.coach_notes && (
                  <div className="pl-4 border-l-4 border-amber-400 bg-amber-50/50 rounded-r-lg p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">
                      Coach Notes
                    </div>
                    <p className="text-sm text-slate-900 leading-relaxed">{item.coach_notes}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-400 mt-4 italic">
        Resistance overlays estimate likely friction areas from video evidence. They do not represent lab-measured force values.
      </p>
    </div>
  );
}

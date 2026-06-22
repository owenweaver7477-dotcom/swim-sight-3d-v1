import React, { useMemo, useState } from 'react';
import { Lock } from 'lucide-react';
import catalog from '@/lib/analysisOptionsCatalog.json';
import { optionState, satisfiedData } from '@/lib/analysisOptions';

// Pre-analysis checklist. Flag-gated, DEFAULT OFF (VITE_ENABLE_ANALYSIS_OPTIONS=true).
// Renders the shared catalog: premium options show a lock, options whose data
// prerequisites aren't met are disabled with a hint. On Run it hands the raw
// selection up; the SERVER (app/analysis_options.py) re-validates everything.
const ENABLED = import.meta.env.VITE_ENABLE_ANALYSIS_OPTIONS === 'true';

function defaultSelection() {
  const selection = {};
  for (const panel of catalog.panels) {
    for (const option of panel.options) {
      if (option.locked_on) selection[option.id] = option.default ?? true;
      else if (option.control === 'radio' && option.default) selection[option.id] = option.default;
    }
  }
  return selection;
}

export default function AnalysisSetup({ planKey = 'coach_studio', externalData = {}, onRun, running = false }) {
  const [selection, setSelection] = useState(defaultSelection);
  const data = useMemo(() => satisfiedData(selection, externalData), [selection, externalData]);

  if (!ENABLED) return null;

  const set = (id, value) => setSelection((prev) => ({ ...prev, [id]: value }));

  const renderControl = (option) => {
    const state = optionState(option, planKey, data);

    if (state.locked) {
      return (
        <div className="flex items-center justify-between gap-2 opacity-70">
          <span className="text-sm">{option.label}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
            <Lock className="h-3 w-3" /> Upgrade
          </span>
        </div>
      );
    }

    if (option.control === 'checkbox') {
      return (
        <label className={`flex items-center gap-2 ${state.disabled ? 'opacity-50' : ''}`}>
          <input type="checkbox" disabled={state.disabled} checked={!!selection[option.id]}
                 onChange={(e) => set(option.id, e.target.checked)} />
          <span className="text-sm">{option.label}{option.estimate ? ' (estimate)' : ''}</span>
          {state.disabled && <span className="text-[10px] text-muted-foreground">needs {state.missing.join(', ')}</span>}
        </label>
      );
    }

    if (option.control === 'select') {
      return (
        <label className="flex items-center justify-between gap-2">
          <span className="text-sm">{option.label}{option.required ? ' *' : ''}</span>
          <select className="rounded border px-2 py-1 text-sm" value={selection[option.id] || ''}
                  onChange={(e) => set(option.id, e.target.value)}>
            <option value="" disabled>Choose…</option>
            {option.choices.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
          </select>
        </label>
      );
    }

    if (option.control === 'radio') {
      return (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm">{option.label}</span>
          {option.choices.map((c) => (
            <label key={c} className="flex items-center gap-1 text-sm">
              <input type="radio" name={option.id} checked={(selection[option.id] || option.default) === c}
                     onChange={() => set(option.id, c)} />
              {c.replace(/_/g, ' ')}
            </label>
          ))}
        </div>
      );
    }

    if (option.control === 'number') {
      return (
        <label className="flex items-center justify-between gap-2">
          <span className="text-sm">{option.label}</span>
          <input type="number" className="w-28 rounded border px-2 py-1 text-sm" value={selection[option.id] ?? ''}
                 onChange={(e) => set(option.id, e.target.value === '' ? '' : Number(e.target.value))} />
        </label>
      );
    }

    return (
      <label className="flex items-center justify-between gap-2">
        <span className="text-sm">{option.label}</span>
        <input type="text" className="rounded border px-2 py-1 text-sm" value={selection[option.id] || ''}
               onChange={(e) => set(option.id, e.target.value)} />
      </label>
    );
  };

  return (
    <div className="space-y-5">
      {catalog.panels.map((panel) => (
        <section key={panel.id} className="rounded-2xl border border-border p-4">
          <h3 className="mb-3 text-sm font-semibold">{panel.title}</h3>
          <div className="space-y-2">
            {panel.options.map((option) => <div key={option.id}>{renderControl(option)}</div>)}
          </div>
        </section>
      ))}

      <button type="button" disabled={running} onClick={() => onRun?.(selection)}
              className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">
        {running ? 'Analysing…' : 'Run AI analysis →'}
      </button>
      <p className="text-[10px] text-muted-foreground">
        Premium options stay locked until upgrade. The server re-checks every option, tier, and data requirement — this form is convenience, not the trust boundary.
      </p>
    </div>
  );
}

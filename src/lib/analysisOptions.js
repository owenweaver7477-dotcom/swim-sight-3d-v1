import catalog from '@/lib/analysisOptionsCatalog.json';

// Mirror of the worker's app/analysis_options_catalog.json. The server
// (app/analysis_options.py) is the real trust boundary; these helpers drive the
// checklist UI only (lock premium, disable until prerequisite data exists).
// Keep this catalog file in sync with the worker copy.

export const analysisCatalog = catalog;

export function planAllows(plan, optionTier) {
  const unlocks = catalog.plan_unlocks || {};
  const allowed = unlocks[plan] || unlocks.coach_studio || [];
  return allowed.includes(optionTier);
}

export function indexOptions() {
  const out = {};
  for (const panel of catalog.panels) {
    for (const option of panel.options) out[option.id] = { ...option, panel: panel.id };
  }
  return out;
}

// Which prerequisite data keys are satisfied by the current selection (via each
// option's `provides`) plus any external data (e.g. swimmer height/mass).
export function satisfiedData(selection = {}, externalData = {}) {
  const options = indexOptions();
  const data = { ...externalData };
  for (const [id, value] of Object.entries(selection)) {
    const option = options[id];
    if (!option || !value) continue;
    for (const key of option.provides || []) {
      data[key] = option.kind === 'input' ? value : true;
    }
  }
  return data;
}

// UI state for one option given the coach's plan and the satisfied data.
export function optionState(option, plan, data = {}) {
  const allowed = planAllows(plan, option.tier);
  const missing = (option.requires || []).filter((key) => !data[key]);
  return { locked: !allowed, disabled: allowed && missing.length > 0, missing };
}

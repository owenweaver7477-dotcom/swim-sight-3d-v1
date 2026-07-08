import React, { useEffect, useMemo, useRef } from 'react';
import { Check, ChevronDown, Info, LockKeyhole, Scale, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AI_REPORT_OUTPUT_CATEGORIES,
  AI_REPORT_OUTPUTS,
  AI_REPORT_PRESETS,
  OUTPUT_AVAILABILITY,
  OUTPUT_AVAILABILITY_LABELS,
  buildAthleteProfileReadiness,
  buildReportOutputPlan,
  estimateAIProcessingMinutes,
  getReportOutputState,
} from '@/lib/aiReportOutputs';

const BADGE_CLASSES = {
  [OUTPUT_AVAILABILITY.AVAILABLE]: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  [OUTPUT_AVAILABILITY.ESTIMATE_ONLY]: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  [OUTPUT_AVAILABILITY.REQUIRES_ATHLETE_PROFILE]: 'border-amber-200 bg-amber-50 text-amber-800',
  [OUTPUT_AVAILABILITY.REQUIRES_CALIBRATION]: 'border-amber-200 bg-amber-50 text-amber-800',
  [OUTPUT_AVAILABILITY.REQUIRES_CAMERA_ANGLE]: 'border-amber-200 bg-amber-50 text-amber-800',
  [OUTPUT_AVAILABILITY.REQUIRES_LONGER_VIDEO]: 'border-amber-200 bg-amber-50 text-amber-800',
  [OUTPUT_AVAILABILITY.PREVIEW_ONLY]: 'border-slate-200 bg-slate-100 text-slate-600',
  [OUTPUT_AVAILABILITY.NOT_AVAILABLE]: 'border-slate-200 bg-slate-100 text-slate-600',
};

function missingLabel(key) {
  const labels = {
    body_mass: 'body mass',
    height: 'approximate height',
    calibration: 'known pool scale',
    side_view: 'side-view video',
    side_or_front_view: 'side or front view',
    video_timing: 'a 5+ second clip',
    start_footage: 'Start footage',
    turn_footage: 'Turn footage',
    start_turn_footage: 'Start, turn or breakout footage',
    underwater_footage: 'underwater or breakout footage',
    timing_metrics_enabled: 'validated timing metric support',
    distance_metrics_enabled: 'validated distance metric support',
    advanced_metrics_enabled: 'validated advanced metric support',
    estimated_drag_enabled: 'the internal estimated-drag pilot flag',
    skills_analysis_enabled: 'validated starts/turns analysis support',
  };
  return labels[key] || key.replaceAll('_', ' ');
}

export default function AIReportOutputSelector({
  stroke,
  cameraAngle,
  videoDurationSeconds,
  selectedOutputIds = [],
  onSelectedOutputIdsChange,
  athleteProfile = {},
  onAthleteProfileChange,
  selectedPreset,
  onSelectedPresetChange,
  coachConfirmedDraftAI,
  onCoachConfirmedDraftAIChange,
  features = {},
  onManualReview,
  manualReviewPending = false,
}) {
  const readiness = useMemo(() => buildAthleteProfileReadiness({
    athleteProfile,
    stroke,
    cameraAngle,
    videoDurationSeconds,
    features,
  }), [athleteProfile, stroke, cameraAngle, videoDurationSeconds, features]);
  const plan = useMemo(() => buildReportOutputPlan({ selectedOutputIds, readiness }), [selectedOutputIds, readiness]);

  // Feature-flag keys that are OFF in this deployment. Outputs that require one of
  // these can never be enabled here, so they are hidden for the pilot instead of
  // rendering as permanently locked cards.
  const disabledFeatureKeys = useMemo(
    () => Object.keys(features).filter((key) => features[key] === false),
    [features],
  );
  const isPermanentlyLocked = (output) => {
    const availability = getReportOutputState(output, readiness);
    return availability.missing.some((key) => disabledFeatureKeys.includes(key));
  };

  // Default to the basic technical scan once, so a coach can upload -> send for AI
  // review without studying the output list. Coach can still change preset/outputs.
  const defaultedRef = useRef(false);
  useEffect(() => {
    if (defaultedRef.current) return;
    if (selectedOutputIds.length > 0 || (selectedPreset && selectedPreset !== '')) { defaultedRef.current = true; return; }
    const basic = AI_REPORT_PRESETS.find((preset) => preset.id === 'basic_technical_scan');
    if (!basic) return;
    defaultedRef.current = true;
    onSelectedPresetChange?.(basic.id);
    onSelectedOutputIdsChange?.(basic.outputIds.filter((id) => getReportOutputState(id, readiness).selectable));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOutputIds, selectedPreset, readiness]);

  const updateProfile = (key, value) => onAthleteProfileChange?.({ ...athleteProfile, [key]: value });
  const toggleOutput = (id) => {
    const active = selectedOutputIds.includes(id);
    onSelectedOutputIdsChange?.(active ? selectedOutputIds.filter((item) => item !== id) : [...selectedOutputIds, id]);
    onSelectedPresetChange?.('custom');
  };
  const choosePreset = (preset) => {
    onSelectedPresetChange?.(preset.id);
    if (preset.manualOnly) {
      onSelectedOutputIdsChange?.([]);
      onManualReview?.();
      return;
    }
    const eligible = preset.outputIds.filter((id) => getReportOutputState(id, readiness).selectable);
    onSelectedOutputIdsChange?.(eligible);
  };

  return (
    <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-4" aria-labelledby="ai-report-outputs-title">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-700" aria-hidden="true" />
        <div>
          <h3 id="ai-report-outputs-title" className="text-sm font-bold text-slate-950">Choose AI report outputs</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">Choose what the AI-assisted draft should attempt to produce. Locked and preview outputs are never silently sent to the worker.</p>
        </div>
      </div>

      {/* Advanced athlete profile — collapsed by default: it only unlocks estimate-only
          metrics, most of which are behind deployment feature flags. */}
      <details className="group rounded-lg border border-slate-200 bg-slate-50">
        <summary className="flex cursor-pointer list-none items-center gap-2 p-3">
          <Scale className="h-4 w-4 flex-shrink-0 text-slate-700" aria-hidden="true" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-slate-900">Advanced: athlete profile (optional)</h4>
            <p className="mt-0.5 text-[11px] leading-4 text-slate-600">Only needed for estimate-only metrics such as body-mass-based calculations. Not shown on public reports.</p>
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-slate-500 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="space-y-3 border-t border-slate-200 p-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="analysis-body-mass" className="text-[11px] text-slate-700">Body mass / weight (kg)</Label>
            <Input id="analysis-body-mass" type="number" min="20" max="250" inputMode="decimal" value={athleteProfile.body_mass_kg ?? ''} onChange={(event) => updateProfile('body_mass_kg', event.target.value === '' ? '' : Number(event.target.value))} className="mt-1 h-10 bg-white" />
          </div>
          <div>
            <Label htmlFor="analysis-height" className="text-[11px] text-slate-700">Approximate height (cm)</Label>
            <Input id="analysis-height" type="number" min="100" max="250" inputMode="decimal" value={athleteProfile.approximate_height_cm ?? ''} onChange={(event) => updateProfile('approximate_height_cm', event.target.value === '' ? '' : Number(event.target.value))} className="mt-1 h-10 bg-white" />
          </div>
          <div>
            <Label className="text-[11px] text-slate-700">Age group / category</Label>
            <Select value={athleteProfile.age_group || ''} onValueChange={(value) => updateProfile('age_group', value)}>
              <SelectTrigger className="mt-1 h-10 bg-white"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="junior">Junior age group</SelectItem>
                <SelectItem value="youth">Youth age group</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="masters">Masters</SelectItem>
                <SelectItem value="prefer_not_to_record">Prefer not to record</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px] text-slate-700">Pool length / scale</Label>
            <Select value={String(athleteProfile.pool_length_m || '')} onValueChange={(value) => updateProfile('pool_length_m', Number(value))}>
              <SelectTrigger className="mt-1 h-10 bg-white"><SelectValue placeholder="Not calibrated" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 m known reference</SelectItem>
                <SelectItem value="50">50 m known reference</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="analysis-wingspan" className="text-[11px] text-slate-700">Wingspan (cm, optional)</Label>
            <Input id="analysis-wingspan" type="number" min="100" max="280" inputMode="decimal" value={athleteProfile.wingspan_cm ?? ''} onChange={(event) => updateProfile('wingspan_cm', event.target.value === '' ? '' : Number(event.target.value))} className="mt-1 h-10 bg-white" />
          </div>
          <div>
            <Label className="text-[11px] text-slate-700">Skill level (optional)</Label>
            <Select value={athleteProfile.skill_level || ''} onValueChange={(value) => updateProfile('skill_level', value)}>
              <SelectTrigger className="mt-1 h-10 bg-white"><SelectValue placeholder="Not recorded" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="developing">Developing</SelectItem>
                <SelectItem value="club">Club</SelectItem>
                <SelectItem value="state_national">State / national</SelectItem>
                <SelectItem value="elite">Elite</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="analysis-race-context" className="text-[11px] text-slate-700">Known PB / race context (optional)</Label>
            <Input id="analysis-race-context" value={athleteProfile.race_context || ''} onChange={(event) => updateProfile('race_context', event.target.value)} placeholder="Example: 100 m training pace" className="mt-1 h-10 bg-white" />
          </div>
        </div>
        <label className="flex min-h-11 items-start gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
          <input type="checkbox" className="mt-0.5 h-4 w-4" checked={athleteProfile.calibration_available === true} onChange={(event) => updateProfile('calibration_available', event.target.checked)} />
          <span><strong>Known scale confirmed.</strong> The selected pool length or lane reference is visible and appropriate for internal estimate eligibility.</span>
        </label>
        </div>
      </details>

      <div>
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Report presets</div>
        <div className="flex flex-wrap gap-2">
          {AI_REPORT_PRESETS.map((preset) => (
            <button key={preset.id} type="button" onClick={() => choosePreset(preset)} className={`min-h-10 rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${selectedPreset === preset.id ? 'border-cyan-500 bg-cyan-50 text-cyan-950' : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300'}`}>
              {preset.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-4 text-slate-500">A preset selects only outputs currently eligible for this clip. Preview-only items remain locked and visible below.</p>
      </div>

      {AI_REPORT_OUTPUT_CATEGORIES.map((category) => {
        // Hide outputs whose only path to availability is a feature flag that is off in
        // this deployment — they would render as permanently locked noise for the pilot.
        const visibleOutputs = AI_REPORT_OUTPUTS.filter((output) => output.category === category.id && !isPermanentlyLocked(output));
        if (!visibleOutputs.length) return null;
        return (
        <div key={category.id}>
          <h4 className="mb-2 text-xs font-bold text-slate-900">{category.label}</h4>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {visibleOutputs.map((output) => {
              const availability = getReportOutputState(output, readiness);
              const selected = selectedOutputIds.includes(output.id);
              return (
                <button key={output.id} type="button" disabled={!availability.selectable} aria-pressed={selected} onClick={() => toggleOutput(output.id)} className={`min-h-[132px] rounded-md border p-3 text-left transition-colors ${selected ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200 bg-white'} ${availability.selectable ? 'hover:border-cyan-300' : 'cursor-not-allowed opacity-75'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">{output.label}</span>
                    {selected ? <Check className="h-4 w-4 flex-shrink-0 text-cyan-700" aria-hidden="true" /> : !availability.selectable ? <LockKeyhole className="h-4 w-4 flex-shrink-0 text-slate-500" aria-hidden="true" /> : null}
                  </div>
                  <p className="mt-1 text-[10px] leading-4 text-slate-600">{output.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${BADGE_CLASSES[availability.state]}`}>{OUTPUT_AVAILABILITY_LABELS[availability.state]}</span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-600">{output.creditWeight} estimated {output.creditWeight === 1 ? 'credit' : 'credits'}</span>
                    {output.coachReviewOnly && <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-semibold text-blue-700">Coach review required</span>}
                  </div>
                  {availability.missing.length > 0 && <p className="mt-2 text-[9px] leading-4 text-amber-800">Requires: {availability.missing.map(missingLabel).join(', ')}.</p>}
                </button>
              );
            })}
          </div>
        </div>
        );
      })}

      <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 text-xs text-cyan-950">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <div>
            <div className="font-bold">Selection readiness</div>
            <p className="mt-1 text-[11px] leading-5">{plan.selected.length} report outputs selected. {plan.locked.length ? `${plan.locked.length} unavailable selections must be removed.` : 'Every selected output is eligible for this request.'}</p>
            <p className="mt-1 text-[11px] leading-5"><strong>Estimated processing time:</strong> {estimateAIProcessingMinutes(plan.selected)}. This is a planning estimate; video workload and worker availability can change it.</p>
          </div>
        </div>
      </div>

      <label className="flex min-h-12 items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
        <input type="checkbox" className="mt-0.5 h-4 w-4" checked={coachConfirmedDraftAI === true} onChange={(event) => onCoachConfirmedDraftAIChange?.(event.target.checked)} />
        <span><strong>I understand this creates an AI-assisted draft.</strong> Every finding, estimate, cue and drill requires coach review before report sharing.</span>
      </label>

      {manualReviewPending && <p className="text-xs text-slate-600" role="status">Opening manual Coach Studio…</p>}
    </section>
  );
}

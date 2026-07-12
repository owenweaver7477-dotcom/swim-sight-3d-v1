import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AnnotationCanvas from './AnnotationCanvas';
import { formatTimestamp } from '@/lib/annotationRender';
import { DEFAULT_DRILLS } from '@/lib/defaultDrills';
import { searchAndRankDrills, drillSummary } from '@/lib/drillMatching';
import { createPortal } from 'react-dom';
import FeatureStatusBadge from '@/components/status/FeatureStatusBadge';
import {
  BookmarkPlus,
  CheckCircle2,
  Download,
  FastForward,
  Gauge,
  Lock,
  Maximize2,
  PencilLine,
  Plus,
  Rewind,
  Search,
  Share2,
  SlidersHorizontal,
  Star,
  SkipBack,
  SkipForward,
  X,
} from 'lucide-react';

// Lightweight, safe note-keyword boost for drill ranking. It only ENRICHES the text
// used for matching (never the saved note), nudging obvious faults toward the right drills.
function expandNoteForDrills(note = '') {
  const t = String(note).toLowerCase();
  const extra = [];
  if (/\bwide\b/.test(t) && /\bkick\b/.test(t)) extra.push('narrow knees', 'wide knees', 'kick line', 'timing');
  if ((/\blate\b/.test(t) || /\bearly\b/.test(t)) && /\btiming\b|\bkick\b|\bfoot\b/.test(t)) extra.push('timing', 'glide', 'late foot turn', 'two kicks');
  if (/\bhead\b/.test(t) && (/\bearly\b/.test(t) || /\blift/.test(t) || /\bup\b/.test(t))) extra.push('breath timing', 'low breath', 'head lift', 'body line');
  if (/\bpull\b/.test(t) && /\bwide\b/.test(t)) extra.push('narrow pull', 'catch', 'scull');
  if (/\bhip|body line|drop/.test(t)) extra.push('body line', 'hips', 'streamline');
  return extra.length ? `${note} ${extra.join(' ')}` : note;
}

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
const APPROX_FRAME_STEP = 1 / 30;

// ── 3-step Coach Studio ──────────────────────────────────────────────────────
const STUDIO_STEPS = [
  { key: 'analysis', label: 'Analysis' },
  { key: 'findings', label: 'Findings' },
  { key: 'drills', label: 'Drills & Comments' },
];
// Multi-select technique tags for the finding editor. Stored in
// raw_ai_payload.fault_tags (never public — the sanitizer strips the payload).
const FINDING_TAGS = [
  'body_line', 'head_lift', 'wide_knees', 'rushed_line_reset', 'dropped_elbow',
  'short_extension', 'timing_break', 'low_hips', 'breath_timing', 'recovery_timing',
];
const SEVERITY_OPTIONS = ['low', 'medium', 'high'];
// Client-side marker colours for key moments (no colour column by design —
// colours rotate by list position, matching the reference visuals).
const MOMENT_COLORS = ['bg-amber-400', 'bg-sky-400', 'bg-orange-400', 'bg-emerald-400', 'bg-fuchsia-400', 'bg-cyan-400'];
const tagLabel = (value = '') => String(value).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const THUMBNAIL_MAX_WIDTH = 480;

// Rich, stroke-specific phase lists for the fullscreen phase picker. Coaches tap a phase
// chip to tag the moment; the raw label is stored on the finding when no studio key matches.
const STROKE_PHASES = {
  breaststroke: ['Start / breakout', 'Entry', 'Catch', 'Pull', 'Breath', 'Hand recovery', 'Kick setup', 'Knee position', 'Foot turn', 'Kick drive', 'Kick finish', 'Glide', 'Body line', 'Turn', 'Finish'],
  freestyle: ['Entry', 'Extension', 'Catch setup', 'Catch', 'Pull', 'Push', 'Exit', 'Recovery', 'Breath', 'Body rotation', 'Kick timing', 'Body line', 'Turn', 'Breakout', 'Finish'],
  backstroke: ['Entry', 'Catch setup', 'Catch', 'Pull', 'Push', 'Exit', 'Recovery', 'Rotation', 'Kick timing', 'Head position', 'Body line', 'Turn', 'Breakout', 'Finish'],
  butterfly: ['Entry', 'Catch', 'Pull', 'Push', 'Recovery', 'First kick', 'Second kick', 'Breath timing', 'Head position', 'Body line', 'Turn', 'Breakout', 'Finish'],
};
const DEFAULT_PHASE_LABELS = ['Entry', 'Catch', 'Pull', 'Breath', 'Recovery', 'Body line', 'Turn', 'Breakout', 'Finish'];
// IM shows a stroke-segment selector first, then that segment's phase list.
const IM_SEGMENTS = [
  { key: 'butterfly', label: 'Fly' },
  { key: 'backstroke', label: 'Back' },
  { key: 'breaststroke', label: 'Breast' },
  { key: 'freestyle', label: 'Free' },
];

function normStrokeKey(value) {
  const t = String(value || '').toLowerCase();
  if (t.includes('breast')) return 'breaststroke';
  if (t.includes('back')) return 'backstroke';
  if (t.includes('fly') || t.includes('butter')) return 'butterfly';
  if (t.includes('free')) return 'freestyle';
  if (t.includes('medley') || t.includes('individual') || t === 'im') return 'im';
  return '';
}

// Draft persistence: keep the fullscreen workspace open-state and unsaved inputs in
// sessionStorage so a tab switch, refetch, or iPad Safari tab-reload never loses coach work.
function readStudioDraft(key) {
  if (!key) return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeStudioDraft(key, value) {
  if (!key) return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode / quota) — drafts just aren't persisted */
  }
}

// Surface the real save error to the coach instead of only logging it.
function readableError(error) {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  return error.message || error.details || error.hint || error.code || 'Save failed';
}

// Reuse existing default drill data (no schema change) to suggest drills for the
// selected stroke + phase. Falls back to stroke-only, then to any drills.
function recommendedDrillsFor(stroke, phase) {
  const s = String(stroke || '').toLowerCase();
  const p = String(phase || '').toLowerCase();
  const byStroke = DEFAULT_DRILLS.filter((d) => String(d.stroke || '').toLowerCase() === s);
  const pool = byStroke.length ? byStroke : DEFAULT_DRILLS;
  if (!p) return pool.slice(0, 8);
  const words = p.split(/\s+/).filter((w) => w.length > 2);
  const matched = pool.filter((d) => {
    const hay = `${d.phase || ''} ${d.fault_tags || ''}`.toLowerCase();
    return words.some((w) => hay.includes(w));
  });
  return (matched.length ? matched : pool).slice(0, 8);
}

function estimateFps(video = {}) {
  const value = Number(video?.fps || video?.video_fps || video?.metadata?.fps || video?.review_context?.fps);
  return Number.isFinite(value) && value > 0 ? value : 30;
}

function captureVideoThumbnail(videoNode) {
  try {
    if (!videoNode?.videoWidth || !videoNode?.videoHeight) return null;
    const scale = Math.min(1, THUMBNAIL_MAX_WIDTH / videoNode.videoWidth);
    const width = Math.max(1, Math.round(videoNode.videoWidth * scale));
    const height = Math.max(1, Math.round(videoNode.videoHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.drawImage(videoNode, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.68);
  } catch {
    return null;
  }
}

export default function CoachDrawStudio({
  persistKey,
  signedVideoUrl,
  signedVideoError,
  video,
  onSaveAnnotation,
  onCaptureTimestamp,
  onStartFindingFromMoment,
  onSaveMarker,
  seekRequest,
  drawRequest,
  savingMarker,
  findings = [],
  keyStamps = [],
  drillOptions = [],
  autoOpenFullscreen = false,
  studioMode = false,
  reviewMode = 'manual',
  reportFinalised = false,
  canFinalise = false,
  canReopen = false,
  reopenedForEditing = false,
  onReopen,
  reopening = false,
  onReshare,
  resharing = false,
  linkedEvidenceOptions = [],
  favourites = [],
  canManageFavourites = false,
  onToggleFavourite,
  onSaveCustomFavourite,
  onBackToAnalyse,
  onReviewAISuggestions,
  onCreateFinding,
  onFinaliseReport,
  onPrintReport,
  shareLink,
  swimmer,
  onFinalise,
  canEdit = true,
  report,
  annotations = [],
  onUpdateFinding,
  onDeleteFinding,
  savingFindingDetails = false,
  onSaveComments,
  savingComments = false,
}) {
  const inlineVideoRef = useRef(null);
  const fullscreenVideoRef = useRef(null);
  const storageKey = persistKey ? `ssd-studio-${persistKey}` : null;
  // Restore any saved draft SYNCHRONOUSLY via lazy state initialisers. Doing this in an
  // effect (the old approach) left a one-render "defaults" window that raced with the
  // persist effect and clobbered the saved phase/drills/note. Lazy init also means the
  // workspace restores instantly on tab-return — no waiting on signedVideoUrl.
  const savedDraft = useMemo(() => readStudioDraft(storageKey) || {}, [storageKey]);
  const [drawing, setDrawing] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(
    () => (typeof savedDraft.open === 'boolean' ? savedDraft.open : autoOpenFullscreen),
  );
  const [timestamp, setTimestamp] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [title, setTitle] = useState('');
  const [coachNote, setCoachNote] = useState('');
  const [includeInReport, setIncludeInReport] = useState(false);
  const [linkedFindingId, setLinkedFindingId] = useState('');
  // Empty string = no phase selected (no "Key frame" sentinel). A legacy 'Key frame'
  // value from an older draft is treated as no selection.
  const [markerLabel, setMarkerLabel] = useState(
    () => (typeof savedDraft.phase === 'string' && savedDraft.phase !== 'Key frame' ? savedDraft.phase : ''),
  );
  const [markerNote, setMarkerNote] = useState(() => (typeof savedDraft.note === 'string' ? savedDraft.note : ''));
  const [markerCue, setMarkerCue] = useState('');
  const [markerIncludeInReport, setMarkerIncludeInReport] = useState(false);
  const [controlsExpanded, setControlsExpanded] = useState(false);
  // Video-first: the findings drawer starts open on desktop and collapsed on
  // tablet/phone so the video dominates; the coach toggles it from the top bar.
  const [panelOpen, setPanelOpen] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return true;
    return window.matchMedia('(min-width: 1024px)').matches;
  });
  // ── 3-step Coach Studio: 'analysis' | 'findings' | 'drills' ──────────────────
  // Pure UI state (persisted in the same sessionStorage draft). Every step's
  // content stays MOUNTED (hidden via CSS) so the video element never remounts
  // and in-progress input is never lost when switching steps.
  const [currentStep, setCurrentStep] = useState(
    () => (['analysis', 'findings', 'drills'].includes(savedDraft.step) ? savedDraft.step : 'analysis'),
  );
  // Step 2 editor: which existing finding is selected (null = create a new one).
  const [selectedFindingId, setSelectedFindingId] = useState(null);
  // Editable copies of the selected finding's content fields (loaded on select).
  const [editObservation, setEditObservation] = useState('');
  const [editCue, setEditCue] = useState('');
  const [editSeverity, setEditSeverity] = useState('medium');
  const [editPhase, setEditPhase] = useState('');
  const [editTags, setEditTags] = useState([]);
  const [editNotes, setEditNotes] = useState('');
  // Step 1: custom moment form.
  const [customMomentOpen, setCustomMomentOpen] = useState(false);
  const [customMomentName, setCustomMomentName] = useState('');
  const [customMomentNote, setCustomMomentNote] = useState('');
  // Step 3: coach comments (hydrated from the report; saved via onSaveComments).
  const [privateNotes, setPrivateNotes] = useState(() => report?.review_context?.private_coach_notes || '');
  const [swimmerFeedback, setSwimmerFeedback] = useState(() => report?.coach_summary || '');
  const [commentsDirty, setCommentsDirty] = useState(false);
  // Always-fresh mirror of the comment fields for the post-save dirty check.
  const commentsRef = useRef({ swimmerFeedback: '', privateNotes: '' });
  commentsRef.current = { swimmerFeedback, privateNotes };
  // Step 3: which finding the drill panel is attaching drills to.
  const [drillFindingId, setDrillFindingId] = useState(null);
  const fps = estimateFps(video);
  const approxFrame = Math.max(0, Math.round((timestamp || 0) * fps));
  const [selectedDrills, setSelectedDrills] = useState(
    () => (Array.isArray(savedDraft.selectedDrills) ? savedDraft.selectedDrills.filter((drill) => drill && drill.title) : []),
  );
  const [drillQuery, setDrillQuery] = useState('');
  const [imSegment, setImSegment] = useState(() => (typeof savedDraft.imSegment === 'string' ? savedDraft.imSegment : 'butterfly'));
  const strokeKey = normStrokeKey(video?.stroke_type);
  const isIM = strokeKey === 'im';
  const phaseStrokeKey = isIM ? imSegment : strokeKey;
  const quickLabels = STROKE_PHASES[phaseStrokeKey] || DEFAULT_PHASE_LABELS;
  const [savingFinding, setSavingFinding] = useState(false);
  const [addedFindingCount, setAddedFindingCount] = useState(0);
  const [lastCapturedMomentId, setLastCapturedMomentId] = useState(null);
  const [finaliseFlow, setFinaliseFlow] = useState('idle'); // idle | confirm | saving | ready
  const [drillMode, setDrillMode] = useState(() => (savedDraft.drillMode === 'custom' ? 'custom' : 'suggested')); // 'suggested' | 'custom'
  const [customDrillTitle, setCustomDrillTitle] = useState('');
  const [customDrillSummary, setCustomDrillSummary] = useState('');
  const [customDrillCue, setCustomDrillCue] = useState('');
  const [customDrillWhy, setCustomDrillWhy] = useState('');
  const [actionFeedback, setActionFeedback] = useState(null); // { type: 'success' | 'error', msg }
  const [drawingSaving, setDrawingSaving] = useState(false);
  const [reopenConfirm, setReopenConfirm] = useState(false);
  const [linkChoice, setLinkChoice] = useState('auto'); // 'auto' | 'none' | <annotationId>
  const phaseSelected = Boolean(markerLabel && markerLabel.trim());
  // Finalised/shared reports are read-only. canEdit (passed by the parent) already folds
  // in !isReportFinalised, so !canEdit here means "cannot save into this report".
  const readOnly = !canEdit;
  const readOnlyReason = reportFinalised
    ? 'This report is shared/finalised and read-only.'
    : 'This report is read-only for your account.';
  const drillPool = (drillOptions && drillOptions.length) ? drillOptions : DEFAULT_DRILLS;
  const drillNoteText = expandNoteForDrills(markerNote);
  const draftFindingForDrills = { stroke_phase: markerLabel, phase: markerLabel, observation: drillNoteText, coach_sees: drillNoteText, fault_tag: drillNoteText };
  // Ranked + searchable drill list for the fullscreen picker (shows well beyond 8).
  const rankedDrills = searchAndRankDrills(drillPool, {
    query: drillQuery,
    finding: draftFindingForDrills,
    strokeType: isIM ? phaseStrokeKey : video?.stroke_type,
    limit: 40,
  });
  const drillListForPicker = rankedDrills.length ? rankedDrills : recommendedDrillsFor(isIM ? phaseStrokeKey : video?.stroke_type, markerLabel);
  const isDrillSelected = (id) => selectedDrills.some((drill) => drill.id === id);
  const addLibraryDrill = (drill) => {
    if (!drill) return;
    setSelectedDrills((prev) => (prev.some((item) => item.id === drill.id) ? prev : [...prev, {
      id: drill.id,
      title: drill.title,
      summary: drillSummary(drill) || drill.report_summary || drill.purpose || '',
      cue: drill.coaching_cue || '',
      why: '',
      custom: false,
    }]));
  };
  const addCustomDrill = () => {
    const title = customDrillTitle.trim();
    if (!title) return;
    const id = `custom-${title.toLowerCase()}`;
    setSelectedDrills((prev) => (prev.some((item) => item.id === id) ? prev : [...prev, {
      id,
      title,
      summary: customDrillSummary.trim(),
      cue: customDrillCue.trim(),
      why: customDrillWhy.trim(),
      custom: true,
    }]));
    setCustomDrillTitle('');
    setCustomDrillSummary('');
    setCustomDrillCue('');
    setCustomDrillWhy('');
  };
  const removeDrill = (id) => setSelectedDrills((prev) => prev.filter((drill) => drill.id !== id));
  // Clicking a phase selects it; clicking the selected phase again clears it.
  const togglePhase = (label) => setMarkerLabel((prev) => (prev === label ? '' : label));
  // Switching IM segment clears the phase if it isn't valid for the new segment.
  const selectImSegment = (key) => {
    setImSegment(key);
    const nextPhases = STROKE_PHASES[key] || DEFAULT_PHASE_LABELS;
    setMarkerLabel((prev) => (prev && nextPhases.includes(prev) ? prev : ''));
  };

  // Favourite drills (club-scoped) resolved to displayable drill objects; library refs
  // resolve against the loaded drill pool, custom favourites are self-contained snapshots.
  const favouriteDrillList = (favourites || []).map((fav) => {
    if (fav.type === 'custom') {
      return { id: `fav-custom-${String(fav.title || '').toLowerCase()}`, title: fav.title, summary: fav.summary || '', cue: fav.cue || '', custom: true };
    }
    const found = drillPool.find((drill) => drill.id === fav.id);
    if (!found) return null;
    return { id: found.id, title: found.title, summary: drillSummary(found) || found.report_summary || found.purpose || '', cue: found.coaching_cue || '', custom: false };
  }).filter(Boolean);
  const isLibraryFavourited = (id) => (favourites || []).some((fav) => fav.type === 'library' && fav.id === id);

  // Recently-used drills from this report's findings (no storage — in-session convenience).
  const recentDrills = [];
  const seenRecentDrill = new Set();
  (findings || []).forEach((finding) => {
    const title = finding.linked_drill_title || finding.drill;
    if (!title) return;
    const key = String(title).toLowerCase();
    if (seenRecentDrill.has(key)) return;
    seenRecentDrill.add(key);
    recentDrills.push({ id: `recent-${key}`, title, summary: finding.linked_drill_summary || '', custom: true });
  });

  // Add an already-normalised drill (from a favourite/recent chip) to the finding.
  const addNormalizedDrill = (drill) => {
    if (!drill?.title) return;
    setSelectedDrills((prev) => (prev.some((item) => item.id === drill.id) ? prev : [...prev, {
      id: drill.id, title: drill.title, summary: drill.summary || '', cue: drill.cue || '', why: '', custom: !!drill.custom,
    }]));
  };
  // Key moments come from saved key_frame annotations (which carry a captured thumbnail),
  // not from findings — so the strip shows real screenshots.
  const keyMoments = (keyStamps || []).map((a) => ({
    id: a.id,
    seconds: Number(a.timestamp_seconds ?? 0) || 0,
    phase: a.title || a.frame_label || 'Key moment',
    note: a.coach_note || '',
    thumb: (typeof a.thumbnail_data_url === 'string' && a.thumbnail_data_url.startsWith('data:image/')) ? a.thumbnail_data_url : null,
  }));

  // Linked evidence for the finding: default ('auto') is the just-captured moment, else the
  // saved evidence nearest the current time. Coach can pick another thumbnail or "No image".
  const autoLinkedEvidenceId = (() => {
    if (lastCapturedMomentId) return lastCapturedMomentId;
    if (!linkedEvidenceOptions.length) return null;
    return [...linkedEvidenceOptions]
      .sort((a, b) => Math.abs((a.seconds || 0) - timestamp) - Math.abs((b.seconds || 0) - timestamp))[0]?.id || null;
  })();
  const effectiveLinkId = linkChoice === 'none' ? null : (linkChoice === 'auto' ? autoLinkedEvidenceId : linkChoice);

  useEffect(() => {
    [inlineVideoRef.current, fullscreenVideoRef.current].forEach(current => {
      if (current) current.playbackRate = playbackRate;
    });
  }, [playbackRate, signedVideoUrl]);

  useEffect(() => {
    const source = fullscreenOpen ? inlineVideoRef.current : fullscreenVideoRef.current;
    const target = fullscreenOpen ? fullscreenVideoRef.current : inlineVideoRef.current;
    if (!target) return;
    target.playbackRate = playbackRate;
    if (source && Number.isFinite(source.currentTime)) {
      target.currentTime = source.currentTime || timestamp || 0;
    } else if (timestamp) {
      target.currentTime = timestamp;
    }
  }, [fullscreenOpen, playbackRate, signedVideoUrl]);

  useEffect(() => {
    if (!fullscreenOpen) return undefined;
    const onKeyDown = (e) => { if (e.key === 'Escape') setFullscreenOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [fullscreenOpen]);

  // Persist the open-state and unsaved inputs so a tab switch / refetch / reload restores
  // them (restore itself is done via lazy state initialisers above — no effect race).
  useEffect(() => {
    writeStudioDraft(storageKey, {
      open: fullscreenOpen,
      note: markerNote,
      phase: markerLabel,
      drillMode,
      selectedDrills,
      imSegment,
      step: currentStep,
    });
  }, [storageKey, fullscreenOpen, markerNote, markerLabel, drillMode, selectedDrills, imSegment, currentStep]);

  // ── 3-step helpers ───────────────────────────────────────────────────────────
  const stepIndex = STUDIO_STEPS.findIndex((s) => s.key === currentStep);
  const goToStep = (key) => {
    if (!STUDIO_STEPS.some((s) => s.key === key)) return;
    setCurrentStep(key);
  };
  const goNextStep = () => { if (stepIndex < STUDIO_STEPS.length - 1) goToStep(STUDIO_STEPS[stepIndex + 1].key); };
  const goPrevStep = () => { if (stepIndex > 0) goToStep(STUDIO_STEPS[stepIndex - 1].key); };

  // Findings sorted by video time for the step-2 list; thumbnail = first linked
  // annotation with a captured frame (client-side join, no new queries).
  const findingThumbById = useMemo(() => {
    const map = new Map();
    (annotations || []).forEach((a) => {
      if (a?.finding_id && typeof a.thumbnail_data_url === 'string' && a.thumbnail_data_url.startsWith('data:image/') && !map.has(a.finding_id)) {
        map.set(a.finding_id, a.thumbnail_data_url);
      }
    });
    return map;
  }, [annotations]);
  const sortedFindings = useMemo(
    () => [...(findings || [])].sort((a, b) => (Number(a.timestamp_seconds ?? a.timestamp_start ?? 0)) - (Number(b.timestamp_seconds ?? b.timestamp_start ?? 0))),
    [findings],
  );
  const editorFinding = selectedFindingId ? sortedFindings.find((f) => f.id === selectedFindingId) || null : null;

  // Select a finding: load its content into the editable fields and seek the video
  // to its moment so the coach can re-check (and draw on) the exact frame.
  const selectFinding = (finding) => {
    if (!finding) return;
    setSelectedFindingId(finding.id);
    setEditObservation(finding.observation || finding.coach_sees || '');
    setEditCue(finding.correction_cue || finding.cue || '');
    // Keep the stored severity verbatim (incl. 'critical') — saving an unrelated
    // edit must never silently downgrade it. The chips add 'critical' when present.
    setEditSeverity(finding.severity || 'medium');
    setEditPhase(finding.stroke_phase || finding.phase || '');
    const payload = finding.raw_ai_payload || {};
    setEditTags(Array.isArray(payload.fault_tags) ? payload.fault_tags : (payload.fault_tag ? [payload.fault_tag] : []));
    setEditNotes(finding.coach_notes || '');
    const seconds = Number(finding.timestamp_seconds ?? finding.timestamp_start ?? NaN);
    if (Number.isFinite(seconds)) {
      const current = activeVideo();
      if (current) {
        current.pause();
        current.currentTime = Math.max(0, seconds);
        syncTimestamp(current);
      }
    }
  };
  const clearFindingSelection = () => {
    setSelectedFindingId(null);
    setLinkedFindingId('');
    setEditObservation(''); setEditCue(''); setEditSeverity('medium'); setEditPhase(''); setEditTags([]); setEditNotes('');
  };

  const handleSaveFindingDetails = async () => {
    if (!editorFinding || !onUpdateFinding || readOnly) return;
    try {
      await onUpdateFinding(editorFinding, {
        observation: editObservation,
        cue: editCue,
        severity: editSeverity,
        phase: editPhase || null,
        coachNotes: editNotes || null,
        faultTags: editTags,
      });
      setActionFeedback({ type: 'success', msg: 'Finding saved' });
    } catch (error) {
      setActionFeedback({ type: 'error', msg: error?.message || 'The finding could not be saved. Try again.' });
    }
  };

  const handleDeleteFinding = async () => {
    if (!editorFinding || !onDeleteFinding || readOnly) return;
    try {
      await onDeleteFinding(editorFinding);
      clearFindingSelection();
      setActionFeedback({ type: 'success', msg: 'Finding removed from this report' });
    } catch (error) {
      setActionFeedback({ type: 'error', msg: error?.message || 'The finding could not be removed. Try again.' });
    }
  };

  // Custom moment (step 1): a named key moment at the current video time.
  // Uses the exact same save path as phase moments — title is free text.
  const handleSaveCustomMoment = async () => {
    if (!onSaveMarker || readOnly || !customMomentName.trim()) return;
    const current = activeVideo();
    current?.pause();
    const currentTime = current?.currentTime || timestamp || 0;
    try {
      const created = await onSaveMarker({
        timestampSeconds: currentTime,
        videoFrameTimeLabel: formatTimestamp(currentTime),
        approxFrame: Math.round(currentTime * fps),
        title: customMomentName.trim(),
        coachNote: customMomentNote.trim() || null,
        includeInReport: true,
        thumbnailDataUrl: captureVideoThumbnail(current),
      });
      if (created?.id) setLastCapturedMomentId(created.id);
      setCustomMomentOpen(false);
      setCustomMomentName('');
      setCustomMomentNote('');
      setActionFeedback({ type: 'success', msg: 'Moment saved' });
    } catch (error) {
      setActionFeedback({ type: 'error', msg: error?.message || 'The moment could not be saved. Try again.' });
    }
  };

  // Step 3: drills are attached PER FINDING (primary on linked_drill_*, the rest in
  // raw_ai_payload.extra_drills — the existing storage model, rewritten via the
  // content-only update mutation; the payload is merged, never clobbered).
  const findingDrillList = (finding) => {
    if (!finding) return [];
    const extras = Array.isArray(finding.raw_ai_payload?.extra_drills) ? finding.raw_ai_payload.extra_drills : [];
    const primaryTitle = finding.linked_drill_title || finding.drill;
    const primary = primaryTitle ? [{ title: primaryTitle, summary: finding.linked_drill_summary || null, id: finding.linked_drill_id || null }] : [];
    return [...primary, ...extras.filter((d) => d && d.title).map((d) => ({ title: d.title, summary: d.summary || null, cue: d.cue || null, id: null }))];
  };
  const writeFindingDrills = async (finding, list) => {
    if (!finding || !onUpdateFinding || readOnly) return;
    const primary = list[0] || null;
    const extras = list.slice(1).map((d) => ({ title: d.title, summary: d.summary || null, cue: d.cue || null }));
    try {
      await onUpdateFinding(finding, {
        drill: primary?.title || null,
        linkedDrillId: primary?.id || null,
        linkedDrillTitle: primary?.title || null,
        linkedDrillSummary: primary?.summary || null,
        extraDrills: extras,
      });
      setActionFeedback({ type: 'success', msg: 'Drills updated' });
    } catch (error) {
      setActionFeedback({ type: 'error', msg: error?.message || 'Drills could not be saved. Try again.' });
    }
  };

  const handleSaveComments = async () => {
    if (!onSaveComments || readOnly) return;
    // Snapshot what we're saving: if the coach keeps typing while the save is in
    // flight, the newer text stays marked dirty instead of being wiped/blanked.
    const snapshot = { swimmerFeedback, privateNotes };
    try {
      await onSaveComments(snapshot);
      if (commentsRef.current.swimmerFeedback === snapshot.swimmerFeedback
        && commentsRef.current.privateNotes === snapshot.privateNotes) {
        setCommentsDirty(false);
      }
      setActionFeedback({ type: 'success', msg: 'Comments saved' });
    } catch (error) {
      setActionFeedback({ type: 'error', msg: error?.message || 'Comments could not be saved. Try again.' });
    }
  };

  // Keep step-3 fields in sync with the freshly saved report — but never clobber
  // in-progress typing (commentsDirty guards it).
  useEffect(() => {
    if (commentsDirty) return;
    setSwimmerFeedback(report?.coach_summary || '');
    setPrivateNotes(report?.review_context?.private_coach_notes || '');
  }, [report?.coach_summary, report?.review_context?.private_coach_notes]); // eslint-disable-line react-hooks/exhaustive-deps

  // True fullscreen: lock the background page scroll while the workspace is open,
  // and always restore it on exit/unmount so the coach is never trapped.
  useEffect(() => {
    if (!fullscreenOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [fullscreenOpen]);

  // Auto-clear the transient toast. Errors linger longer so the coach can read the reason.
  useEffect(() => {
    if (!actionFeedback) return undefined;
    const ms = actionFeedback.type === 'error' ? 9000 : 3000;
    const id = setTimeout(() => setActionFeedback(null), ms);
    return () => clearTimeout(id);
  }, [actionFeedback]);

  useEffect(() => {
    if (!seekRequest || !Number.isFinite(Number(seekRequest.timestampSeconds))) return;
    const current = activeVideo();
    if (!current) return;
    current.pause();
    current.currentTime = Math.max(0, Number(seekRequest.timestampSeconds));
    syncTimestamp(current);
  }, [seekRequest?.nonce]);

  useEffect(() => {
    if (!drawRequest || !Number.isFinite(Number(drawRequest.timestampSeconds))) return;
    const current = activeVideo();
    if (current) {
      current.pause();
      current.currentTime = Math.max(0, Number(drawRequest.timestampSeconds));
      syncTimestamp(current);
    }
    setDrawing(true);
  }, [drawRequest?.nonce]);

  const activeVideo = () => (fullscreenOpen ? fullscreenVideoRef.current : inlineVideoRef.current);

  const syncTimestamp = (node) => {
    const current = node || activeVideo();
    if (!current) return;
    setTimestamp(current.currentTime || 0);
  };

  const seekBy = (seconds) => {
    const current = activeVideo();
    if (!current) return;
    current.currentTime = Math.max(0, Math.min(current.duration || Number.MAX_SAFE_INTEGER, (current.currentTime || 0) + seconds));
    syncTimestamp(current);
  };

  const pauseAndCapture = () => {
    const current = activeVideo();
    current?.pause();
    const currentTime = current?.currentTime || timestamp || 0;
    setTimestamp(currentTime);
    onCaptureTimestamp?.(currentTime);
    return currentTime;
  };

  const startFindingFromMoment = () => {
    const currentTime = pauseAndCapture();
    onStartFindingFromMoment?.(currentTime, selectedDrills[0] || null, markerLabel, markerNote);
    if (fullscreenOpen) {
      if (inlineVideoRef.current) {
        inlineVideoRef.current.currentTime = currentTime;
      }
      setFullscreenOpen(false);
    }
  };

  // Preferred path: save the coach finding inline (timestamp + phase + note + drill)
  // WITHOUT leaving fullscreen. Falls back to the page form if no inline saver is wired.
  const addFindingInline = async () => {
    const current = activeVideo();
    const currentTime = current?.currentTime || timestamp || 0;
    current?.pause();
    setTimestamp(currentTime);
    onCaptureTimestamp?.(currentTime);
    if (!onCreateFinding) { startFindingFromMoment(); return; }
    setSavingFinding(true);
    setActionFeedback(null);
    try {
      // Include any custom drill the coach typed but did not press "Add drill" on, so
      // their work is never silently dropped. First drill is Primary; the rest Additional.
      const typedCustom = customDrillTitle.trim();
      const pendingCustom = typedCustom
        ? [{
            id: `custom-${typedCustom.toLowerCase()}`,
            title: typedCustom,
            summary: customDrillSummary.trim(),
            cue: customDrillCue.trim(),
            why: customDrillWhy.trim(),
            custom: true,
          }]
        : [];
      const drillsToSend = [
        ...selectedDrills,
        ...pendingCustom.filter((pending) => !selectedDrills.some((drill) => drill.id === pending.id)),
      ];
      await onCreateFinding({
        timestampSeconds: currentTime,
        phaseLabel: phaseSelected ? markerLabel : '',
        note: markerNote,
        cue: markerCue.trim() || null,
        drills: drillsToSend,
        keyStampLinkId: effectiveLinkId || null,
      });
      setAddedFindingCount((n) => n + 1);
      setActionFeedback({ type: 'success', msg: 'Finding added' });
      setMarkerNote('');
      setMarkerCue('');
      setLinkChoice('auto');
      setSelectedDrills([]);
      setCustomDrillTitle('');
      setCustomDrillSummary('');
      setCustomDrillCue('');
      setCustomDrillWhy('');
      setLastCapturedMomentId(null);
    } catch (error) {
      console.warn('Finding was not saved.', error?.message || error);
      setActionFeedback({ type: 'error', msg: `Could not save the finding: ${readableError(error)}. Your note and drills are kept — please try again.` });
    } finally {
      setSavingFinding(false);
    }
  };

  const startDrawing = () => {
    const current = activeVideo();
    current?.pause();
    setTimestamp(current?.currentTime || 0);
    setDrawing(true);
    // Coach drawings are visual evidence for the report by default.
    setIncludeInReport(true);
  };

  // Coach Draw saves in ONE step: "Save Drawing" persists the marked-up frame directly.
  // On success the canvas closes and shows "Drawing saved"; on failure the marks are kept
  // (the canvas stays open) so the coach can retry without redrawing.
  const handleCanvasSave = async (drawingData) => {
    if (!drawingData || !onSaveAnnotation) { setDrawing(false); return; }
    setDrawingSaving(true);
    setActionFeedback(null);
    try {
      await onSaveAnnotation({
        drawingData,
        timestampSeconds: timestamp,
        videoFrameTimeLabel: formatTimestamp(timestamp),
        title: title || 'Coach drawing',
        coachNote,
        includeInReport,
        videoWidth: activeVideo()?.videoWidth || null,
        videoHeight: activeVideo()?.videoHeight || null,
        // Step-aware linkage, computed at SAVE time: every drawing made while a
        // finding is being edited (step 2) links to that finding — not just the
        // first — and drawings on other steps never inherit a stale link.
        findingId: (currentStep === 'findings' && selectedFindingId) ? selectedFindingId : (linkedFindingId || null),
        // Marked-up screenshot: capture the paused frame so the report overlays the drawing.
        thumbnailDataUrl: captureVideoThumbnail(activeVideo()),
      });
      setTitle('');
      setCoachNote('');
      setIncludeInReport(false);
      setLinkedFindingId('');
      setActionFeedback({ type: 'success', msg: 'Drawing saved' });
      setDrawing(false);
    } catch (error) {
      console.warn('Drawing was not saved.', error?.message || error);
      setActionFeedback({ type: 'error', msg: `Drawing failed to save: ${readableError(error)}. Your marks are kept — please try again.` });
    } finally {
      setDrawingSaving(false);
    }
  };

  const saveMarker = async ({ includeInReport = markerIncludeInReport } = {}) => {
    if (!onSaveMarker) return null;
    const current = activeVideo();
    const currentTime = current?.currentTime || timestamp || 0;
    setActionFeedback(null);
    try {
      const created = await onSaveMarker({
        timestampSeconds: currentTime,
        videoFrameTimeLabel: formatTimestamp(currentTime),
        approxFrame: Math.round(currentTime * fps),
        title: markerLabel || 'Key frame',
        coachNote: markerNote || null,
        includeInReport,
        thumbnailDataUrl: captureVideoThumbnail(current),
      });
      // Remember the captured moment so the next Add Finding can link it into the report.
      if (created?.id) setLastCapturedMomentId(created.id);
      setMarkerIncludeInReport(false);
      setActionFeedback({ type: 'success', msg: 'Phase moment saved' });
      return created;
    } catch (error) {
      console.warn('Phase moment was not saved.', error?.message || error);
      setActionFeedback({ type: 'error', msg: `Could not save the phase moment: ${readableError(error)}. Your phase and note are kept — please try again.` });
      return null;
    }
  };

  // Fullscreen "Capture Phase Moment" — always report-included so it reaches the PDF,
  // and the phase/note are kept so the coach can add a finding from the same moment.
  const capturePhaseMoment = () => saveMarker({ includeInReport: true });

  const [shareCopied, setShareCopied] = useState(false);

  // When the report becomes finalised (opened finalised, or finalised in-session),
  // surface the fullscreen report-ready panel rather than the old dashboard.
  useEffect(() => {
    if (reportFinalised) setFinaliseFlow('ready');
  }, [reportFinalised]);

  const runFinalise = async () => {
    if (!onFinaliseReport) { setFinaliseFlow('idle'); return; }
    setFinaliseFlow('saving');
    try {
      await onFinaliseReport();
      setFinaliseFlow('ready');
    } catch (error) {
      console.warn('Finalise did not complete.', error?.message || error);
      setFinaliseFlow('idle');
    }
  };

  const copyShareLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setShareCopied(true);
    } catch { /* clipboard blocked — coach can copy from the share section */ }
  };

  // Reopen a finalised/shared report: parent pauses the public link + drops it to editable.
  // On success, leave the report-ready panel so the coach lands in the editable workspace.
  const runReopen = async () => {
    if (!onReopen) return;
    try {
      await onReopen();
      setReopenConfirm(false);
      setFinaliseFlow('idle');
      setActionFeedback({ type: 'success', msg: 'Reopened for editing — the shared link is paused.' });
    } catch (error) {
      console.warn('Reopen did not complete.', error?.message || error);
      setActionFeedback({ type: 'error', msg: `Could not reopen: ${readableError(error)}.` });
    }
  };

  // Re-share after re-finalising: reactivates the SAME paused link (same public URL).
  const runReshare = async () => {
    if (!onReshare) return;
    try {
      await onReshare();
      setActionFeedback({ type: 'success', msg: 'Re-shared — the original link works again with the updated report.' });
    } catch (error) {
      console.warn('Re-share did not complete.', error?.message || error);
      setActionFeedback({ type: 'error', msg: `Could not re-share: ${readableError(error)}.` });
    }
  };

  const closeFullscreen = () => {
    const current = fullscreenVideoRef.current;
    if (current) {
      current.pause();
      setTimestamp(current.currentTime || timestamp || 0);
      if (inlineVideoRef.current) {
        inlineVideoRef.current.currentTime = current.currentTime || timestamp || 0;
      }
    }
    setFullscreenOpen(false);
  };

  const renderVideoSurface = (ref, isFullscreen = false) => (
    <div className={`relative overflow-hidden bg-black ${isFullscreen ? 'rounded-xl min-h-[48vh] lg:min-h-[78vh]' : 'rounded-lg'}`} style={{ aspectRatio: '16/9' }}>
      {signedVideoUrl ? (
        <video
          ref={ref}
          src={signedVideoUrl}
          crossOrigin="anonymous"
          controls={!drawing}
          playsInline
          // While drawing, the video must not intercept pointer/touch/stylus events —
          // on iPad the native video layer otherwise swallows them before the canvas.
          className={`w-full h-full object-contain ${drawing ? 'pointer-events-none' : ''}`}
          onTimeUpdate={(event) => syncTimestamp(event.currentTarget)}
          onLoadedMetadata={(event) => syncTimestamp(event.currentTarget)}
          onSeeked={(event) => syncTimestamp(event.currentTarget)}
          onPause={(event) => syncTimestamp(event.currentTarget)}
          onPlay={(event) => syncTimestamp(event.currentTarget)}
        />
      ) : signedVideoError ? (
        <div className="h-full flex items-center justify-center text-xs text-red-300 px-4 text-center">
          {signedVideoError}
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
          Loading private video preview...
        </div>
      )}

      {drawing && ((isFullscreen && fullscreenOpen) || (!isFullscreen && !fullscreenOpen)) && (
        <AnnotationCanvas
          timestampSeconds={timestamp}
          onSave={handleCanvasSave}
          onCancel={() => setDrawing(false)}
          saving={drawingSaving}
        />
      )}
    </div>
  );

  const controlButtons = (compact = false) => (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="flex w-full flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1 sm:w-auto">
        <Gauge className="w-3.5 h-3.5 text-muted-foreground mx-1" />
        {PLAYBACK_SPEEDS.map(speed => (
          <button
            key={speed}
            type="button"
            onClick={() => setPlaybackRate(speed)}
            className={`${compact ? 'h-10 min-w-12' : 'h-10 min-w-12'} flex-1 rounded-md px-2 text-xs font-semibold transition-colors sm:flex-none ${
              playbackRate === speed
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>
      <Button size="sm" variant="outline" className="h-11 flex-1 text-xs sm:flex-none" onClick={() => seekBy(-1)} disabled={!signedVideoUrl}>
        <Rewind className="w-3.5 h-3.5 mr-1" /> 1s
      </Button>
      <Button size="sm" variant="outline" className="h-11 flex-1 text-xs sm:flex-none" onClick={() => seekBy(1)} disabled={!signedVideoUrl}>
        <FastForward className="w-3.5 h-3.5 mr-1" /> 1s
      </Button>
      <Button size="sm" variant="outline" className="h-11 flex-1 text-xs sm:flex-none" onClick={() => seekBy(-APPROX_FRAME_STEP)} disabled={!signedVideoUrl}>
        <SkipBack className="w-3.5 h-3.5 mr-1" /> Step approx
      </Button>
      <Button size="sm" variant="outline" className="h-11 flex-1 text-xs sm:flex-none" onClick={() => seekBy(APPROX_FRAME_STEP)} disabled={!signedVideoUrl}>
        <SkipForward className="w-3.5 h-3.5 mr-1" /> Step approx
      </Button>
      <Button size="sm" variant="outline" className="h-11 flex-1 text-xs sm:flex-none" onClick={pauseAndCapture} disabled={!signedVideoUrl || !canEdit}>
        Use timestamp
      </Button>
      <Button size="sm" className="h-11 w-full text-xs bg-primary text-primary-foreground sm:w-auto" onClick={startFindingFromMoment} disabled={!signedVideoUrl || !canEdit}>
        <Plus className="w-3.5 h-3.5 mr-1" /> Finding from moment
      </Button>
    </div>
  );

  const actionButtons = (
    <div className="flex flex-wrap gap-2 items-center">
      <Button
        size="sm"
        className="h-11 flex-1 text-xs bg-primary text-primary-foreground sm:flex-none"
        onClick={startDrawing}
        disabled={!signedVideoUrl || !canEdit}
      >
        <PencilLine className="w-3.5 h-3.5 mr-1.5" /> Coach Draw
      </Button>
      {onSaveMarker && (
        <Button
          size="sm"
          variant="outline"
          className="h-11 flex-1 text-xs sm:flex-none"
          onClick={() => saveMarker()}
          disabled={!signedVideoUrl || !canEdit || savingMarker}
        >
          <BookmarkPlus className="w-3.5 h-3.5 mr-1.5" /> {savingMarker ? 'Saving...' : 'Save Phase Moment'}
        </Button>
      )}
      <div className="w-full text-[10px] text-muted-foreground sm:w-auto">
        Pause the video, then mark the frame with finger, Apple Pencil, stylus, or mouse.
      </div>
    </div>
  );


  return (
    <div className="space-y-3">
      {/* Manual direct mode: a calm banner that sits behind the fullscreen workspace.
          It is the exit destination AND the re-entry point — never the busy AI dashboard. */}
      {studioMode && !fullscreenOpen && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-primary">Manual Coach Review</div>
            <h2 className="truncate text-sm font-bold text-foreground">
              {swimmer?.name ? `${swimmer.name} · ` : ''}{video?.stroke_type || 'Manual review'}
            </h2>
            <p className="text-[10px] text-muted-foreground">
              {signedVideoUrl ? 'Mark moments and add findings in the fullscreen workspace.' : 'Preparing the private video…'}
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row">
            <Button
              className="h-11 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setFullscreenOpen(true)}
              disabled={!signedVideoUrl}
            >
              <Maximize2 className="mr-1.5 h-4 w-4" /> Resume Manual Review
            </Button>
            <Button variant="outline" className="h-11" onClick={() => onBackToAnalyse?.()}>
              Back to Analyse
            </Button>
          </div>
        </div>
      )}
      {!studioMode && (
        <>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-900">Video-first review</span>
          <FeatureStatusBadge status="partial" />
          <span>Tap Draw, mark the frame, then choose Done Drawing or Hide drawing tools.</span>
        </div>
      </div>
      {renderVideoSurface(inlineVideoRef)}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-10 text-xs"
          onClick={() => setFullscreenOpen(true)}
          disabled={!signedVideoUrl}
        >
          <Maximize2 className="w-3.5 h-3.5 mr-1.5" /> Open Fullscreen Review
        </Button>
        <div className="text-[10px] text-muted-foreground">
          Timestamp updates on play, pause, seek, and step. Frame values are approximate browser estimates.
        </div>
      </div>

      <div className="p-3 rounded-xl bg-secondary/40 border border-border space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-foreground uppercase tracking-wider">Coach Studio Controls</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Slow the private video, pause at a moment, then save a timestamp, finding, or Coach Draw annotation.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1">
              {formatTimestamp(timestamp)}
            </div>
            <div className="text-xs font-mono text-muted-foreground bg-background border border-border rounded-lg px-2.5 py-1">
              Approx frame ~{approxFrame}
            </div>
            <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => setControlsExpanded(current => !current)}>
              <SlidersHorizontal className="mr-1 h-3.5 w-3.5" /> {controlsExpanded ? 'Hide controls' : 'More controls'}
            </Button>
          </div>
        </div>

        {controlsExpanded && controlButtons()}
      </div>

      {actionButtons}

      {onSaveMarker && (
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <div className="flex flex-wrap gap-2">
            {quickLabels.map(label => (
              <button
                key={label}
                type="button"
                onClick={() => setMarkerLabel(label)}
                className={`h-9 rounded-full border px-3 text-[10px] font-semibold ${
                  markerLabel === label
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,220px)_1fr_auto] gap-3 items-start">
            <Input
              value={markerLabel}
              onChange={e => setMarkerLabel(e.target.value)}
              className="h-11 text-sm md:text-xs"
              placeholder="Marker label, e.g. Catch"
            />
            <Input
              value={markerNote}
              onChange={e => setMarkerNote(e.target.value)}
              className="h-11 text-sm md:text-xs"
              placeholder="Optional coach note for this timestamp"
            />
            <label className="flex min-h-11 items-center gap-2 rounded-md border border-border bg-secondary/30 px-3 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={markerIncludeInReport}
                onChange={e => setMarkerIncludeInReport(e.target.checked)}
              />
              Include
            </label>
          </div>
        </div>
      )}
        </>
      )}

      {fullscreenOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-slate-950 text-white">
          {/* Action feedback toast — makes save success/failure obvious poolside. */}
          {actionFeedback && (
            <div
              role="status"
              className={`pointer-events-none fixed left-1/2 top-4 z-[130] -translate-x-1/2 rounded-lg px-4 py-2 text-sm font-semibold shadow-xl ${actionFeedback.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}
            >
              {actionFeedback.type === 'success' ? '✓ ' : '⚠ '}{actionFeedback.msg}
            </div>
          )}
          {/* Top bar — brand/swimmer, 3-step navigation, saved status + actions */}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-white/10 px-4 py-2.5 sm:px-6">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Coach Studio</span>
              {swimmer?.name && <span className="truncate text-sm font-semibold">{swimmer.name}</span>}
              {video?.stroke_type && <span className="hidden rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs text-slate-200 md:inline">{video.stroke_type}</span>}
              <span className="hidden rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-0.5 font-mono text-xs text-cyan-200 sm:inline">{formatTimestamp(timestamp)}</span>
            </div>
            {/* Step navigation */}
            <div className="order-3 flex w-full items-center justify-center gap-1 sm:order-none sm:w-auto" role="tablist" aria-label="Coach Studio steps">
              {STUDIO_STEPS.map((step, index) => {
                const active = currentStep === step.key;
                const complete = index < stepIndex;
                return (
                  <React.Fragment key={step.key}>
                    {index > 0 && <span className={`h-px w-4 sm:w-6 ${complete || active ? 'bg-sky-400/70' : 'bg-white/15'}`} aria-hidden="true" />}
                    <button
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => goToStep(step.key)}
                      className={`flex min-h-10 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-all motion-reduce:transition-none ${active ? 'scale-100 bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${active ? 'bg-sky-500 text-white' : complete ? 'bg-emerald-500/80 text-slate-950' : 'bg-white/10 text-slate-300'}`}>
                        {complete ? '✓' : index + 1}
                      </span>
                      <span className="hidden md:inline">{step.label}</span>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              {/* Saved status */}
              <span className={`hidden items-center gap-1 text-xs font-semibold sm:flex ${(savingFinding || savingMarker || drawingSaving || savingFindingDetails || savingComments) ? 'text-slate-300' : 'text-emerald-300'}`} role="status">
                {(savingFinding || savingMarker || drawingSaving || savingFindingDetails || savingComments) ? 'Saving…' : '✓ Saved'}
              </span>
              {currentStep === 'analysis' && (
                <Button size="sm" variant="outline" className="hidden h-10 px-3 text-xs font-semibold border-white/20 bg-white/10 text-white hover:bg-white/20 lg:inline-flex" onClick={() => setPanelOpen((open) => !open)}>
                  <SlidersHorizontal className="mr-1.5 h-4 w-4" /> {panelOpen ? 'Hide moments' : 'Show moments'}
                </Button>
              )}
              <Button size="sm" variant="outline" className="h-10 px-3 text-xs font-semibold border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={closeFullscreen}>
                <X className="mr-1.5 h-4 w-4" /> Exit Review
              </Button>
              {stepIndex < STUDIO_STEPS.length - 1 ? (
                <Button size="sm" className="h-10 bg-sky-500 px-3 text-xs font-bold text-white hover:bg-sky-400" onClick={goNextStep}>
                  Next: {STUDIO_STEPS[stepIndex + 1].label}
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="h-10 bg-sky-500 px-3 text-xs font-bold text-white hover:bg-sky-400"
                  onClick={() => {
                    if (reportFinalised) { setFinaliseFlow('ready'); return; }
                    if (onFinaliseReport && canFinalise) { setFinaliseFlow('confirm'); return; }
                    closeFullscreen();
                    onFinalise?.();
                  }}
                >
                  {reportFinalised ? 'View Report' : 'Finalise Report'}
                </Button>
              )}
            </div>
          </div>

          {/* Scrollable workspace body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className={`mx-auto space-y-4 ${panelOpen ? 'max-w-[1600px]' : 'max-w-none'}`}>
              {readOnly && (
                <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-100">
                    <Lock className="h-4 w-4 flex-shrink-0" /> {readOnlyReason}
                  </div>
                  <div className="mt-1 text-xs text-amber-200/90">
                    To add findings, phase moments, or coach drawings, open a draft review or reopen this report for editing.
                  </div>
                  {canReopen && (
                    <Button
                      size="sm"
                      className="mt-2.5 h-9 bg-amber-400 px-3 text-xs font-bold text-slate-950 hover:bg-amber-300"
                      onClick={() => setReopenConfirm(true)}
                      disabled={reopening}
                    >
                      {reopening ? 'Reopening…' : 'Reopen for editing'}
                    </Button>
                  )}
                </div>
              )}
              {!readOnly && reopenedForEditing && (
                <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-100">
                    <PencilLine className="h-4 w-4 flex-shrink-0" /> Reopened for editing — the shared link is paused.
                  </div>
                  <div className="mt-1 text-xs text-amber-200/90">
                    Re-finalise and re-share when you&apos;re done — the same link will work again with the updated report.
                  </div>
                </div>
              )}
              <div
                className={`grid grid-cols-1 gap-4 ${
                  currentStep === 'analysis'
                    ? (panelOpen ? 'lg:grid-cols-[minmax(0,1fr)_320px]' : '')
                    : currentStep === 'findings'
                      ? 'lg:grid-cols-[280px_minmax(0,1fr)_340px] xl:grid-cols-[300px_minmax(0,1fr)_360px]'
                      : 'lg:grid-cols-[minmax(0,1fr)_420px]'
                }`}
              >
                {/* STEP 2 ONLY: findings list with screenshots. Kept mounted (hidden via
                    CSS) so switching steps never remounts anything. */}
                <div key="findings-list" className={currentStep === 'findings' ? 'space-y-2' : 'hidden'}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold uppercase tracking-wider">Findings</div>
                      <div className="text-[10px] text-slate-400">Review key moments and add your findings.</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 flex-shrink-0 border-cyan-300/40 bg-white/5 px-2.5 text-xs font-semibold text-white hover:bg-white/10"
                      onClick={clearFindingSelection}
                      disabled={readOnly}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add Finding
                    </Button>
                  </div>
                  <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
                    {sortedFindings.length === 0 && (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
                        No findings yet. Pick a moment on the video, then use Add Finding.
                      </div>
                    )}
                    {sortedFindings.map((finding) => {
                      const active = selectedFindingId === finding.id;
                      const thumb = findingThumbById.get(finding.id) || null;
                      const seconds = Number(finding.timestamp_seconds ?? finding.timestamp_start ?? NaN);
                      const payload = finding.raw_ai_payload || {};
                      const tags = Array.isArray(payload.fault_tags) ? payload.fault_tags : (payload.fault_tag ? [payload.fault_tag] : []);
                      return (
                        <button
                          key={finding.id}
                          type="button"
                          onClick={() => selectFinding(finding)}
                          className={`w-full rounded-xl border p-2.5 text-left transition-all motion-reduce:transition-none ${active ? 'border-sky-400/70 bg-sky-400/10 shadow-[0_0_0_1px_rgba(56,189,248,0.25)]' : 'border-white/10 bg-white/5 hover:border-sky-300/40 hover:bg-white/[0.08]'}`}
                        >
                          <div className="flex gap-2.5">
                            {thumb ? (
                              <img src={thumb} alt="" className="h-14 w-20 flex-shrink-0 rounded-lg border border-white/10 object-cover" />
                            ) : (
                              <div className="flex h-14 w-20 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-900/60 text-[9px] text-slate-500">No image</div>
                            )}
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`h-2 w-2 flex-shrink-0 rounded-full ${finding.severity === 'high' || finding.severity === 'critical' ? 'bg-orange-400' : finding.severity === 'low' ? 'bg-emerald-400' : 'bg-amber-300'}`} />
                                <span className="text-xs font-bold text-white">{tagLabel(finding.stroke_phase || finding.phase || 'Finding')}</span>
                                {Number.isFinite(seconds) && <span className="font-mono text-[10px] text-cyan-200">{formatTimestamp(seconds)}</span>}
                              </div>
                              <div className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-slate-300">{finding.observation || finding.coach_sees || ''}</div>
                              {tags.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {tags.slice(0, 3).map((tag) => (
                                    <span key={tag} className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-slate-300">{tagLabel(tag)}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Video column + slim docked control bar (speed / frame-step / seek).
                    ALWAYS mounted (hidden on step 3) so playback state survives step
                    changes. Kept docked — never a floating overlay — so it can't clash
                    with the top-right drawing toolbar on iPad. */}
                <div key="video-col" className={currentStep === 'drills' ? 'hidden' : 'min-w-0 space-y-2'}>
                  {renderVideoSurface(fullscreenVideoRef, true)}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Speed</span>
                    {PLAYBACK_SPEEDS.map((speed) => (
                      <button
                        key={speed}
                        type="button"
                        onClick={() => setPlaybackRate(speed)}
                        className={`h-9 min-w-[2.5rem] rounded-md px-1.5 text-xs font-semibold transition-colors ${playbackRate === speed ? 'bg-cyan-400 text-slate-950' : 'bg-white/5 text-slate-200 hover:bg-white/10'}`}
                      >
                        {speed}x
                      </button>
                    ))}
                    <span className="mx-0.5 hidden h-6 w-px bg-white/10 sm:block" />
                    <Button size="sm" variant="outline" className="h-10 px-2.5 text-xs border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => seekBy(-APPROX_FRAME_STEP)} disabled={!signedVideoUrl} title="Step back one frame">
                      <SkipBack className="mr-1 h-4 w-4" /> Frame
                    </Button>
                    <Button size="sm" variant="outline" className="h-10 px-2.5 text-xs border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => seekBy(APPROX_FRAME_STEP)} disabled={!signedVideoUrl} title="Step forward one frame">
                      <SkipForward className="mr-1 h-4 w-4" /> Frame
                    </Button>
                    <Button size="sm" variant="outline" className="h-10 px-2.5 text-xs border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => seekBy(-1)} disabled={!signedVideoUrl} title="Back one second">
                      <Rewind className="mr-1 h-4 w-4" /> 1s
                    </Button>
                    <Button size="sm" variant="outline" className="h-10 px-2.5 text-xs border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => seekBy(1)} disabled={!signedVideoUrl} title="Forward one second">
                      <FastForward className="mr-1 h-4 w-4" /> 1s
                    </Button>
                  </div>
                  {/* Step 1: stroke-phase buttons under the timeline. Selecting a phase
                      feeds Add Moment / Add Finding (same markerLabel state as before). */}
                  {currentStep === 'analysis' && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isIM && IM_SEGMENTS.map((segment) => (
                        <button
                          key={segment.key}
                          type="button"
                          onClick={() => selectImSegment(segment.key)}
                          className={`min-h-9 rounded-md border px-2 text-[11px] font-semibold transition-colors ${imSegment === segment.key ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-white/15 bg-white/5 text-slate-300 hover:border-cyan-300/50'}`}
                        >
                          {segment.label}
                        </button>
                      ))}
                      {quickLabels.map((label) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => togglePhase(label)}
                          disabled={readOnly}
                          className={`min-h-9 rounded-md border px-2.5 text-[11px] font-semibold transition-colors disabled:opacity-50 ${markerLabel === label ? 'border-sky-400 bg-sky-500 text-white' : 'border-white/15 bg-white/5 text-slate-300 hover:border-sky-300/50'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* RIGHT PANEL — step-aware. Step 1: Key Moments (collapsible). Step 2:
                    the finding editor (edit an existing finding, or the create form).
                    Kept mounted; content switches. When read-only, the whole panel is
                    non-interactive so a locked report can never silently swallow a
                    phase/drill/Add-Finding click. */}
                <div
                  key="right-panel"
                  className={`space-y-3 rounded-xl border border-white/10 bg-white/5 p-3 ${
                    currentStep === 'drills' ? 'hidden' : (currentStep === 'analysis' && !panelOpen) ? 'hidden' : ''
                  } ${readOnly ? 'pointer-events-none opacity-60' : ''}`}
                >
                  {currentStep === 'analysis' ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-bold uppercase tracking-wider">Key Moments</div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 flex-shrink-0 border-cyan-300/40 bg-white/5 px-2.5 text-[11px] font-semibold text-white hover:bg-white/10"
                          onClick={() => setCustomMomentOpen((open) => !open)}
                          disabled={readOnly || !signedVideoUrl}
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" /> Custom Moment
                        </Button>
                      </div>
                      {customMomentOpen && !readOnly && (
                        <div className="space-y-2 rounded-lg border border-cyan-300/30 bg-cyan-400/5 p-2.5">
                          <div className="text-xs font-semibold text-slate-200">Add Custom Moment</div>
                          <Input
                            value={customMomentName}
                            onChange={(e) => setCustomMomentName(e.target.value)}
                            maxLength={80}
                            className="h-10 bg-white text-sm text-slate-950"
                            placeholder="Moment name (e.g. First breath)"
                          />
                          <div className="flex items-center gap-2 text-[11px] text-slate-300">
                            <span className="font-semibold">Time</span>
                            <span className="rounded border border-cyan-300/20 bg-cyan-400/10 px-2 py-0.5 font-mono text-cyan-200">{formatTimestamp(timestamp)}</span>
                            <span className="text-slate-500">from the video position</span>
                          </div>
                          <Input
                            value={customMomentNote}
                            onChange={(e) => setCustomMomentNote(e.target.value)}
                            maxLength={150}
                            className="h-10 bg-white text-sm text-slate-950"
                            placeholder="Note (optional)"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="h-9 flex-1 border-white/20 bg-white/5 text-xs text-white hover:bg-white/10" onClick={() => setCustomMomentOpen(false)}>
                              Cancel
                            </Button>
                            <Button size="sm" className="h-9 flex-1 bg-cyan-400 text-xs font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50" onClick={handleSaveCustomMoment} disabled={!customMomentName.trim() || savingMarker}>
                              {savingMarker ? 'Saving…' : 'Save Moment'}
                            </Button>
                          </div>
                        </div>
                      )}
                      <div className="max-h-[48vh] space-y-1.5 overflow-y-auto pr-1">
                        {keyMoments.length === 0 && (
                          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-[11px] leading-4 text-slate-400">
                            No moments yet. Pause on the moment that matters and use Add Moment or Custom Moment.
                          </div>
                        )}
                        {keyMoments.map((m, index) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => { const current = activeVideo(); if (current && Number.isFinite(m.seconds)) { current.pause(); current.currentTime = m.seconds; setTimestamp(m.seconds); } }}
                            className="flex w-full items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-left transition-colors hover:border-cyan-300/50 motion-reduce:transition-none"
                          >
                            <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${MOMENT_COLORS[index % MOMENT_COLORS.length]}`} aria-hidden="true" />
                            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-white">{m.phase}</span>
                            <span className="flex-shrink-0 font-mono text-[10px] text-cyan-200">{formatTimestamp(m.seconds)}</span>
                          </button>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-10 w-full border-dashed border-white/25 bg-white/5 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50"
                        onClick={() => capturePhaseMoment()}
                        disabled={!signedVideoUrl || !canEdit || savingMarker}
                      >
                        <Plus className="mr-1.5 h-4 w-4" /> {savingMarker ? 'Saving…' : 'Add Moment'}
                      </Button>
                      <p className="text-[10px] leading-4 text-slate-500">
                        Use drawing tools to highlight technique details. Add custom moments to mark key frames.
                      </p>
                    </>
                  ) : editorFinding ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 text-sm font-bold uppercase tracking-wider">
                          Edit Finding <span className="text-cyan-300">· {tagLabel(editorFinding.stroke_phase || editorFinding.phase || 'Finding')}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleDeleteFinding}
                          className="flex-shrink-0 rounded-md border border-red-400/30 bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-200 hover:bg-red-500/20"
                        >
                          Delete Finding
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-300">
                        <span className="font-semibold">Time</span>
                        <span className="rounded border border-cyan-300/20 bg-cyan-400/10 px-2 py-0.5 font-mono text-cyan-200">
                          {formatTimestamp(Number(editorFinding.timestamp_seconds ?? editorFinding.timestamp_start ?? 0) || 0)}
                        </span>
                        <span className="text-slate-500">video is seeked to this moment</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-slate-300">Observation</div>
                        <Textarea
                          value={editObservation}
                          onChange={(e) => setEditObservation(e.target.value)}
                          maxLength={200}
                          className="min-h-[64px] bg-white text-sm text-slate-950"
                          placeholder="What did you notice?"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-slate-300">Coach Cue</div>
                        <Input
                          value={editCue}
                          onChange={(e) => setEditCue(e.target.value)}
                          maxLength={200}
                          className="h-10 bg-white text-sm text-slate-950"
                          placeholder="What should the swimmer feel or do?"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-slate-300">Severity</div>
                        <div className={`grid gap-1.5 ${editSeverity === 'critical' ? 'grid-cols-4' : 'grid-cols-3'}`}>
                          {[...SEVERITY_OPTIONS, ...(editSeverity === 'critical' ? ['critical'] : [])].map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setEditSeverity(option)}
                              className={`min-h-10 rounded-lg border px-2 text-xs font-semibold capitalize transition-colors ${editSeverity === option ? 'border-amber-400 bg-amber-400 text-slate-950' : 'border-white/15 bg-white/5 text-slate-200 hover:border-amber-300/50'}`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-slate-300">Technique Area</div>
                        <div className="flex flex-wrap gap-1.5">
                          {quickLabels.map((label) => {
                            const key = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                            const active = String(editPhase || '').toLowerCase().replace(/[^a-z0-9]+/g, '_') === key;
                            return (
                              <button
                                key={label}
                                type="button"
                                onClick={() => setEditPhase(active ? '' : key)}
                                className={`min-h-9 rounded-full border px-2.5 text-[11px] font-semibold transition-colors ${active ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-white/15 bg-white/5 text-slate-200 hover:border-cyan-300/50'}`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-slate-300">Tags <span className="text-slate-500">(optional)</span></div>
                        <div className="flex flex-wrap gap-1.5">
                          {[...new Set([...FINDING_TAGS, ...editTags])].map((tag) => {
                            const active = editTags.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => setEditTags(active ? editTags.filter((t) => t !== tag) : [...editTags, tag])}
                                className={`min-h-9 rounded-full border px-2.5 text-[11px] font-semibold transition-colors ${active ? 'border-sky-400 bg-sky-400/90 text-slate-950' : 'border-white/15 bg-white/5 text-slate-300 hover:border-sky-300/50'}`}
                              >
                                {tagLabel(tag)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <details className="group rounded-lg border border-white/10 bg-white/5">
                        <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs font-semibold text-slate-300 [&::-webkit-details-marker]:hidden">
                          <span>Notes {editNotes.trim() ? <span className="text-cyan-300">· added</span> : <span className="text-slate-500">(optional)</span>}</span>
                          <span className="text-slate-500 transition-transform group-open:rotate-90">›</span>
                        </summary>
                        <div className="px-3 pb-3">
                          <Textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            maxLength={300}
                            className="min-h-[56px] bg-white text-sm text-slate-950"
                            placeholder="Add any extra notes about this finding…"
                          />
                        </div>
                      </details>
                      <div className="space-y-2 border-t border-white/10 pt-3">
                        <Button
                          className="h-11 w-full bg-cyan-400 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                          onClick={handleSaveFindingDetails}
                          disabled={readOnly || savingFindingDetails || !editObservation.trim()}
                        >
                          {savingFindingDetails ? 'Saving…' : 'Save Changes'}
                        </Button>
                        <Button size="sm" variant="outline" className="h-9 w-full border-white/20 bg-white/5 text-xs text-white hover:bg-white/10" onClick={clearFindingSelection}>
                          Done — back to Add Finding
                        </Button>
                        <p className="text-[10px] leading-4 text-slate-500">
                          Click on a finding to edit details, update the frame, and refine your feedback. Drawings you save now are linked to this finding.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                  <div className="text-sm font-bold uppercase tracking-wider">{readOnly ? 'Review (read-only)' : 'Add Coach Finding'}</div>

                  {reviewMode === 'ai' && findings.length > 0 && onReviewAISuggestions && (
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-2">
                      <div className="text-[11px] text-cyan-100">
                        {findings.length} AI suggestion{findings.length > 1 ? 's' : ''} to review
                      </div>
                      <Button size="sm" variant="outline" className="h-8 flex-shrink-0 border-cyan-300/40 bg-white/5 text-[11px] text-white hover:bg-white/10" onClick={onReviewAISuggestions}>
                        Review
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-slate-300">Stroke phase</div>
                      {phaseSelected && (
                        <button type="button" onClick={() => setMarkerLabel('')} className="text-[10px] font-semibold text-cyan-300 hover:text-cyan-200">
                          Clear phase
                        </button>
                      )}
                    </div>
                    {isIM && (
                      <div className="flex gap-1.5">
                        {IM_SEGMENTS.map((segment) => (
                          <button
                            key={segment.key}
                            type="button"
                            onClick={() => selectImSegment(segment.key)}
                            className={`min-h-10 flex-1 rounded-lg border px-2 text-xs font-semibold transition-colors ${imSegment === segment.key ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-white/15 bg-white/5 text-slate-200 hover:border-cyan-300/50'}`}
                          >
                            {segment.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {quickLabels.map((label) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => togglePhase(label)}
                          className={`min-h-10 rounded-full border px-3 text-xs font-semibold transition-colors ${markerLabel === label ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-white/15 bg-white/5 text-slate-200 hover:border-cyan-300/50'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-slate-300">Coach observation</div>
                    <Textarea
                      value={markerNote}
                      onChange={(e) => setMarkerNote(e.target.value)}
                      maxLength={150}
                      className="min-h-[64px] bg-white text-sm text-slate-950"
                      placeholder="What did you notice?"
                    />
                  </div>

                  <details className="group rounded-lg border border-white/10 bg-white/5">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs font-semibold text-slate-300 [&::-webkit-details-marker]:hidden">
                      <span>Coach cue {markerCue.trim() ? <span className="text-cyan-300">· added</span> : <span className="text-slate-500">(optional)</span>}</span>
                      <span className="text-slate-500 transition-transform group-open:rotate-90">›</span>
                    </summary>
                    <div className="px-3 pb-3">
                      <Input
                        value={markerCue}
                        onChange={(e) => setMarkerCue(e.target.value)}
                        maxLength={160}
                        className="h-10 bg-white text-sm text-slate-950"
                        placeholder="What should the swimmer feel or do?"
                      />
                    </div>
                  </details>

                  <details className="group rounded-lg border border-white/10 bg-white/5">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs font-semibold text-slate-300 [&::-webkit-details-marker]:hidden">
                      <span>Drills{selectedDrills.length > 0 ? ` (${selectedDrills.length})` : ''}</span>
                      <span className="text-slate-500 transition-transform group-open:rotate-90">›</span>
                    </summary>
                    <div className="space-y-2 px-3 pb-3">
                    <div className="flex items-center justify-end gap-2">
                      <div className="flex gap-0.5 rounded-md bg-white/5 p-0.5">
                        <button
                          type="button"
                          onClick={() => setDrillMode('suggested')}
                          className={`rounded px-2 py-1 text-[10px] font-semibold transition-colors ${drillMode === 'suggested' ? 'bg-cyan-400 text-slate-950' : 'text-slate-300 hover:bg-white/10'}`}
                        >
                          Suggested
                        </button>
                        <button
                          type="button"
                          onClick={() => setDrillMode('custom')}
                          className={`rounded px-2 py-1 text-[10px] font-semibold transition-colors ${drillMode === 'custom' ? 'bg-cyan-400 text-slate-950' : 'text-slate-300 hover:bg-white/10'}`}
                        >
                          Custom drill
                        </button>
                      </div>
                    </div>

                    {/* Selected drills — the first is the Primary Drill, the rest Additional. */}
                    {selectedDrills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedDrills.map((drill, drillIndex) => (
                          <span key={drill.id} className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/40 bg-cyan-400/15 py-1 pl-2 pr-1 text-[11px] font-semibold text-cyan-100">
                            <span className="rounded-sm bg-cyan-400/30 px-1 text-[9px] uppercase tracking-wide text-cyan-50">{drillIndex === 0 ? 'Primary' : `Drill ${drillIndex + 1}`}</span>
                            <span className="max-w-[9rem] truncate">{drill.title}</span>
                            <button type="button" onClick={() => removeDrill(drill.id)} className="flex h-5 w-5 items-center justify-center rounded-full text-cyan-100 hover:bg-cyan-400/30" aria-label={`Remove ${drill.title}`}>
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Favourite drills — one-tap add (club-scoped). */}
                    {favouriteDrillList.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300"><Star className="h-3 w-3 fill-amber-300" /> Favourites</div>
                        <div className="flex flex-wrap gap-1.5">
                          {favouriteDrillList.map((drill) => (
                            <button key={drill.id} type="button" onClick={() => addNormalizedDrill(drill)} className="inline-flex max-w-[11rem] items-center gap-1 rounded-full border border-amber-300/40 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-100 hover:bg-amber-400/20">
                              <Plus className="h-3 w-3 flex-shrink-0" /><span className="truncate">{drill.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recently used drills in this report. */}
                    {recentDrills.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Recent</div>
                        <div className="flex flex-wrap gap-1.5">
                          {recentDrills.slice(0, 6).map((drill) => (
                            <button key={drill.id} type="button" onClick={() => addNormalizedDrill(drill)} className="inline-flex max-w-[11rem] items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-cyan-300/40">
                              <Plus className="h-3 w-3 flex-shrink-0" /><span className="truncate">{drill.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {drillMode === 'suggested' ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            value={drillQuery}
                            onChange={(e) => setDrillQuery(e.target.value)}
                            className="h-11 bg-white pl-8 text-sm text-slate-950"
                            placeholder="Search drills (e.g. narrow knee, timing, catch)"
                          />
                        </div>
                        <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-slate-900/40 p-1">
                          {drillListForPicker.length === 0 ? (
                            <div className="px-2 py-3 text-center text-[11px] text-slate-400">No drills match — try another word.</div>
                          ) : (
                            drillListForPicker.map((drill) => {
                              const active = isDrillSelected(drill.id);
                              const favourited = isLibraryFavourited(drill.id);
                              return (
                                <div key={drill.id} className={`flex items-center gap-1 rounded-md transition-colors ${active ? 'bg-cyan-400/20' : 'hover:bg-white/5'}`}>
                                  <button
                                    type="button"
                                    onClick={() => (active ? removeDrill(drill.id) : addLibraryDrill(drill))}
                                    className="flex min-w-0 flex-1 items-start gap-2 px-2.5 py-2 text-left"
                                  >
                                    <span className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border text-[10px] font-bold ${active ? 'border-cyan-300 bg-cyan-400 text-slate-950' : 'border-white/25 text-transparent'}`}>✓</span>
                                    <span className="min-w-0">
                                      <span className="block text-xs font-semibold text-white">{drill.title}</span>
                                      {(drill.report_summary || drill.purpose) && (
                                        <span className="block truncate text-[10px] text-slate-400">{drill.report_summary || drill.purpose}</span>
                                      )}
                                    </span>
                                  </button>
                                  {canManageFavourites && (
                                    <button
                                      type="button"
                                      onClick={() => onToggleFavourite?.({ id: drill.id })}
                                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-slate-400 hover:text-amber-300"
                                      title={favourited ? 'Remove from favourites' : 'Add to favourites'}
                                      aria-label={favourited ? 'Remove from favourites' : 'Add to favourites'}
                                    >
                                      <Star className={`h-4 w-4 ${favourited ? 'fill-amber-300 text-amber-300' : ''}`} />
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">Tap to add one or more drills.</div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          value={customDrillTitle}
                          onChange={(e) => setCustomDrillTitle(e.target.value)}
                          maxLength={120}
                          className="h-11 bg-white text-sm text-slate-950"
                          placeholder="Custom drill title (e.g. Narrow-knee band kick)"
                        />
                        <Textarea
                          value={customDrillSummary}
                          onChange={(e) => setCustomDrillSummary(e.target.value)}
                          maxLength={400}
                          className="min-h-[56px] bg-white text-sm text-slate-950"
                          placeholder="How to do it / description"
                        />
                        <Input
                          value={customDrillCue}
                          onChange={(e) => setCustomDrillCue(e.target.value)}
                          maxLength={160}
                          className="h-11 bg-white text-sm text-slate-950"
                          placeholder="Coaching cue (optional)"
                        />
                        <Input
                          value={customDrillWhy}
                          onChange={(e) => setCustomDrillWhy(e.target.value)}
                          maxLength={200}
                          className="h-11 bg-white text-sm text-slate-950"
                          placeholder="Why this helps / focus (optional)"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-10 flex-1 border-cyan-300/40 bg-white/5 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-50"
                            onClick={addCustomDrill}
                            disabled={!customDrillTitle.trim()}
                          >
                            <Plus className="mr-1.5 h-4 w-4" /> Add this drill
                          </Button>
                          {canManageFavourites && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-10 flex-shrink-0 border-amber-300/40 bg-amber-400/10 px-3 text-xs font-semibold text-amber-100 hover:bg-amber-400/20 disabled:opacity-50"
                              onClick={() => onSaveCustomFavourite?.({ title: customDrillTitle, summary: customDrillSummary, cue: customDrillCue })}
                              disabled={!customDrillTitle.trim()}
                              title="Save as favourite"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                    </div>
                  </details>

                  {linkedEvidenceOptions.length > 0 && (
                    <details className="group rounded-lg border border-white/10 bg-white/5">
                      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs font-semibold text-slate-300 [&::-webkit-details-marker]:hidden">
                        <span>Linked image {effectiveLinkId ? <span className="text-cyan-300">· linked</span> : <span className="text-slate-500">(evidence)</span>}</span>
                        <span className="text-slate-500 transition-transform group-open:rotate-90">›</span>
                      </summary>
                      <div className="space-y-1.5 px-3 pb-3">
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        <button
                          type="button"
                          onClick={() => setLinkChoice('none')}
                          className={`flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-lg border text-[10px] font-semibold transition-colors ${linkChoice === 'none' ? 'border-cyan-400 bg-cyan-400/20 text-cyan-100' : 'border-white/15 bg-white/5 text-slate-300 hover:border-cyan-300/40'}`}
                        >
                          No image
                        </button>
                        {linkedEvidenceOptions.map((ev) => (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => setLinkChoice(ev.id)}
                            title={ev.label}
                            className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border transition-colors ${effectiveLinkId === ev.id ? 'border-cyan-400 ring-2 ring-cyan-400/40' : 'border-white/15 hover:border-cyan-300/40'}`}
                          >
                            <img src={ev.thumb} alt="" className="h-full w-full object-cover" />
                            <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-[8px] font-mono text-white">
                              {ev.kind === 'drawing' ? 'Draw' : formatTimestamp(ev.seconds)}
                            </span>
                          </button>
                        ))}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {effectiveLinkId ? '✓ Image linked to this finding' : 'This finding will have no image.'}
                      </div>
                      </div>
                    </details>
                  )}

                  <div className="space-y-2 border-t border-white/10 pt-3">
                    <Button className="h-12 w-full bg-cyan-400 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50" onClick={addFindingInline} disabled={readOnly || !signedVideoUrl || savingFinding || (!markerNote.trim() && !phaseSelected)}>
                      <Plus className="mr-1.5 h-5 w-5" /> {readOnly ? 'Report is read-only' : (savingFinding ? 'Adding…' : 'Add Finding')}
                    </Button>
                    {!readOnly && (!markerNote.trim() && !phaseSelected) && (
                      <p className="text-[10px] text-slate-400">Pick a phase or type a note to add a finding.</p>
                    )}
                    {addedFindingCount > 0 && (
                      <p className="text-[11px] font-semibold text-emerald-300">✓ {addedFindingCount} finding{addedFindingCount > 1 ? 's' : ''} added to this report.</p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {onSaveMarker && (
                        <Button size="sm" variant="outline" className="min-h-11 text-xs border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => capturePhaseMoment()} disabled={!signedVideoUrl || !canEdit || savingMarker}>
                          <BookmarkPlus className="mr-1.5 h-4 w-4 text-cyan-300" /> {savingMarker ? 'Saving…' : 'Save Phase Moment'}
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="min-h-11 text-xs border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={startDrawing} disabled={!signedVideoUrl || !canEdit}>
                        <PencilLine className="mr-1.5 h-4 w-4 text-cyan-300" /> Coach Draw
                      </Button>
                    </div>
                  </div>
                    </>
                  )}
                </div>

                {/* STEP 3 ONLY: Drills — attached per finding (primary + additional,
                    the existing storage model), plus the searchable library. */}
                <div key="drills-col" className={currentStep === 'drills' ? `min-w-0 space-y-3 ${readOnly ? 'pointer-events-none opacity-60' : ''}` : 'hidden'}>
                  {(() => {
                    const drillFinding = sortedFindings.find((f) => f.id === (drillFindingId || selectedFindingId)) || sortedFindings[0] || null;
                    const attached = findingDrillList(drillFinding);
                    return (
                      <>
                        <div>
                          <div className="text-sm font-bold uppercase tracking-wider">Drills</div>
                          <div className="text-[10px] text-slate-400">Attach drills to support each finding.</div>
                        </div>
                        {sortedFindings.length === 0 ? (
                          <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
                            <p className="text-xs text-slate-400">No findings yet — add findings first, then attach drills here.</p>
                            <Button size="sm" variant="outline" className="h-9 border-white/20 bg-white/5 text-xs text-white hover:bg-white/10" onClick={() => goToStep('findings')}>
                              Go to Findings
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-wrap gap-1.5">
                              {sortedFindings.map((finding) => {
                                const active = drillFinding?.id === finding.id;
                                const seconds = Number(finding.timestamp_seconds ?? finding.timestamp_start ?? NaN);
                                return (
                                  <button
                                    key={finding.id}
                                    type="button"
                                    onClick={() => setDrillFindingId(finding.id)}
                                    className={`min-h-9 rounded-full border px-2.5 text-[11px] font-semibold transition-colors ${active ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-white/15 bg-white/5 text-slate-200 hover:border-cyan-300/50'}`}
                                  >
                                    {tagLabel(finding.stroke_phase || finding.phase || 'Finding')}{Number.isFinite(seconds) ? ` · ${formatTimestamp(seconds)}` : ''}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="space-y-2">
                              {attached.length === 0 && (
                                <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-[11px] text-slate-400">
                                  No drills attached to this finding yet. Add one from the library below.
                                </div>
                              )}
                              {attached.map((drill, index) => (
                                <div key={`${drill.title}-${index}`} className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="rounded-sm bg-cyan-400/30 px-1 text-[9px] uppercase tracking-wide text-cyan-100">{index === 0 ? 'Primary' : `Drill ${index + 1}`}</span>
                                      <span className="text-xs font-bold text-white">{drill.title}</span>
                                    </div>
                                    {drill.summary && <div className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-slate-400">{drill.summary}</div>}
                                  </div>
                                  {index > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => { const next = [...attached]; const [item] = next.splice(index, 1); next.splice(index - 1, 0, item); writeFindingDrills(drillFinding, next); }}
                                      disabled={savingFindingDetails}
                                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-40"
                                      title="Move up"
                                      aria-label={`Move ${drill.title} up`}
                                    >
                                      ↑
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => writeFindingDrills(drillFinding, attached.filter((_, i) => i !== index))}
                                    disabled={savingFindingDetails}
                                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-slate-400 hover:bg-red-500/20 hover:text-red-200 disabled:opacity-40"
                                    title="Remove drill"
                                    aria-label={`Remove ${drill.title}`}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-2.5">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Drill Library</div>
                              <div className="relative">
                                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                  value={drillQuery}
                                  onChange={(e) => setDrillQuery(e.target.value)}
                                  className="h-10 bg-white pl-8 text-sm text-slate-950"
                                  placeholder="Search drills…"
                                />
                              </div>
                              <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-slate-900/40 p-1">
                                {drillListForPicker.length === 0 ? (
                                  <div className="px-2 py-3 text-center text-[11px] text-slate-400">No drills match — try another word.</div>
                                ) : (
                                  drillListForPicker.map((drill) => {
                                    const already = attached.some((d) => d.title === drill.title);
                                    return (
                                      <div key={drill.id} className="flex items-center gap-1 rounded-md hover:bg-white/5">
                                        <div className="min-w-0 flex-1 px-2.5 py-2">
                                          <div className="text-xs font-semibold text-white">{drill.title}</div>
                                          {(drill.report_summary || drill.purpose) && (
                                            <div className="truncate text-[10px] text-slate-400">{drill.report_summary || drill.purpose}</div>
                                          )}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => !already && writeFindingDrills(drillFinding, [...attached, { title: drill.title, summary: drillSummary(drill), id: drill.id }])}
                                          disabled={already || savingFindingDetails}
                                          className={`mr-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded disabled:opacity-60 ${already ? 'text-emerald-300' : 'bg-cyan-400/20 text-cyan-200 hover:bg-cyan-400/40'}`}
                                          title={already ? 'Already attached' : `Add ${drill.title}`}
                                          aria-label={already ? 'Already attached' : `Add ${drill.title}`}
                                        >
                                          {already ? '✓' : <Plus className="h-4 w-4" />}
                                        </button>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* STEP 3 ONLY: Coach comments + live report preview + finalise. */}
                <div key="comments-col" className={currentStep === 'drills' ? 'space-y-3' : 'hidden'}>
                  <div>
                    <div className="text-sm font-bold uppercase tracking-wider">Coach Comments</div>
                    <div className="text-[10px] text-slate-400">Add private notes and swimmer-ready feedback.</div>
                  </div>
                  <div className={`space-y-3 rounded-xl border border-white/10 bg-white/5 p-3 ${readOnly ? 'pointer-events-none opacity-60' : ''}`}>
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-slate-300">Private Notes <span className="text-slate-500">(Coach Only)</span></div>
                      <Textarea
                        value={privateNotes}
                        onChange={(e) => { setPrivateNotes(e.target.value); setCommentsDirty(true); }}
                        maxLength={1000}
                        className="min-h-[72px] bg-white text-sm text-slate-950"
                        placeholder="Notes for you — never shown to swimmers or parents."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-slate-300">Swimmer Feedback <span className="text-slate-500">(Shown in Report)</span></div>
                      <Textarea
                        value={swimmerFeedback}
                        onChange={(e) => { setSwimmerFeedback(e.target.value); setCommentsDirty(true); }}
                        maxLength={1500}
                        className="min-h-[72px] bg-white text-sm text-slate-950"
                        placeholder="What should the swimmer focus on? This appears in the shared report."
                      />
                    </div>
                    <Button
                      size="sm"
                      className="h-10 w-full bg-cyan-400 text-xs font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                      onClick={handleSaveComments}
                      disabled={readOnly || savingComments || !commentsDirty}
                    >
                      {savingComments ? 'Saving…' : commentsDirty ? 'Save Comments' : '✓ Comments saved'}
                    </Button>
                  </div>
                  <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-300">Report Preview</div>
                      <div className="text-[10px] text-slate-400">This is how your report will look for swimmers and parents.</div>
                    </div>
                    {(() => {
                      const approved = sortedFindings.filter((f) => f.approval_status === 'approved');
                      const first = approved[0] || null;
                      const firstThumb = first ? findingThumbById.get(first.id) : null;
                      const firstDrills = first ? findingDrillList(first) : [];
                      return (
                        <>
                          {first ? (
                            <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-900/50">
                              {firstThumb && <img src={firstThumb} alt="" className="aspect-video w-full object-cover" />}
                              <div className="space-y-1.5 p-2.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-amber-300" aria-hidden="true" />
                                  <span className="text-xs font-bold text-white">{tagLabel(first.stroke_phase || first.phase || 'Finding')}</span>
                                </div>
                                <p className="text-[11px] leading-4 text-slate-300">{first.observation || first.coach_sees || ''}</p>
                                {(first.correction_cue || first.cue) && (
                                  <div>
                                    <div className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Coach Cue</div>
                                    <p className="text-[11px] leading-4 text-slate-300">{first.correction_cue || first.cue}</p>
                                  </div>
                                )}
                                {firstDrills.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {firstDrills.slice(0, 3).map((drill) => (
                                      <span key={drill.title} className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-slate-200">{drill.title}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-[11px] text-slate-400">
                              No approved findings yet — the shared report will show your summary once findings are added.
                            </div>
                          )}
                          <p className="text-[10px] leading-4 text-slate-500">
                            {approved.length} finding{approved.length === 1 ? '' : 's'} in the report. Swimmer reports only show approved findings, cues and drills.
                          </p>
                        </>
                      );
                    })()}
                  </div>
                  {(onFinaliseReport || onFinalise) && (
                    <Button
                      className="h-12 w-full bg-sky-500 text-sm font-bold text-white hover:bg-sky-400"
                      onClick={() => {
                        if (reportFinalised) { setFinaliseFlow('ready'); return; }
                        if (onFinaliseReport && canFinalise) { setFinaliseFlow('confirm'); return; }
                        closeFullscreen(); onFinalise?.();
                      }}
                    >
                      <CheckCircle2 className="mr-1.5 h-5 w-5" /> {reportFinalised ? 'View Report' : 'Finalise Report'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Bottom step navigation — Back / Next per step (the reference layout). */}
              <div className="flex items-center justify-between gap-2">
                {stepIndex > 0 ? (
                  <Button size="sm" variant="outline" className="h-10 border-white/20 bg-white/5 px-3 text-xs font-semibold text-white hover:bg-white/10" onClick={goPrevStep}>
                    ← Back: {STUDIO_STEPS[stepIndex - 1].label}
                  </Button>
                ) : (
                  <span className="text-[10px] text-slate-500">
                    {currentStep === 'analysis' ? 'Use drawing tools to highlight technique details. Add custom moments to mark key frames.' : ''}
                  </span>
                )}
                {stepIndex < STUDIO_STEPS.length - 1 ? (
                  <Button size="sm" className="h-10 bg-sky-500 px-3 text-xs font-bold text-white hover:bg-sky-400" onClick={goNextStep}>
                    Next: {STUDIO_STEPS[stepIndex + 1].label} →
                  </Button>
                ) : (
                  (onFinaliseReport || onFinalise) && (
                    <Button size="sm" className="h-10 bg-sky-500 px-3 text-xs font-bold text-white hover:bg-sky-400" onClick={() => {
                      if (reportFinalised) { setFinaliseFlow('ready'); return; }
                      if (onFinaliseReport && canFinalise) { setFinaliseFlow('confirm'); return; }
                      closeFullscreen(); onFinalise?.();
                    }}>
                      {reportFinalised ? 'View Report' : 'Finalise Report'}
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Sticky poolside action bar — always-visible primary actions for iPad. Hidden
              while drawing so it never overlaps the annotation toolbar. */}
          {!drawing && (readOnly ? (
            <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-slate-950/95 px-4 py-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-200">
                <Lock className="h-4 w-4 flex-shrink-0" />
                <span>Report is read-only — open a draft review to add findings, phase moments, or drawings.</span>
              </div>
              {reportFinalised && (onFinaliseReport || onFinalise) && (
                <Button className="h-10 flex-shrink-0 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white hover:bg-white/10" onClick={() => setFinaliseFlow('ready')}>
                  <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-300" /> View report
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-stretch gap-2 border-t border-white/10 bg-slate-950/95 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-6">
              {onSaveMarker && (
                <Button
                  className="h-12 flex-1 flex-col gap-0.5 rounded-xl border border-white/15 bg-white/5 text-[11px] font-semibold leading-tight text-white hover:bg-white/10 disabled:opacity-50"
                  onClick={() => capturePhaseMoment()}
                  disabled={!signedVideoUrl || !canEdit || savingMarker}
                >
                  <BookmarkPlus className="h-5 w-5 text-cyan-300" />
                  {savingMarker ? 'Saving…' : 'Phase Moment'}
                </Button>
              )}
              <Button
                className="h-12 flex-1 flex-col gap-0.5 rounded-xl bg-cyan-400 text-[11px] font-semibold leading-tight text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                onClick={addFindingInline}
                disabled={!signedVideoUrl || !canEdit || savingFinding || (!markerNote.trim() && !phaseSelected)}
              >
                <Plus className="h-5 w-5" />
                {savingFinding ? 'Adding…' : 'Add Finding'}
              </Button>
              <Button
                className="h-12 flex-1 flex-col gap-0.5 rounded-xl border border-white/15 bg-white/5 text-[11px] font-semibold leading-tight text-white hover:bg-white/10 disabled:opacity-50"
                onClick={startDrawing}
                disabled={!signedVideoUrl || !canEdit}
              >
                <PencilLine className="h-5 w-5 text-cyan-300" />
                Coach Draw
              </Button>
              {(onFinaliseReport || onFinalise) && (
                <Button
                  className="h-12 flex-1 flex-col gap-0.5 rounded-xl border border-white/15 bg-white/5 text-[11px] font-semibold leading-tight text-white hover:bg-white/10"
                  onClick={() => {
                    if (reportFinalised) { setFinaliseFlow('ready'); return; }
                    if (onFinaliseReport && canFinalise) { setFinaliseFlow('confirm'); return; }
                    closeFullscreen(); onFinalise?.();
                  }}
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  {reportFinalised ? 'View' : 'Finalise'}
                </Button>
              )}
            </div>
          ))}
        </div>,
        document.body
      )}

      {/* Finalise confirm — deliberate coach action before locking the report. */}
      {finaliseFlow === 'confirm' && createPortal(
        <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-slate-900 p-6 text-white">
            <div>
              <h2 className="text-base font-bold">Finalise report?</h2>
              <p className="mt-1 text-xs text-slate-300">
                This locks the coach report and makes it ready to print or share. You can still view it afterwards.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="h-11 flex-1 border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => setFinaliseFlow('idle')}>
                Cancel
              </Button>
              <Button className="h-11 flex-1 bg-green-600 text-white hover:bg-green-500" onClick={runFinalise}>
                Finalise Report
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Reopen confirm — deliberate coach action; pauses the shared link. */}
      {reopenConfirm && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-slate-900 p-6 text-white">
            <div>
              <h2 className="text-base font-bold">Reopen this report?</h2>
              <p className="mt-1 text-xs text-slate-300">
                It becomes editable again, and the shared link is paused. No one can view it until you re-finalise and re-share.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="h-11 flex-1 border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => setReopenConfirm(false)} disabled={reopening}>
                Cancel
              </Button>
              <Button className="h-11 flex-1 bg-amber-500 text-slate-950 hover:bg-amber-400" onClick={runReopen} disabled={reopening}>
                {reopening ? 'Reopening…' : 'Reopen report'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Report-ready panel — fullscreen-first, never the old dashboard. */}
      {(finaliseFlow === 'saving' || finaliseFlow === 'ready') && createPortal(
        <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-slate-900 p-6 text-center text-white">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
            <div>
              <h2 className="text-lg font-bold">{finaliseFlow === 'saving' ? 'Finalising…' : 'Report ready'}</h2>
              <p className="mt-1 text-xs text-slate-300">
                {finaliseFlow === 'saving'
                  ? 'Saving the coach report.'
                  : 'Your coach report is finalised — print it or share it with the swimmer.'}
              </p>
            </div>
            {finaliseFlow === 'ready' && (
              <div className="space-y-2">
                <Button className="h-11 w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300" onClick={() => onPrintReport?.()}>
                  <Download className="mr-1.5 h-4 w-4" /> View / Print PDF
                </Button>
                {shareLink && (
                  <Button variant="outline" className="h-11 w-full border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={copyShareLink}>
                    <Share2 className="mr-1.5 h-4 w-4" /> {shareCopied ? 'Link copied' : 'Copy share link'}
                  </Button>
                )}
                {!shareLink && onReshare && (
                  <Button className="h-11 w-full bg-cyan-500 text-white hover:bg-cyan-400" onClick={runReshare} disabled={resharing}>
                    <Share2 className="mr-1.5 h-4 w-4" /> {resharing ? 'Re-sharing…' : 'Re-share updated report'}
                  </Button>
                )}
                <Button variant="outline" className="h-11 w-full border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => setFinaliseFlow('idle')}>
                  {reportFinalised ? 'View review (read-only)' : 'Continue editing'}
                </Button>
                {canReopen && (
                  <Button variant="outline" className="h-11 w-full border-amber-300/40 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20" onClick={() => setReopenConfirm(true)} disabled={reopening}>
                    {reopening ? 'Reopening…' : 'Reopen for editing'}
                  </Button>
                )}
                <Button variant="ghost" className="h-11 w-full text-slate-300 hover:bg-white/10" onClick={() => onBackToAnalyse?.()}>
                  Back to Analyse
                </Button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {video?.capture_source === 'swimpro_export' && (
        <div className="text-[10px] text-muted-foreground p-2.5 rounded-lg bg-secondary/50 border border-border">
          SwimPro export support means coaches can upload video files they already have permission to export and use.
        </div>
      )}
    </div>
  );
}

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
  Maximize2,
  PencilLine,
  Plus,
  Rewind,
  Search,
  Share2,
  SlidersHorizontal,
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
  onBackToAnalyse,
  onReviewAISuggestions,
  onCreateFinding,
  onFinaliseReport,
  onPrintReport,
  shareLink,
  swimmer,
  onFinalise,
  canEdit = true,
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
  const [markerIncludeInReport, setMarkerIncludeInReport] = useState(false);
  const [controlsExpanded, setControlsExpanded] = useState(false);
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
  const phaseSelected = Boolean(markerLabel && markerLabel.trim());
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
  // Key moments come from saved key_frame annotations (which carry a captured thumbnail),
  // not from findings — so the strip shows real screenshots.
  const keyMoments = (keyStamps || []).map((a) => ({
    id: a.id,
    seconds: Number(a.timestamp_seconds ?? 0) || 0,
    phase: a.title || a.frame_label || 'Key moment',
    note: a.coach_note || '',
    thumb: (typeof a.thumbnail_data_url === 'string' && a.thumbnail_data_url.startsWith('data:image/')) ? a.thumbnail_data_url : null,
  }));

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
    });
  }, [storageKey, fullscreenOpen, markerNote, markerLabel, drillMode, selectedDrills, imSegment]);

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
        drills: drillsToSend,
        keyStampLinkId: lastCapturedMomentId || null,
      });
      setAddedFindingCount((n) => n + 1);
      setActionFeedback({ type: 'success', msg: 'Finding added' });
      setMarkerNote('');
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
        findingId: linkedFindingId || null,
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
    <div className={`relative overflow-hidden bg-black ${isFullscreen ? 'rounded-xl min-h-[46vh] lg:min-h-[68vh]' : 'rounded-lg'}`} style={{ aspectRatio: '16/9' }}>
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
          {/* Top bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Swim Sight 3D · Manual Review</span>
              {swimmer?.name && <span className="text-sm font-semibold">{swimmer.name}</span>}
              {video?.stroke_type && <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs text-slate-200">{video.stroke_type}</span>}
              <span className="rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-0.5 font-mono text-xs text-cyan-200">{formatTimestamp(timestamp)}</span>
            </div>
            <Button size="sm" variant="outline" className="h-11 px-4 text-sm font-semibold border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={closeFullscreen}>
              <X className="mr-1.5 h-4 w-4" /> Exit Review
            </Button>
          </div>

          {/* Scrollable workspace body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto max-w-[1600px] space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
                {/* LEFT: video + playback */}
                <div className="space-y-3">
                  {renderVideoSurface(fullscreenVideoRef, true)}
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Speed</span>
                        {PLAYBACK_SPEEDS.map((speed) => (
                          <button
                            key={speed}
                            type="button"
                            onClick={() => setPlaybackRate(speed)}
                            className={`h-11 min-w-[3rem] rounded-md px-2 text-xs font-semibold transition-colors ${playbackRate === speed ? 'bg-cyan-400 text-slate-950' : 'bg-white/5 text-slate-200 hover:bg-white/10'}`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-11 px-3 text-xs border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => seekBy(-1)} disabled={!signedVideoUrl}>
                          <Rewind className="mr-1 h-4 w-4" /> 1s
                        </Button>
                        <Button size="sm" variant="outline" className="h-11 px-3 text-xs border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => seekBy(1)} disabled={!signedVideoUrl}>
                          <FastForward className="mr-1 h-4 w-4" /> 1s
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Mark this moment (compact so the video stays the hero) */}
                <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-sm font-bold uppercase tracking-wider">Mark this moment</div>

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
                    <div className="text-xs font-semibold text-slate-300">Coach note</div>
                    <Textarea
                      value={markerNote}
                      onChange={(e) => setMarkerNote(e.target.value)}
                      maxLength={150}
                      className="min-h-[64px] bg-white text-sm text-slate-950"
                      placeholder="What did you notice?"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-slate-300">Drills{selectedDrills.length > 0 ? ` (${selectedDrills.length})` : ''}</div>
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
                              return (
                                <button
                                  key={drill.id}
                                  type="button"
                                  onClick={() => (active ? removeDrill(drill.id) : addLibraryDrill(drill))}
                                  className={`flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left transition-colors ${active ? 'bg-cyan-400/20' : 'hover:bg-white/5'}`}
                                >
                                  <span className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border text-[10px] font-bold ${active ? 'border-cyan-300 bg-cyan-400 text-slate-950' : 'border-white/25 text-transparent'}`}>✓</span>
                                  <span className="min-w-0">
                                    <span className="block text-xs font-semibold text-white">{drill.title}</span>
                                    {(drill.report_summary || drill.purpose) && (
                                      <span className="block truncate text-[10px] text-slate-400">{drill.report_summary || drill.purpose}</span>
                                    )}
                                  </span>
                                </button>
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
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-10 w-full border-cyan-300/40 bg-white/5 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-50"
                          onClick={addCustomDrill}
                          disabled={!customDrillTitle.trim()}
                        >
                          <Plus className="mr-1.5 h-4 w-4" /> Add this drill
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 border-t border-white/10 pt-3">
                    <Button className="h-12 w-full bg-cyan-400 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50" onClick={addFindingInline} disabled={!signedVideoUrl || !canEdit || savingFinding || (!markerNote.trim() && !phaseSelected)}>
                      <Plus className="mr-1.5 h-5 w-5" /> {savingFinding ? 'Adding…' : 'Add Finding'}
                    </Button>
                    {(!markerNote.trim() && !phaseSelected) && (
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
                </div>
              </div>

              {/* Bottom: phase moments + finalise */}
              <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-300">Phase moments ({keyMoments.length})</div>
                  {(onFinaliseReport || onFinalise) && (
                    <Button size="sm" className="h-10 bg-white/10 px-4 text-xs font-semibold text-white hover:bg-white/20" onClick={() => {
                      if (reportFinalised) { setFinaliseFlow('ready'); return; }
                      if (onFinaliseReport && canFinalise) { setFinaliseFlow('confirm'); return; }
                      closeFullscreen(); onFinalise?.();
                    }}>
                      {reportFinalised ? 'View report' : 'Finalise Report'}
                    </Button>
                  )}
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {keyMoments.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { const current = activeVideo(); if (current && Number.isFinite(m.seconds)) { current.currentTime = m.seconds; setTimestamp(m.seconds); } }}
                      className="w-36 flex-shrink-0 rounded-lg border border-white/10 bg-white/5 p-2 text-left transition-colors hover:border-cyan-300/50"
                    >
                      {m.thumb ? (
                        <img src={m.thumb} alt={m.phase} className="mb-2 aspect-video w-full rounded bg-slate-800 object-cover" />
                      ) : (
                        <div className="mb-2 flex aspect-video items-center justify-center rounded bg-slate-800 text-[10px] text-slate-400">Phase moment</div>
                      )}
                      <div className="font-mono text-[10px] text-cyan-200">{formatTimestamp(m.seconds)}</div>
                      <div className="truncate text-xs font-semibold text-white">{m.phase}</div>
                      {m.note && <div className="truncate text-[10px] text-slate-400">{m.note}</div>}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => capturePhaseMoment()}
                    disabled={!signedVideoUrl || !canEdit || savingMarker}
                    className="flex w-36 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/20 bg-white/5 p-2 text-slate-300 transition-colors hover:border-cyan-300/50 disabled:opacity-50"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-xs font-semibold">{savingMarker ? 'Saving…' : 'Capture moment'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky poolside action bar — always-visible primary actions for iPad. Hidden
              while drawing so it never overlaps the annotation toolbar. */}
          {!drawing && (
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
                className="h-14 flex-1 flex-col gap-0.5 rounded-xl bg-cyan-400 text-[11px] font-semibold leading-tight text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                onClick={addFindingInline}
                disabled={!signedVideoUrl || !canEdit || savingFinding || (!markerNote.trim() && !phaseSelected)}
              >
                <Plus className="h-5 w-5" />
                {savingFinding ? 'Adding…' : 'Add Finding'}
              </Button>
              <Button
                className="h-14 flex-1 flex-col gap-0.5 rounded-xl border border-white/15 bg-white/5 text-[11px] font-semibold leading-tight text-white hover:bg-white/10 disabled:opacity-50"
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
          )}
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
                <Button variant="outline" className="h-11 w-full border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => setFinaliseFlow('idle')}>
                  Continue editing
                </Button>
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

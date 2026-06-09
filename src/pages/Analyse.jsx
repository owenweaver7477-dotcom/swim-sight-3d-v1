/**
 * Analyse.jsx — Unified analysis workflow
 * Steps: Select Swimmer → Upload Video → Configure Review → Analyse
 * Replaces the old Upload → Setup → Analysis 3-page chain.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import entities from '@/lib/data/entities';
import functions from '@/lib/data/functions';
import { uploadPrivateVideo } from '@/lib/data/videoUploads';
import { getReviewSession, setReviewSession, setCoachModeFinding,
  SWIM_STROKES_FULL, CAMERA_ANGLES, SESSION_TYPES, SEVERITY_LEVELS, FAULT_SUGGESTIONS } from '@/lib/swimState';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import FindingCard from '@/components/analysis/FindingCard';
import AiFindingSuggester from '@/components/analysis/AiFindingSuggester';
import VideoLibrary from '@/components/analysis/VideoLibrary';
import SessionModeSelector from '@/components/analysis/SessionModeSelector';
import MultiAngleUploader from '@/components/analysis/MultiAngleUploader';
import CameraGuidancePanel from '@/components/analysis/CameraGuidancePanel';
import {
  Play, Pause, SkipBack, SkipForward, Bookmark, FileText,
  Upload, CheckCircle2, AlertCircle, Loader2, Film, X,
  Plus, Target, Dumbbell, User, ChevronRight, ArrowLeft, Zap
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useClubContext } from '@/lib/useClubContext';
import FeedbackButton from '@/components/coach-testing/FeedbackButton';
import ReviewSetupPanel from '@/components/analysis/ReviewSetupPanel';

// ─── Stroke phase sets ────────────────────────────────────────────────────────
const STROKE_PHASES = {
  Freestyle: ['Entry', 'Catch', 'Pull', 'Push', 'Recovery', 'Body Rotation', 'Breathing', 'Kick Timing'],
  Breaststroke: ['Streamline', 'Outsweep', 'Catch', 'Insweep', 'Recovery', 'Heels Up', 'Foot Turn', 'Kick Snap', 'Finish', 'Glide'],
  Backstroke: ['Hand Entry', 'Catch', 'Pull', 'Shoulder Rotation', 'Hip Position', 'Kick Timing', 'Finish'],
  Butterfly: ['Entry', 'Catch', 'Press', 'Pull', 'First Kick', 'Second Kick', 'Recovery', 'Body Line'],
  Start: ['Set Position', 'Reaction', 'Block Push', 'Flight', 'Entry', 'Streamline', 'Breakout'],
  Turn: ['Approach', 'Rotation', 'Wall Contact', 'Push-Off', 'Streamline', 'Underwater', 'Breakout'],
  Underwater: ['Launch', 'Streamline Hold', 'Dolphin Kick', 'Breakout'],
  Breakout: ['Last Underwater Kick', 'Surface', 'First Stroke', 'Rhythm'],
};

const FAULT_TAGS = {
  Breaststroke: ['Knees Too Wide', 'Early Foot Turn', 'Hips Dropping', 'Circular Kick', 'Slow Heel Recovery', 'Weak Catch', 'Head Lifting Too High', 'Timing Rushed', 'Glide Too Long', 'Hands Too Deep', 'Recovery Too Slow', 'Kick Finishes Too Wide'],
  Freestyle: ['Dropped Elbow', 'Crossing Midline', 'Late Breath', 'Over-Rotation', 'Flat Body', 'Weak Finish', 'Head Too High', 'Legs Sinking', 'Short Stroke'],
  Backstroke: ['Head Moving', 'Poor Rotation', 'Dropped Hips', 'Wide Entry', 'Weak Catch', 'Crossover Entry', 'Inconsistent Kick'],
  Butterfly: ['Late Second Kick', 'Arms Too Low', 'Chest Not Pressing', 'Breath Too High', 'Poor Rhythm', 'Hips Dropping Fly', 'Weak Catch'],
  Start: ['Slow Reaction', 'Poor Streamline', 'Deep Entry', 'Weak Push-Off', 'Early Breakout', 'Poor Wall Contact', 'Slow Rotation'],
  Turn: ['Wide Turn', 'Slow Rotation', 'Weak Push-Off', 'Early Breakout', 'Poor Streamline'],
};
const getFaultTags = (stroke) => FAULT_TAGS[stroke] || FAULT_TAGS['Freestyle'];
const getPhases = (stroke) => STROKE_PHASES[stroke] || STROKE_PHASES['Freestyle'];

const SPEEDS = [0.25, 0.5, 1.0];
const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/mov'];
const MAX_SIZE_MB = 500;
function formatBytes(b) { return b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`; }

// ─── Step indicators ──────────────────────────────────────────────────────────
const STEPS = ['Swimmer', 'Video', 'Configure', 'Analyse'];

function StepBar({ current }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
            i < current ? 'text-primary' : i === current ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
          }`}>
            <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
              i < current ? 'bg-primary text-primary-foreground' :
              i === current ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
            }`}>{i < current ? '✓' : i + 1}</span>
            {s}
          </div>
          {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border mx-1" />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Analyse() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { club } = useClubContext();
  const queryClient = useQueryClient();

  // Never auto-resume a stale session — always start at step 0
  // The session is only used once the coach explicitly progresses through steps
  const [step, setStep] = useState(0);

  // Step 0 — Swimmer
  const [selectedSwimmer, setSelectedSwimmer] = useState(null);
  const [swimmerSearch, setSwimmerSearch] = useState('');

  // Session mode
  const [sessionMode, setSessionMode] = useState('single_angle'); // single_angle | multi_angle
  const [multiAngleUploads, setMultiAngleUploads] = useState({});
  const [primaryAngleKey, setPrimaryAngleKey] = useState(null);

  // Step 1 — Video
  const fileRef = useRef();
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [durationWarning, setDurationWarning] = useState('');
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadedUrl, setUploadedUrl] = useState(''); // signed URL for playback
  const [videoUploadId, setVideoUploadId] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [uploadedVideoId, setUploadedVideoId] = useState(null); // tracks most recently uploaded video for CTA
  const videoLibraryRef = useRef();

  // Step 2 — Configure
  const [stroke, setStroke] = useState('Freestyle');
  const [angle, setAngle] = useState('Side');
  const [sessionType, setSessionType] = useState('Technique Review');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  // Step 3 — Analyse
  const videoRef = useRef();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [activePhase, setActivePhase] = useState('');
  const [activeFaultTags, setActiveFaultTags] = useState([]);
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [coachNotes, setCoachNotes] = useState('');
  const [findingForm, setFindingForm] = useState({
    finding_name: '', severity: 'medium', phase: '',
    coach_sees: '', why_it_matters: '', cue: '', drill: '', next_focus: ''
  });

  // Clear any stale localStorage session on mount — coach must always start fresh
  useEffect(() => {
    setReviewSession(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const session = getReviewSession();
  const reviewId = session?.review_id;
  const strokeForAnalysis = session?.stroke_or_movement || stroke;

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: swimmers = [] } = useQuery({
    queryKey: ['swimmers', club?.id],
    queryFn: () => entities.Swimmer.filter({ club_id: club.id }, 'last_name', 250),
    enabled: !!club?.id,
  });

  const { data: squads = [] } = useQuery({
    queryKey: ['squads', club?.id],
    queryFn: () => entities.Squad.filter({ club_id: club.id }, 'name', 100),
    enabled: !!club?.id,
  });

  const { data: keyFrames = [] } = useQuery({
    queryKey: ['keyframes', reviewId],
    queryFn: () => base44.entities.KeyFrame.filter({ review_id: reviewId }),
    enabled: !!reviewId,
  });

  const { data: findings = [] } = useQuery({
    queryKey: ['findings', reviewId],
    queryFn: () => base44.entities.Finding.filter({ review_id: reviewId }),
    enabled: !!reviewId,
  });

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createReview = useMutation({
    mutationFn: async () => {
      // Update VideoUpload with the stroke/angle chosen in Step 2 (Configure),
      // so the AI server always gets the coach's actual selection.
      if (videoUploadId) {
        await entities.VideoUpload.update(videoUploadId, {
          stroke_type: stroke,
          camera_angle: angle,
          analysis_type: sessionType,
        });
        queryClient.invalidateQueries({ queryKey: ['video-uploads'] });
      }
      const review = await base44.entities.Review.create({
        club_id: club?.id || undefined,
        swimmer_id: selectedSwimmer?.id || undefined,
        video_upload_id: videoUploadId || undefined,
        review_type: 'full_review',
        stroke_or_movement: stroke,
        camera_angle: angle,
        environment: 'swim',
        status: 'in_progress',
        coach_notes: reviewNotes,
      });
      return review;
    },
    onSuccess: (review) => {
      setReviewSession({
        review_id: review.id,
        swimmer_id: selectedSwimmer?.id || null,
        swimmer_name: selectedSwimmer?.name || null,
        club_id: club?.id || null,
        has_file: !!uploadedUrl,
        preview_url: uploadedUrl || null,
        video_upload_id: videoUploadId || null,
        file_name: file?.name || reviewTitle || 'video',
        stroke_or_movement: stroke,
        camera_angle: angle,
        analysis_type: sessionType,
        review_type: 'full_review',
      });
      // Clear local file state now that review is created
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setStep(3);
    },
  });

  const addKeyFrame = useMutation({
    mutationFn: (data) => base44.entities.KeyFrame.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['keyframes', reviewId] }),
  });

  const addFinding = useMutation({
    mutationFn: (data) => base44.entities.Finding.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings', reviewId] });
      setShowFindingForm(false);
      setActiveFaultTags([]);
      setFindingForm({ finding_name: '', severity: 'medium', phase: '', coach_sees: '', why_it_matters: '', cue: '', drill: '', next_focus: '' });
    },
  });

  const saveNotes = useMutation({
    mutationFn: () => base44.entities.Review.update(reviewId, { coach_notes: coachNotes }),
  });

  const completeReview = useMutation({
    mutationFn: () => base44.entities.Review.update(reviewId, { status: 'completed', coach_notes: coachNotes }),
    onSuccess: () => navigate('/report'),
  });

  // ── Step 0: Swimmer select ────────────────────────────────────────────────
  const filteredSwimmers = swimmers.filter(s =>
    s.name.toLowerCase().includes(swimmerSearch.toLowerCase())
  );

  // ── Step 1: Video upload ─────────────────────────────────────────────────
  const validateFile = (f) => {
    if (!f.type.startsWith('video/') && !f.name.match(/\.(mp4|mov|webm)$/i)) return 'Unsupported format. Use MP4, MOV, or WebM.';
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return `File too large. Max ${MAX_SIZE_MB} MB.`;
    return null;
  };

  const detectVideoDuration = (f) => {
    setDurationWarning('');
    const url = URL.createObjectURL(f);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const seconds = video.duration || 0;
      if (seconds > 15) {
        setDurationWarning(`This clip is ${Math.round(seconds)} seconds. AI Review works best with 5-10 second clips; clips over 15 seconds may time out.`);
      }
    };
    video.onerror = () => URL.revokeObjectURL(url);
    video.src = url;
  };

  const handleFilePick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setDurationWarning('');
    const err = validateFile(f);
    setFileError(err || '');
    setFile(err ? null : f);
    if (!err) detectVideoDuration(f);
    setUploadStatus('idle');
    setUploadedUrl('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setDurationWarning('');
    const err = validateFile(f);
    setFileError(err || '');
    setFile(err ? null : f);
    if (!err) detectVideoDuration(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploadStatus('uploading');
    setFileError('');
    try {
      const uploadRecord = await uploadPrivateVideo({
        file,
        clubId: club?.id,
        swimmer: selectedSwimmer,
        userId: user?.id,
        metadata: {
          stroke_type: stroke,
          analysis_type: sessionType || 'Technique Review',
          camera_angle: angle,
          review_context: {
            session_mode: sessionMode,
            review_title: reviewTitle || null,
          },
        },
      });
      setVideoUploadId(uploadRecord.id);
      setUploadedVideoId(uploadRecord.id);

      const res = await functions.getSignedVideoUrl(uploadRecord.id);
      if (res.data?.signed_url) {
        setUploadedUrl(res.data.signed_url);
      }
      setUploadStatus('done');
      queryClient.invalidateQueries({ queryKey: ['video-uploads', club?.id] });
    } catch (err) {
      setUploadStatus('error');
      const msg = err?.response?.data?.error || err?.message || 'Upload failed.';
      setFileError(msg);
    }
  };

  // When a video is chosen from the library, fetch a fresh signed URL for Step 3 playback
  const handleLibrarySelect = async (upload) => {
    setVideoUploadId(upload.id);
    setUploadedUrl('');
    setStroke(upload.stroke_type || 'Freestyle');
    setAngle(upload.camera_angle || 'Side');
    setSessionType(upload.analysis_type || 'Technique Review');
    // Fetch signed URL so Step 3 has video ready
    try {
      const res = await functions.getSignedVideoUrl(upload.id);
      if (res.data?.signed_url) setUploadedUrl(res.data.signed_url);
    } catch {
      // Non-fatal — coach can still do analysis without playback
    }
    const swimmer = swimmers.find(s => s.id === upload.swimmer_id);
    if (swimmer) setSelectedSwimmer(swimmer);
    setStep(2);
  };

  // ── Step 3: Analysis helpers ─────────────────────────────────────────────
  const stepFrame = (dir) => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + dir * (1 / 30));
  };

  const handleMarkKeyFrame = () => {
    if (!reviewId) return;
    addKeyFrame.mutate({ review_id: reviewId, timestamp_seconds: currentTime, phase: activePhase, note: '' });
  };

  const handleTagFault = (tag) => {
    const next = activeFaultTags.includes(tag) ? activeFaultTags.filter(t => t !== tag) : [...activeFaultTags, tag];
    setActiveFaultTags(next);
    if (!findingForm.finding_name && !activeFaultTags.includes(tag)) {
      const sug = FAULT_SUGGESTIONS[tag];
      setFindingForm(p => ({
        ...p,
        finding_name: tag,
        phase: activePhase,
        cue: sug?.cue || '',
        drill: sug?.drill || '',
        severity: sug?.severity || 'medium',
        next_focus: sug?.next_focus || '',
      }));
    }
  };

  const handleAddFinding = (e) => {
    e.preventDefault();
    if (!reviewId || !findingForm.finding_name) return;
    addFinding.mutate({
      ...findingForm,
      review_id: reviewId,
      included_in_report: true,
      coach_sees: findingForm.coach_sees || activeFaultTags.join(', '),
    });
  };

  const handleSendToCoachMode = (finding) => {
    setCoachModeFinding(finding);
    navigate('/coach-mode');
  };

  const videoSrc = session?.preview_url || session?.file_url;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const phases = getPhases(strokeForAnalysis);
  const faultTags = getFaultTags(strokeForAnalysis);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  if (step === 3) {
    return (
      <div className="max-w-screen-xl mx-auto px-3 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-primary font-semibold">Analysis Studio</div>
            <h1 className="text-base font-bold text-foreground">
              {strokeForAnalysis} · {session?.camera_angle || 'Unknown Angle'}
              {session?.swimmer_name && <span className="text-muted-foreground font-normal"> · {session.swimmer_name}</span>}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setStep(0); setReviewSession(null); }}>
              <Plus className="w-3.5 h-3.5 mr-1" /> New Review
            </Button>
            <Button size="sm" variant="outline"
              onClick={() => completeReview.mutate()} disabled={completeReview.isPending}>
              {completeReview.isPending ? 'Saving...' : 'Build Manual Coach Report (Beta)'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-3">
            <div className="p-3 rounded-xl bg-card border border-border text-xs space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Session</div>
              <div><span className="text-muted-foreground">Stroke:</span> <span className="font-medium">{strokeForAnalysis}</span></div>
              <div><span className="text-muted-foreground">Angle:</span> <span className="font-medium">{session?.camera_angle || '—'}</span></div>
              <div><span className="text-muted-foreground">Findings:</span> <span className="text-primary font-bold">{findings.length}</span></div>
              <div><span className="text-muted-foreground">Key Frames:</span> <span className="font-medium">{keyFrames.length}</span></div>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Stroke Phases</div>
              <div className="space-y-0.5">
                {phases.map(ph => (
                  <button key={ph} onClick={() => setActivePhase(activePhase === ph ? '' : ph)}
                    className={`w-full text-left text-[10px] px-2 py-1.5 rounded transition-all ${
                      activePhase === ph ? 'bg-primary text-primary-foreground font-semibold' : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}>{ph}</button>
                ))}
              </div>
            </div>
          </div>

          {/* CENTRE */}
          <div className="lg:col-span-7 space-y-2">
            <div className="rounded-xl overflow-hidden bg-black relative" style={{ aspectRatio: '16/9' }}>
              {videoSrc ? (
                <video
                  ref={videoRef}
                  src={videoSrc}
                  className="w-full h-full object-contain"
                  onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                  onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <Film className="w-10 h-10 opacity-30" />
                  <div className="text-center">
                    <div className="text-xs mb-1">No video file available for playback</div>
                    <div className="text-[10px] text-muted-foreground/60">Analysis session is active — add phases, faults, and findings below</div>
                  </div>
                </div>
              )}
              {activePhase && (
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-semibold">
                  {activePhase}
                </div>
              )}
            </div>

            {/* Progress bar */}
            {duration > 0 && (
              <div className="relative h-2 bg-secondary rounded-full cursor-pointer" onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                if (videoRef.current) videoRef.current.currentTime = ((e.clientX - r.left) / r.width) * duration;
              }}>
                <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                {keyFrames.map(kf => (
                  <div key={kf.id}
                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-yellow-400 border-2 border-black cursor-pointer"
                    style={{ left: `${(kf.timestamp_seconds / duration) * 100}%` }}
                    title={`${kf.phase || 'KF'} @ ${Number(kf.timestamp_seconds).toFixed(1)}s`}
                    onClick={(e) => { e.stopPropagation(); if (videoRef.current) videoRef.current.currentTime = kf.timestamp_seconds; }}
                  />
                ))}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => stepFrame(-1)}><SkipBack className="w-3.5 h-3.5" /></Button>
              {videoSrc && (
                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => {
                  isPlaying ? videoRef.current?.pause() : videoRef.current?.play();
                }}>{isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}</Button>
              )}
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => stepFrame(1)}><SkipForward className="w-3.5 h-3.5" /></Button>
              <span className="text-xs font-mono text-muted-foreground">{currentTime.toFixed(2)}s</span>
              <div className="flex-1" />
              <div className="flex border border-border rounded overflow-hidden">
                {SPEEDS.map(s => (
                  <button key={s} onClick={() => setSpeed(s)}
                    className={`px-2.5 py-1 text-[10px] font-medium ${speed === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >{s}x</button>
                ))}
              </div>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleMarkKeyFrame} disabled={!reviewId}>
                <Bookmark className="w-3 h-3 mr-1" /> Mark {activePhase || 'Frame'}
              </Button>
            </div>

            {/* Key frames */}
            {keyFrames.length > 0 && (
              <div className="p-2.5 rounded-lg bg-card border border-border">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Key Frames</div>
                <div className="flex gap-1.5 flex-wrap">
                  {keyFrames.map((kf, i) => (
                    <div key={kf.id}
                      className="px-2 py-1 rounded bg-secondary border border-border text-[10px] cursor-pointer hover:border-primary/40"
                      onClick={() => { if (videoRef.current) videoRef.current.currentTime = kf.timestamp_seconds; }}
                    >
                      <span className="text-primary font-semibold">KF{i + 1}</span>
                      {kf.phase && <span className="text-muted-foreground ml-1">{kf.phase}</span>}
                      <span className="text-muted-foreground ml-1">{Number(kf.timestamp_seconds).toFixed(1)}s</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fault Tags */}
            <div className="p-3 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Fault Tags — {strokeForAnalysis}</div>
                {activeFaultTags.length > 0 && (
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => setShowFindingForm(true)}>
                      <Plus className="w-3 h-3 mr-0.5" /> Finding
                    </Button>
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => setShowAI(true)}>
                      <Zap className="w-3 h-3 mr-0.5 text-yellow-400" /> AI Suggest
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {faultTags.map(tag => (
                  <button key={tag} onClick={() => handleTagFault(tag)}
                    className={`px-2 py-1 rounded text-[10px] font-medium border transition-all ${
                      activeFaultTags.includes(tag)
                        ? 'bg-destructive/20 border-destructive/50 text-destructive'
                        : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                    }`}>{tag}</button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-3 space-y-3">
            {/* AI Suggester */}
            {showAI && (
              <AiFindingSuggester
                faultTags={activeFaultTags}
                stroke={strokeForAnalysis}
                phase={activePhase}
                reviewId={reviewId}
                onClose={() => setShowAI(false)}
                onFindingAdded={() => {
                  queryClient.invalidateQueries({ queryKey: ['findings', reviewId] });
                  setShowAI(false);
                  setActiveFaultTags([]);
                }}
              />
            )}

            {/* Findings panel */}
            <div className="p-3 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-foreground">Coach Findings <span className="text-primary">({findings.length})</span></h3>
                <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => setShowFindingForm(!showFindingForm)}>
                  <Plus className="w-3 h-3 mr-0.5" /> Add
                </Button>
              </div>

              {showFindingForm && (
                <form onSubmit={handleAddFinding} className="space-y-1.5 mb-3 p-2.5 rounded-lg bg-secondary border border-border">
                  <Input placeholder="Finding name *" value={findingForm.finding_name}
                    onChange={e => setFindingForm(p => ({ ...p, finding_name: e.target.value }))}
                    className="bg-card border-border text-xs h-7" />
                  <div className="grid grid-cols-2 gap-1.5">
                    <Select value={findingForm.severity} onValueChange={v => setFindingForm(p => ({ ...p, severity: v }))}>
                      <SelectTrigger className="bg-card border-border text-xs h-7"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SEVERITY_LEVELS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={findingForm.phase} onValueChange={v => setFindingForm(p => ({ ...p, phase: v }))}>
                      <SelectTrigger className="bg-card border-border text-xs h-7"><SelectValue placeholder="Phase" /></SelectTrigger>
                      <SelectContent>{phases.map(ph => <SelectItem key={ph} value={ph}>{ph}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Textarea placeholder="Coach sees..." value={findingForm.coach_sees}
                    onChange={e => setFindingForm(p => ({ ...p, coach_sees: e.target.value }))}
                    className="bg-card border-border text-xs" rows={2} />
                  <Textarea placeholder="Why it matters..." value={findingForm.why_it_matters}
                    onChange={e => setFindingForm(p => ({ ...p, why_it_matters: e.target.value }))}
                    className="bg-card border-border text-xs" rows={2} />
                  <Input placeholder="Coaching cue" value={findingForm.cue}
                    onChange={e => setFindingForm(p => ({ ...p, cue: e.target.value }))}
                    className="bg-card border-border text-xs h-7" />
                  <Input placeholder="Assigned drill" value={findingForm.drill}
                    onChange={e => setFindingForm(p => ({ ...p, drill: e.target.value }))}
                    className="bg-card border-border text-xs h-7" />
                  <Input placeholder="Next focus" value={findingForm.next_focus}
                    onChange={e => setFindingForm(p => ({ ...p, next_focus: e.target.value }))}
                    className="bg-card border-border text-xs h-7" />
                  <div className="flex gap-1.5">
                    <Button type="submit" size="sm" className="flex-1 h-7 text-xs" disabled={!findingForm.finding_name || addFinding.isPending}>
                      {addFinding.isPending ? 'Saving...' : 'Save Finding'}
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowFindingForm(false)}>×</Button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {findings.map(f => (
                  <FindingCard key={f.id} finding={f} onSendToCoachMode={() => handleSendToCoachMode(f)} />
                ))}
                {findings.length === 0 && !showFindingForm && (
                  <p className="text-[10px] text-muted-foreground text-center py-3">Tag a fault above or add a finding manually.</p>
                )}
              </div>
            </div>

            {/* Coach notes */}
            <div className="p-3 rounded-xl bg-card border border-border">
              <h3 className="text-xs font-semibold mb-2">Coach Notes</h3>
              <Textarea value={coachNotes} onChange={e => setCoachNotes(e.target.value)}
                placeholder="Overall session notes..." className="bg-secondary border-border text-xs" rows={4} />
              <Button size="sm" variant="outline" className="mt-2 w-full h-7 text-xs" onClick={() => saveNotes.mutate()} disabled={!reviewId}>
                {saveNotes.isPending ? 'Saving...' : 'Save Notes'}
              </Button>
            </div>

            <Button className="w-full text-xs" size="sm" variant="outline"
              onClick={() => completeReview.mutate()} disabled={completeReview.isPending}>
              <FileText className="w-3.5 h-3.5 mr-1" /> Build Manual Coach Report (Beta)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Steps 0–2 ────────────────────────────────────────────────────────────

  if (!club) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Film className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
        <h2 className="text-base font-bold text-foreground mb-1">No Club Selected</h2>
        <p className="text-xs text-muted-foreground mb-4">You need a club workspace before analysing videos.</p>
        <Button size="sm" onClick={() => navigate('/club-onboarding')}>Create or Join a Club</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <StepBar current={step} />

      <div className="mb-6 p-4 rounded-xl bg-card border border-border">
        <div className="text-[10px] uppercase tracking-wider text-primary font-bold mb-2">V1 Coach Flow</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-muted-foreground">
          <div><span className="font-semibold text-foreground">1. Select swimmer</span><br />Every private video is linked to a club swimmer.</div>
          <div><span className="font-semibold text-foreground">2. Upload 5-10s clip</span><br />Side angle and above-water footage give the best pose evidence.</div>
          <div><span className="font-semibold text-foreground">3. Coach approves</span><br />AI output is draft evidence; weak pose becomes manual review.</div>
        </div>
      </div>

      {/* STEP 0 — Select swimmer */}
      {step === 0 && (
        <div>
          <h2 className="text-lg font-bold text-foreground mb-1">Select Swimmer</h2>
          <p className="text-xs text-muted-foreground mb-5">Choose the swimmer before uploading. This keeps videos private, club-scoped, and attached to the right report.</p>
          <Input placeholder="Search swimmers..." value={swimmerSearch} onChange={e => setSwimmerSearch(e.target.value)} className="mb-3 bg-card" />
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {filteredSwimmers.map(s => {
              const squad = squads.find(q => q.id === s.squad_id);
              return (
                <button key={s.id} onClick={() => { setSelectedSwimmer(s); setStep(1); }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors text-left">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{s.name}</div>
                    <div className="text-[10px] text-muted-foreground">{squad ? squad.name : ''}{s.main_strokes ? ` · ${s.main_strokes}` : ''}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              );
            })}
            {filteredSwimmers.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-xs text-muted-foreground mb-3">
                  {club ? 'No swimmers found. Add swimmers first before starting a club analysis.' : 'No club workspace selected. Create or join a club first.'}
                </p>
                {club && (
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate('/swimmers')}>
                    <Plus className="w-3 h-3 mr-1" /> Add Swimmer
                  </Button>
                )}
                {!club && (
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate('/club-onboarding')}>
                    Create Club
                  </Button>
                )}
              </div>
            )}
          </div>
          <Button variant="outline" className="w-full mt-4 text-xs" onClick={() => navigate('/swimmers')}>
            <Plus className="w-3 h-3 mr-1" /> Add a New Swimmer
          </Button>
        </div>
      )}

      {/* STEP 1 — Video upload */}
      {step === 1 && (
        <div>
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4" onClick={() => setStep(0)}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <h2 className="text-lg font-bold text-foreground mb-1">Upload Private Swim Clip</h2>
          {selectedSwimmer && <div className="text-xs text-muted-foreground mb-4">Swimmer: <span className="text-primary font-medium">{selectedSwimmer.name}</span></div>}
          <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 text-[11px] text-muted-foreground leading-relaxed">
            Use a short 5-10 second clip where the swimmer is clearly visible. Side angle is preferred. Avoid screen recordings where possible; underwater distortion can reduce pose reliability. If AI evidence is weak, the report will move to manual coach review.
          </div>

          {/* Session mode selector */}
          <div className="mb-5">
            <div className="text-xs font-semibold text-foreground mb-2">Analysis Mode</div>
            <SessionModeSelector value={sessionMode} onChange={setSessionMode} />
          </div>

          {/* Multi-angle uploader */}
          {sessionMode === 'multi_angle' && (
            <div className="mb-5">
              <MultiAngleUploader
                clubId={club?.id}
                swimmerId={selectedSwimmer?.id}
                userId={user?.id}
                sessionId={null}
                onUploadsChanged={(uploads, primaryKey) => {
                  setMultiAngleUploads(uploads);
                  setPrimaryAngleKey(primaryKey);
                  // Set single videoUploadId to primary, or first uploaded
                  const primaryRecord = primaryKey ? uploads[primaryKey] : Object.values(uploads)[0];
                  if (primaryRecord) setVideoUploadId(primaryRecord.id);
                }}
              />
              {Object.keys(multiAngleUploads).length > 0 && (
                <div className="mt-4 flex gap-3">
                  <Button
                    className="flex-1 bg-primary text-primary-foreground text-xs"
                    onClick={() => setStep(2)}
                  >
                    Continue to Configure →
                  </Button>
                </div>
              )}
              <div className="h-px bg-border my-4" />
            </div>
          )}

          {/* Single-angle upload drop zone (always shown, optional in multi-angle) */}
          {sessionMode === 'single_angle' && <CameraGuidancePanel />}
          {sessionMode === 'single_angle' && <div className="mb-4" />}
          {sessionMode === 'multi_angle' && (
            <div className="text-xs font-semibold text-muted-foreground mb-2">Or upload a single video instead:</div>
          )}

          {/* Upload drop zone */}
          <div
            onDragOver={e => e.preventDefault()} onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 transition-colors mb-3"
          >
            <input ref={fileRef} type="file" accept=".mp4,.mov,.webm" onChange={handleFilePick} className="hidden" />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <Film className="w-10 h-10 text-primary" />
                <div className="text-sm font-medium">{file.name}</div>
                <div className="text-xs text-muted-foreground">{formatBytes(file.size)}</div>
                <button className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 mt-1"
                  onClick={e => { e.stopPropagation(); setFile(null); setUploadStatus('idle'); setUploadedUrl(''); setVideoUploadId(null); setFileError(''); setDurationWarning(''); }}>
                  <X className="w-3 h-3" /> Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-10 h-10 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium mb-1">Drag & drop or click to select</div>
                  <div className="text-xs text-muted-foreground">MP4, MOV, WebM · Max {MAX_SIZE_MB} MB · 5-10 seconds recommended</div>
                </div>
              </div>
            )}
          </div>
          {fileError && <div className="text-xs text-destructive flex items-center gap-1 mb-3"><AlertCircle className="w-3.5 h-3.5" />{fileError}</div>}
          {durationWarning && <div className="text-xs text-amber-700 flex items-start gap-1 mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200"><AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{durationWarning}</div>}
          {!selectedSwimmer && file && (
            <div className="text-xs text-muted-foreground flex items-start gap-1 mb-3 p-3 rounded-lg bg-card border border-border">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              Select a swimmer before uploading. Private videos must be linked to a club swimmer in V1.
            </div>
          )}
          {uploadStatus === 'uploading' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 p-3 rounded-lg bg-card border border-border">
              <Loader2 className="w-4 h-4 animate-spin text-primary" /> Uploading to private secure storage...
            </div>
          )}
          {uploadStatus === 'done' && (
            <div className="space-y-3 mb-3">
              <div className="flex items-center gap-2 text-xs text-green-400 p-3 rounded-lg bg-card border border-border">
                <CheckCircle2 className="w-4 h-4" /> Uploaded securely. Video ready for review.
              </div>
              {/* Review Setup Panel — appears after successful upload */}
              <ReviewSetupPanel videoUploadId={videoUploadId} />
              {uploadedUrl && (
                <div className="rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
                  <video src={uploadedUrl} controls className="w-full h-full object-contain" />
                </div>
              )}
              {/* AI CTA banner */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="text-sm font-semibold text-foreground">Video uploaded — ready for AI Review</div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Preview the clip below, then use the <strong>Uploaded Videos — Send to AI</strong> section to send it for AI Review. The Python server only receives a short-lived signed video URL.
                </p>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground text-xs w-full"
                  onClick={() => {
                    videoLibraryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  <Film className="w-3.5 h-3.5 mr-1.5" /> View Uploaded Video
                </Button>
              </div>
            </div>
          )}
          {uploadStatus === 'error' && (
            <div className="flex items-center justify-between text-xs text-destructive mb-3 p-3 rounded-lg bg-card border border-border">
              <span className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Upload failed.</span>
              <button className="underline" onClick={() => setUploadStatus('idle')}>Retry</button>
            </div>
          )}
          <div className="flex gap-3">
            {uploadStatus !== 'done' && (
              <Button className="flex-1 bg-primary text-primary-foreground" disabled={!file || uploadStatus === 'uploading' || !selectedSwimmer} onClick={handleUpload}>
                {uploadStatus === 'uploading' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</> : <><Upload className="w-4 h-4 mr-2" />Upload to Private Storage</>}
              </Button>
            )}
            {uploadStatus === 'done' && (
              <Button className="flex-1 bg-primary text-primary-foreground" onClick={() => setStep(2)}>Continue to Configure →</Button>
            )}
            <Button variant="outline" className="text-xs" onClick={() => videoLibraryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Use Existing Video</Button>
          </div>
        </div>
      )}

      <FeedbackButton pageRoute="/analyse" />

      {/* Uploaded Videos — Send to AI — always visible on Steps 0, 1, 2 */}
      {(step === 0 || step === 1 || step === 2) && club && (
        <div className="mt-10" ref={videoLibraryRef}>
          <div className="h-px bg-border mb-6" />
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Uploaded Videos — Send to AI</h2>
          </div>
          {swimmers.length === 0 ? (
            <div className="p-5 rounded-xl bg-card border border-border text-center text-xs text-muted-foreground">
              Add a swimmer first, then upload a video to trigger AI Analysis.
            </div>
          ) : (
            <VideoLibrary
              clubId={club.id}
              swimmers={swimmers}
              memberRole={club._memberRole}
              onStartReview={handleLibrarySelect}
            />
          )}
        </div>
      )}

      {/* STEP 2 — Configure review */}
      {step === 2 && (
        <div>
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4" onClick={() => setStep(1)}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <h2 className="text-lg font-bold text-foreground mb-1">Configure Review</h2>
          <p className="text-xs text-muted-foreground mb-5">Confirm the stroke, camera angle, and review type before opening manual review or sending the uploaded video for AI Review.</p>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Stroke</Label>
              <Select value={stroke} onValueChange={setStroke}>
                <SelectTrigger className="bg-card border-border mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{SWIM_STROKES_FULL.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Camera Angle</Label>
              <Select value={angle} onValueChange={setAngle}>
                <SelectTrigger className="bg-card border-border mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CAMERA_ANGLES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Analysis Type</Label>
              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger className="bg-card border-border mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Technique Review', 'Race Review', 'Start Review', 'Turn Review', 'Underwater Review'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Session Title (optional)</Label>
              <Input value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} placeholder="e.g. Adam — Breaststroke Kick — Jun 2026" className="bg-card border-border mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Pre-session Notes (optional)</Label>
              <Textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} placeholder="What are you focusing on today?" className="bg-card border-border mt-1" rows={3} />
            </div>
            <Button className="w-full bg-primary text-primary-foreground" onClick={() => createReview.mutate()} disabled={createReview.isPending || !stroke || !angle}>
              {createReview.isPending ? 'Starting...' : 'Start Analysis →'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

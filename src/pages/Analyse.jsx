/**
 * Analyse.jsx — Unified analysis workflow
 * Steps: Select Swimmer → Upload Video → Configure Review → Analyse
 * Replaces the old Upload → Setup → Analysis 3-page chain.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import entities from '@/lib/data/entities';
import functions from '@/lib/data/functions';
import { uploadPrivateVideo, fileSizeMb } from '@/lib/data/videoUploads';
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
import VideoLibrary from '@/components/analysis/VideoLibrary';
import SessionModeSelector from '@/components/analysis/SessionModeSelector';
import MultiAngleUploader from '@/components/analysis/MultiAngleUploader';
import CameraGuidancePanel from '@/components/analysis/CameraGuidancePanel';
import {
  Play, Pause, SkipBack, SkipForward, Bookmark, FileText,
  Upload, CheckCircle2, AlertCircle, Loader2, Film, X,
  Plus, Target, Dumbbell, User, ChevronRight, ArrowLeft, Zap, Activity
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useClubContext } from '@/lib/useClubContext';
import FeedbackButton from '@/components/coach-testing/FeedbackButton';
import ReviewSetupPanel from '@/components/analysis/ReviewSetupPanel';
import { AI_CREDIT_COPY, getFeatureGateState, getPlanKey } from '@/lib/plans/featureGates';

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
const LARGE_FILE_WARNING_MB = 80;
const STRONG_FILE_WARNING_MB = 150;
const TRIM_RECOMMENDATION_MB = 250;
const UPLOAD_ACTIVE_STATUSES = ['preparing_upload', 'uploading', 'finalising_upload'];
const UPLOAD_READY_STATUSES = ['uploaded', 'ready_for_ai', 'done'];
const CAPTURE_SOURCES = [
  { value: 'standard_camera', label: 'Standard camera' },
  { value: 'phone_tablet', label: 'Phone/tablet' },
  { value: 'swimpro_export', label: 'SwimPro export' },
  { value: 'other', label: 'Other' },
];
function formatBytes(b) { return b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`; }
function getFileSizeWarning(f) {
  const mb = fileSizeMb(f);
  if (mb >= TRIM_RECOMMENDATION_MB) {
    return `This file is ${mb.toFixed(1)} MB. Large swim videos are supported, but 250 MB+ clips are not recommended for pilot testing. Trim or compress to a 5-15 second side-view 720p/1080p clip before uploading if possible.`;
  }
  if (mb >= STRONG_FILE_WARNING_MB) {
    return `This file is ${mb.toFixed(1)} MB. It is allowed, but it may take several minutes. Use strong Wi-Fi, keep this tab open, and consider trimming or compressing for faster testing.`;
  }
  if (mb >= LARGE_FILE_WARNING_MB) {
    return `This file is ${mb.toFixed(1)} MB. Upload speed depends on Wi-Fi and device performance. Keep this tab open until upload completes.`;
  }
  return '';
}

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
  const planKey = getPlanKey(club);
  const aiGate = getFeatureGateState('ai_review', planKey);

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
  const [videoDurationSeconds, setVideoDurationSeconds] = useState(null);
  const [fileSizeWarning, setFileSizeWarning] = useState('');
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadStatusMessage, setUploadStatusMessage] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState(''); // signed URL for playback
  const [videoUploadId, setVideoUploadId] = useState(null);
  const [captureSource, setCaptureSource] = useState('standard_camera');
  const [showLibrary, setShowLibrary] = useState(false);
  const [uploadedVideoId, setUploadedVideoId] = useState(null); // tracks most recently uploaded video for CTA
  const [startAiLoading, setStartAiLoading] = useState(false);
  const [startAiMessage, setStartAiMessage] = useState('');
  const [startAiError, setStartAiError] = useState('');
  const videoLibraryRef = useRef();

  // Step 2 — Configure
  const [stroke, setStroke] = useState('Freestyle');
  const [angle, setAngle] = useState('Side');
  const [sessionType, setSessionType] = useState('Technique Review');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewContext, setReviewContext] = useState({
    review_goal: '',
    stroke_focus: '',
    camera_angle_context: '',
    swimmer_level: '',
    coach_notes_context: '',
    specific_concern: '',
    race_training_context: '',
    session_type: '',
    primary_focus: '',
    report_depth: 'full_report',
    coach_question: '',
    injury_or_limitations_note: '',
    desired_output: 'swimmer_report',
    review_mode: 'ai_review',
  });

  // Step 3 — Analyse
  const videoRef = useRef();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [activePhase, setActivePhase] = useState('');
  const [activeFaultTags, setActiveFaultTags] = useState([]);
  const [showFindingForm, setShowFindingForm] = useState(false);
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
    queryFn: () => entities.KeyFrame.filter({ report_id: reviewId }, 'timestamp_seconds', 100),
    enabled: !!reviewId,
  });

  const { data: findings = [] } = useQuery({
    queryKey: ['findings', reviewId],
    queryFn: () => entities.Finding.filter({ report_id: reviewId }, '-created_date', 100),
    enabled: !!reviewId,
  });

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createReview = useMutation({
    mutationFn: async () => {
      if (!videoUploadId) {
        throw new Error('Upload or select a video before opening manual review.');
      }

      // Update VideoUpload with the stroke/angle chosen in Step 2 (Configure),
      // so the AI server always gets the coach's actual selection.
      const nextReviewContext = {
        ...reviewContext,
        review_mode: 'manual_review',
        stroke_focus: reviewContext.stroke_focus || stroke,
        camera_angle_context: reviewContext.camera_angle_context || angle,
        pre_session_notes: reviewNotes || null,
        review_title: reviewTitle || null,
      };

      await entities.VideoUpload.update(videoUploadId, {
        stroke_type: stroke,
        camera_angle: angle,
        analysis_type: sessionType,
        capture_source: captureSource,
        processing_status: 'manual_review',
        ai_error_message: 'Manual coach review opened. No AI findings were generated.',
        review_context: nextReviewContext,
      });
      queryClient.invalidateQueries({ queryKey: ['video-uploads'] });

      const existingReports = await entities.Report.filter({ video_upload_id: videoUploadId }, '-created_date', 10);
      const reusableReport = existingReports.find(report =>
        !report.is_deleted && ['draft', 'in_review', 'error'].includes(report.status)
      );

      if (reusableReport) {
        await entities.Report.update(reusableReport.id, {
          status: reusableReport.status === 'error' ? 'in_review' : reusableReport.status,
          stroke_type: stroke,
          analysis_type: sessionType,
          analysis_mode: 'manual_review',
          real_pose_detected: false,
          review_context: nextReviewContext,
        });
        return { ...reusableReport, status: reusableReport.status === 'error' ? 'in_review' : reusableReport.status };
      }

      const review = await entities.Report.create({
        club_id: club?.id,
        swimmer_id: selectedSwimmer?.id,
        video_upload_id: videoUploadId || undefined,
        status: 'in_review',
        stroke_type: stroke,
        analysis_type: sessionType,
        analysis_mode: 'manual_review',
        real_pose_detected: false,
        phase_breakdown: {},
        coach_summary: reviewNotes || null,
        review_context: nextReviewContext,
        created_by: user?.id,
      });
      return review;
    },
    onSuccess: (review) => {
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['ai-reports', club?.id] });
      queryClient.invalidateQueries({ queryKey: ['ai-report', review.id] });
      navigate(`/ai-review?report_id=${review.id}`);
    },
  });

  const addKeyFrame = useMutation({
    mutationFn: (data) => entities.KeyFrame.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['keyframes', reviewId] }),
  });

  const addFinding = useMutation({
    mutationFn: (data) => entities.Finding.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings', reviewId] });
      setShowFindingForm(false);
      setActiveFaultTags([]);
      setFindingForm({ finding_name: '', severity: 'medium', phase: '', coach_sees: '', why_it_matters: '', cue: '', drill: '', next_focus: '' });
    },
  });

  const saveNotes = useMutation({
    mutationFn: () => entities.Report.update(reviewId, { coach_summary: coachNotes }),
  });

  const completeReview = useMutation({
    mutationFn: () => entities.Report.update(reviewId, {
      status: 'finalised',
      coach_summary: coachNotes,
      finalised_at: new Date().toISOString(),
    }),
    onSuccess: () => navigate(`/ai-review?report_id=${reviewId}`),
  });

  // ── Step 0: Swimmer select ────────────────────────────────────────────────
  const filteredSwimmers = swimmers.filter(s =>
    (s.name || '').toLowerCase().includes(swimmerSearch.toLowerCase())
  );

  // ── Step 1: Video upload ─────────────────────────────────────────────────
  const validateFile = (f) => {
    if (!f.type.startsWith('video/') && !f.name.match(/\.(mp4|mov|webm)$/i)) return 'Unsupported format. Use MP4, MOV, or WebM.';
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return `File too large. Max ${MAX_SIZE_MB} MB.`;
    return null;
  };

  const detectVideoDuration = (f) => {
    setDurationWarning('');
    setVideoDurationSeconds(null);
    const url = URL.createObjectURL(f);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const seconds = video.duration || 0;
      setVideoDurationSeconds(Number.isFinite(seconds) ? Number(seconds.toFixed(2)) : null);
      if (seconds > 15) {
        setDurationWarning(`This clip is ${Math.round(seconds)} seconds. AI Review works best with 5-15 second clips; longer videos can upload and process more slowly. Trim to one swimmer, side-view, 720p/1080p MP4 for faster testing.`);
      }
    };
    video.onerror = () => URL.revokeObjectURL(url);
    video.src = url;
  };

  const handleFilePick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setDurationWarning('');
    setVideoDurationSeconds(null);
    setFileSizeWarning('');
    setUploadStatusMessage('');
    const err = validateFile(f);
    setFileError(err || '');
    setFile(err ? null : f);
    if (!err) {
      setFileSizeWarning(getFileSizeWarning(f));
      detectVideoDuration(f);
    }
    setUploadStatus('idle');
    setUploadedUrl('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setDurationWarning('');
    setVideoDurationSeconds(null);
    setFileSizeWarning('');
    setUploadStatusMessage('');
    const err = validateFile(f);
    setFileError(err || '');
    setFile(err ? null : f);
    if (!err) {
      setFileSizeWarning(getFileSizeWarning(f));
      detectVideoDuration(f);
    }
    setUploadStatus('idle');
    setUploadedUrl('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploadStatus('preparing_upload');
    setUploadStatusMessage('Creating private video record...');
    setFileError('');
    try {
      const retryVideoUploadId = uploadStatus === 'upload_failed' && videoUploadId ? videoUploadId : null;
      const uploadRecord = await uploadPrivateVideo({
        file,
        clubId: club?.id,
        swimmer: selectedSwimmer,
        userId: user?.id,
        metadata: {
          stroke_type: stroke,
          analysis_type: sessionType || 'Technique Review',
          camera_angle: angle,
          capture_source: captureSource,
          duration_seconds: videoDurationSeconds,
          review_context: {
            ...reviewContext,
            session_mode: sessionMode,
            review_title: reviewTitle || null,
            stroke_focus: reviewContext.stroke_focus || stroke,
            camera_angle_context: reviewContext.camera_angle_context || angle,
            pre_session_notes: reviewNotes || null,
            review_context_completed: Boolean(
              reviewContext.review_goal ||
              reviewContext.stroke_focus ||
              reviewContext.coach_question ||
              reviewContext.specific_concern ||
              reviewContext.race_training_context ||
              reviewContext.coach_notes_context
            ),
          },
        },
        existingVideoUploadId: retryVideoUploadId,
        onStage: (stage, details = {}) => {
          setUploadStatus(stage);
          if (details.videoUploadId) {
            setVideoUploadId(details.videoUploadId);
            setUploadedVideoId(details.videoUploadId);
          }
          if (stage === 'preparing_upload') {
            setUploadStatusMessage('Creating private video record...');
          } else if (stage === 'uploading') {
            setUploadStatusMessage(`Uploading to private storage. Keep this tab open. Video row: ${details.videoUploadId || retryVideoUploadId || 'creating...'}`);
            queryClient.invalidateQueries({ queryKey: ['video-uploads', club?.id] });
          } else if (stage === 'finalising_upload') {
            setUploadStatusMessage('Finalising upload...');
          }
        },
      });
      setVideoUploadId(uploadRecord.id);
      setUploadedVideoId(uploadRecord.id);

      const res = await functions.getSignedVideoUrl(uploadRecord.id);
      if (res.data?.signed_url) {
        setUploadedUrl(res.data.signed_url);
      }
      setUploadStatus('uploaded');
      setUploadStatusMessage(`Video uploaded. Ready for AI Review. Video row: ${uploadRecord.id}`);
      queryClient.invalidateQueries({ queryKey: ['video-uploads', club?.id] });
    } catch (err) {
      setUploadStatus('upload_failed');
      if (err?.videoUploadId) {
        setVideoUploadId(err.videoUploadId);
        setUploadedVideoId(err.videoUploadId);
      }
      const msg = err?.response?.data?.error || err?.message || 'Upload failed.';
      setFileError(msg);
      setUploadStatusMessage(`${msg} Video row: ${err?.videoUploadId || videoUploadId || 'created before upload'}. Retry this upload or delete the failed row from the video library.`);
      queryClient.invalidateQueries({ queryKey: ['video-uploads', club?.id] });
    }
  };

  const handleDeleteFailedUpload = async () => {
    if (!videoUploadId) return;
    await entities.VideoUpload.delete(videoUploadId);
    setVideoUploadId(null);
    setUploadedVideoId(null);
    setUploadStatus('idle');
    setUploadStatusMessage('');
    queryClient.invalidateQueries({ queryKey: ['video-uploads', club?.id] });
  };

  const handleSendForAIReview = async () => {
    if (!videoUploadId) {
      setStartAiError('Upload or select a video before sending it for AI Review.');
      return;
    }

    setStartAiLoading(true);
    setStartAiMessage('');
    setStartAiError('');

    try {
      await entities.VideoUpload.update(videoUploadId, {
        stroke_type: stroke,
        camera_angle: angle,
        analysis_type: sessionType,
        capture_source: captureSource,
        review_context: {
          ...reviewContext,
          stroke_focus: reviewContext.stroke_focus || stroke,
          camera_angle_context: reviewContext.camera_angle_context || angle,
          pre_session_notes: reviewNotes || null,
        },
      });

      const res = await functions.triggerPoseAnalysis(videoUploadId);
      setUploadStatus(res.data?.processing_status || 'processing_ai');
      setStartAiMessage(res.data?.queued && !res.data?.dispatched
        ? `Queued for AI Review${res.data?.queue_position ? ` — position ${res.data.queue_position}` : ''}. Open AI Jobs to watch the queue.`
        : 'AI Review started. Open AI Reviews or AI Jobs to watch progress.'
      );
      queryClient.invalidateQueries({ queryKey: ['video-uploads'] });
      queryClient.invalidateQueries({ queryKey: ['ai-jobs-active', club?.id] });
      queryClient.invalidateQueries({ queryKey: ['ai-reports', club?.id] });
    } catch (err) {
      const msg = err?.message || 'Could not start AI Review.';
      setStartAiError(`${msg} The uploaded video remains saved. Retry AI Review or continue manual review.`);
      queryClient.invalidateQueries({ queryKey: ['video-uploads'] });
    } finally {
      setStartAiLoading(false);
    }
  };

  // When a video is chosen from the library, fetch a fresh signed URL for Step 3 playback
  const handleLibrarySelect = async (upload) => {
    setVideoUploadId(upload.id);
    setUploadedUrl('');
    setStroke(upload.stroke_type || 'Freestyle');
    setAngle(upload.camera_angle || 'Side');
    setSessionType(upload.analysis_type || 'Technique Review');
    setCaptureSource(upload.capture_source || 'standard_camera');
    if (upload.review_context) {
      setReviewContext(prev => ({ ...prev, ...upload.review_context }));
    }
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
    addKeyFrame.mutate({
      club_id: club?.id,
      report_id: reviewId,
      video_upload_id: videoUploadId,
      timestamp_seconds: currentTime,
      label: activePhase || null,
      note: '',
    });
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
      club_id: club?.id,
      report_id: reviewId,
      swimmer_id: selectedSwimmer?.id || null,
      video_upload_id: videoUploadId || null,
      source: 'coach',
      approval_status: 'approved',
      severity: findingForm.severity,
      stroke_phase: findingForm.phase || activePhase || null,
      observation: findingForm.coach_sees || findingForm.finding_name || activeFaultTags.join(', '),
      why_it_matters: findingForm.why_it_matters || null,
      correction_cue: findingForm.cue || null,
      drill: findingForm.drill || null,
      next_focus: findingForm.next_focus || null,
      created_by: user?.id || null,
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
  const uploadInProgress = UPLOAD_ACTIVE_STATUSES.includes(uploadStatus);
  const uploadReady = UPLOAD_READY_STATUSES.includes(uploadStatus);
  const uploadFailed = uploadStatus === 'upload_failed' || uploadStatus === 'error';

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
          <div><span className="font-semibold text-foreground">2. Upload 5-15s clip</span><br />Side angle and above-water footage give the best pose evidence.</div>
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
            Upload footage exported from SwimPro or any standard camera system. Use a short 5-15 second clip where the swimmer is clearly visible. Side angle is preferred. Large swim videos are supported, but upload speed depends on Wi-Fi and device. Avoid screen recordings where possible; underwater distortion can reduce pose reliability. If AI evidence is weak, the report will move to manual coach review.
          </div>
          <div className="mb-4 grid gap-2 rounded-xl border border-border bg-card p-3 text-[11px] text-muted-foreground sm:grid-cols-3">
            <div>
              <span className="font-semibold text-foreground">Upload status stays visible.</span><br />
              Video rows appear in the library while uploading, after refresh, and if an upload fails.
            </div>
            <div>
              <span className="font-semibold text-foreground">Keep this tab open.</span><br />
              Large videos can take a few minutes, and inactive browser tabs may slow uploads down.
            </div>
            <div>
              <span className="font-semibold text-foreground">Manual review is always available.</span><br />
              Once uploaded, Coach Studio can be used even if AI is queued, slow, or unavailable.
            </div>
          </div>

          <div className="mb-4">
            <Label className="text-xs text-muted-foreground">Capture Source</Label>
            <Select value={captureSource} onValueChange={setCaptureSource}>
              <SelectTrigger className="bg-card border-border mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CAPTURE_SOURCES.map(source => (
                  <SelectItem key={source.value} value={source.value}>{source.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {captureSource === 'swimpro_export' && (
              <p className="text-[10px] text-muted-foreground mt-1.5">
                SwimPro export support means coaches can upload video files they already have permission to export and use.
              </p>
            )}
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
                  onClick={e => { e.stopPropagation(); setFile(null); setUploadStatus('idle'); setUploadedUrl(''); setVideoUploadId(null); setFileError(''); setDurationWarning(''); setVideoDurationSeconds(null); setFileSizeWarning(''); setUploadStatusMessage(''); }}>
                  <X className="w-3 h-3" /> Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-10 h-10 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium mb-1">Drag & drop or click to select</div>
                  <div className="text-xs text-muted-foreground">MP4, MOV, WebM · Max {MAX_SIZE_MB} MB · 5-15 seconds recommended</div>
                </div>
              </div>
            )}
          </div>
          {fileError && <div className="text-xs text-destructive flex items-start gap-1 mb-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20"><AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{fileError}</div>}
          {fileSizeWarning && <div className="text-xs text-amber-700 flex items-start gap-1 mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200"><AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{fileSizeWarning}</div>}
          {durationWarning && <div className="text-xs text-amber-700 flex items-start gap-1 mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200"><AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{durationWarning}</div>}
          {file && !fileSizeWarning && !durationWarning && (
            <div className="text-xs text-muted-foreground flex items-start gap-1 mb-3 p-3 rounded-lg bg-card border border-border">
              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-green-500" />
              For fastest AI testing, use one swimmer, side-view, 5-15 seconds, 720p or 1080p MP4. Avoid raw 4K slow-motion for live demos unless compressed.
            </div>
          )}
          {!selectedSwimmer && file && (
            <div className="text-xs text-muted-foreground flex items-start gap-1 mb-3 p-3 rounded-lg bg-card border border-border">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              Select a swimmer before uploading. Private videos must be linked to a club swimmer in V1.
            </div>
          )}
          {uploadInProgress && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground mb-3 p-3 rounded-lg bg-card border border-border">
              <Loader2 className="w-4 h-4 animate-spin text-primary mt-0.5 flex-shrink-0" />
              <div>
                <div>{uploadStatusMessage || 'Uploading video to private club storage...'}</div>
                <div className="mt-1 text-[10px]">Keep this tab open until upload completes. If the upload fails, the row will remain visible so you can retry or delete it.</div>
              </div>
            </div>
          )}
          {uploadReady && (
            <div className="space-y-3 mb-3">
              <div className="flex items-start gap-2 text-xs text-green-700 p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold">{uploadStatusMessage || 'Video uploaded. Ready for review.'}</div>
                  <div className="mt-1 text-[10px] text-green-700">Next: configure the review, send for AI Review, or open Coach Studio for manual review.</div>
                </div>
              </div>
              {/* Review Setup Panel — appears after successful upload */}
              <ReviewSetupPanel
                videoUploadId={videoUploadId}
                value={reviewContext}
                onChange={setReviewContext}
                stroke={stroke}
                cameraAngle={angle}
              />
              {uploadedUrl && (
                <div className="rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
                  <video src={uploadedUrl} controls className="w-full h-full object-contain" />
                </div>
              )}
              {/* AI CTA banner */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/30 space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="text-sm font-semibold text-foreground">Video uploaded — ready for review</div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Preview the clip below, then continue to configure the review. You can send it for AI Review or open Coach Studio for manual review. The Python server only receives a short-lived signed video URL when AI Review is started.
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
          {uploadFailed && (
            <div className="space-y-2 text-xs text-red-700 mb-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <span className="flex items-start gap-1"><AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {uploadStatusMessage || 'Upload did not complete. The failed row remains in the Video Library so it is not hidden or lost.'}</span>
              <p className="text-[10px] leading-relaxed">Retry while the selected file is still available, or delete the failed row and upload the clip again on stable Wi-Fi. AI Review is disabled until the private upload completes.</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleUpload} disabled={!file}>
                  Retry upload
                </Button>
                {videoUploadId && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-destructive" onClick={handleDeleteFailedUpload}>
                    Delete failed row
                  </Button>
                )}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            {!uploadReady && (
              <Button className="flex-1 bg-primary text-primary-foreground" disabled={!file || uploadInProgress || !selectedSwimmer} onClick={handleUpload}>
                {uploadInProgress ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</> : <><Upload className="w-4 h-4 mr-2" />Upload to Private Storage</>}
              </Button>
            )}
            {uploadReady && (
              <Button className="flex-1 bg-primary text-primary-foreground" onClick={() => setStep(2)}>Continue to Configure →</Button>
            )}
            <Button variant="outline" className="text-xs" onClick={() => videoLibraryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Use Existing Video</Button>
          </div>
        </div>
      )}

      <FeedbackButton pageRoute="/analyse" />

      {/* Video Library — Review Status — always visible on Steps 0, 1, 2 */}
      {(step === 0 || step === 1 || step === 2) && club && (
        <div className="mt-10" ref={videoLibraryRef}>
          <div className="h-px bg-border mb-6" />
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Video Library — Review Status</h2>
          </div>
          <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
            Uploaded videos stay visible here. Use the next-action message on each card to preview, open Coach Studio, send for AI Review, retry AI, or remove failed uploads.
          </p>
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
            <ReviewSetupPanel
              videoUploadId={videoUploadId}
              value={reviewContext}
              onChange={setReviewContext}
              stroke={stroke}
              cameraAngle={angle}
            />
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
              <Label className="text-xs text-muted-foreground">Capture Source</Label>
              <Select value={captureSource} onValueChange={setCaptureSource}>
                <SelectTrigger className="bg-card border-border mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CAPTURE_SOURCES.map(source => (
                    <SelectItem key={source.value} value={source.value}>{source.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {captureSource === 'swimpro_export' && (
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Supports SwimPro-exported footage through coach-uploaded files as part of a standard export workflow.
                </p>
              )}
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
            {startAiMessage && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700 space-y-2">
                <div>{startAiMessage}</div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate('/ai-reviews')}>
                    <FileText className="w-3 h-3 mr-1" /> Open AI Reviews
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => navigate('/ai-jobs')}>
                    <Activity className="w-3 h-3 mr-1" /> AI Jobs
                  </Button>
                </div>
              </div>
            )}
            {startAiError && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
                {startAiError}
              </div>
            )}
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-relaxed text-blue-900">
              <div className="font-semibold">AI Assist plan note</div>
              <p className="mt-1">
                {aiGate.isEnforced && !aiGate.isAllowed
                  ? `${aiGate.message} Coach Studio/manual review remains available.`
                  : 'AI review is available for current pilot testing. Coach approval is required before report sharing.'}
              </p>
              <p className="mt-1 text-[10px] text-blue-800/80">
                {AI_CREDIT_COPY.standardReview} {AI_CREDIT_COPY.manualReport} {AI_CREDIT_COPY.pilotUnknown}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                className="w-full bg-primary text-primary-foreground"
                onClick={handleSendForAIReview}
                disabled={startAiLoading || !stroke || !angle || !videoUploadId}
              >
                {startAiLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending to AI Review...</> : <><Zap className="w-4 h-4 mr-2" />Send for AI Review</>}
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => createReview.mutate()}
                disabled={createReview.isPending || !stroke || !angle || !videoUploadId}
              >
                {createReview.isPending ? 'Opening...' : 'Open Coach Studio'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

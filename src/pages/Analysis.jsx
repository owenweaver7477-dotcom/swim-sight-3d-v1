import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReviewSession, setCoachModeFinding, SEVERITY_LEVELS } from '@/lib/swimState';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EmptyState from '@/components/shared/EmptyState';
import FindingCard from '@/components/analysis/FindingCard';
import { Play, Pause, Plus, FileText, Bookmark, SkipBack, SkipForward } from 'lucide-react';

const STROKE_PHASES = {
  Breaststroke: ['Streamline', 'Outsweep', 'Catch', 'Insweep', 'Recovery', 'Heels Up', 'Foot Turn', 'Kick Snap', 'Finish', 'Glide'],
  Freestyle: ['Entry', 'Catch', 'Pull', 'Push', 'Recovery', 'Body Rotation', 'Breathing', 'Kick Timing'],
  Backstroke: ['Hand Entry', 'Catch', 'Pull', 'Shoulder Rotation', 'Hip Position', 'Kick Timing', 'Finish'],
  Butterfly: ['Entry', 'Catch', 'Press', 'Pull', 'Recovery', 'First Kick', 'Second Kick', 'Body Line'],
  Starts: ['Set Position', 'Reaction', 'Drive', 'Flight', 'Entry', 'Underwater', 'Breakout'],
  Turns: ['Approach', 'Touch', 'Rotation', 'Push', 'Streamline', 'Underwater', 'Breakout'],
};

const FAULT_TAGS = {
  Breaststroke: ['Knees Too Wide', 'Early Foot Turn', 'Hips Dropping', 'Circular Kick', 'Slow Heel Recovery', 'Weak Catch', 'Head Too High', 'Timing Rushed', 'Glide Too Long', 'Hands Too Deep'],
  Freestyle: ['Dropped Elbow', 'Late Breath', 'Crossover Entry', 'Flat Body', 'Short Finish', 'Poor Rotation', 'Wide Kick', 'Head Too High'],
  Backstroke: ['Flat Body', 'Bent Arm Pull', 'Head Lifting', 'Crossover Entry', 'Pinky Entry Missing', 'Poor Rotation', 'Kick Too Deep'],
  Butterfly: ['Late Second Kick', 'Hips Drop', 'Breathing Too High', 'Narrow Pull', 'Poor Undulation', 'Timing Off'],
  Starts: ['Slow Reaction', 'Shallow Entry', 'Over-rotation', 'Poor Streamline', 'Early Breakout'],
  Turns: ['Wide Turn', 'Slow Rotation', 'Short Push', 'Poor Streamline', 'Early Breakout'],
};

const SPEEDS = [0.25, 0.5, 1.0];

export default function Analysis() {
  const session = getReviewSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [showFindingForm, setShowFindingForm] = useState(false);
  const [activePhase, setActivePhase] = useState('');
  const [activeFaultTags, setActiveFaultTags] = useState([]);
  const [findingForm, setFindingForm] = useState({
    finding_name: '', severity: 'medium', phase: '', coach_sees: '',
    why_it_matters: '', cue: '', drill: '', next_focus: ''
  });
  const [coachNotes, setCoachNotes] = useState('');

  const reviewId = session?.review_id;
  const stroke = session?.stroke_or_movement || 'Freestyle';
  const phases = STROKE_PHASES[stroke] || STROKE_PHASES['Freestyle'];
  const faultTags = FAULT_TAGS[stroke] || [];

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

  const addKeyFrame = useMutation({
    mutationFn: (data) => base44.entities.KeyFrame.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['keyframes', reviewId] }),
  });

  const addFinding = useMutation({
    mutationFn: (data) => base44.entities.Finding.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings', reviewId] });
      setShowFindingForm(false);
      setFindingForm({ finding_name: '', severity: 'medium', phase: '', coach_sees: '', why_it_matters: '', cue: '', drill: '', next_focus: '' });
      setActiveFaultTags([]);
    },
  });

  const updateNotes = useMutation({
    mutationFn: () => base44.entities.Review.update(reviewId, { coach_notes: coachNotes, status: 'in_progress' }),
  });

  const markComplete = useMutation({
    mutationFn: () => base44.entities.Review.update(reviewId, { status: 'completed' }),
    onSuccess: () => navigate('/report'),
  });

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

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
    setActiveFaultTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    if (!findingForm.finding_name) setFindingForm(p => ({ ...p, finding_name: tag, phase: activePhase }));
  };

  const handleAddFinding = (e) => {
    e.preventDefault();
    if (!reviewId || !findingForm.finding_name) return;
    const tags = activeFaultTags.join(', ');
    addFinding.mutate({
      ...findingForm,
      review_id: reviewId,
      included_in_report: true,
      coach_sees: findingForm.coach_sees || (tags ? `Fault tags: ${tags}` : ''),
    });
  };

  const handleSendToCoachMode = (finding) => {
    setCoachModeFinding(finding);
    navigate('/coach-mode');
  };

  if (!session || !session.has_file) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <EmptyState
          icon={Play}
          title="No Review Session"
          description="Upload a swim clip to start your analysis session."
          actions={[{ label: 'Upload Footage', to: '/upload' }]}
        />
      </div>
    );
  }

  const videoSrc = session.preview_url || session.file_url;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="max-w-screen-xl mx-auto px-3 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-primary font-semibold">Analysis Studio</div>
          <h1 className="text-base font-bold text-foreground">{stroke} · {session.camera_angle || 'Unknown Angle'}</h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate('/report')}>
            <FileText className="w-3.5 h-3.5 mr-1" /> Report
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => markComplete.mutate()} disabled={markComplete.isPending}>
            {markComplete.isPending ? 'Saving...' : 'Complete & Export'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* LEFT: Info + Phase Markers */}
        <div className="lg:col-span-2 space-y-3">
          <div className="p-3 rounded-xl bg-card border border-border">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Session</div>
            <div className="space-y-1.5 text-xs">
              <div><span className="text-muted-foreground">Stroke:</span> <span className="text-foreground font-medium">{stroke}</span></div>
              <div><span className="text-muted-foreground">Angle:</span> <span className="text-foreground font-medium">{session.camera_angle || '—'}</span></div>
              <div><span className="text-muted-foreground">Type:</span> <span className="text-foreground font-medium capitalize">{(session.review_type || '').replace(/_/g,' ')}</span></div>
              <div><span className="text-muted-foreground">Findings:</span> <span className="text-primary font-bold">{findings.length}</span></div>
            </div>
          </div>

          {/* Stroke Phases */}
          <div className="p-3 rounded-xl bg-card border border-border">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Stroke Phases</div>
            <div className="space-y-1">
              {phases.map(phase => (
                <button
                  key={phase}
                  onClick={() => setActivePhase(activePhase === phase ? '' : phase)}
                  className={`w-full text-left text-[10px] px-2 py-1.5 rounded-md transition-all ${
                    activePhase === phase
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {phase}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CENTRE: Video Player */}
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
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Play className="w-10 h-10 opacity-30" />
                <span className="text-xs">Video preview not available</span>
                <span className="text-[10px] text-muted-foreground/60">File uploaded to storage — playback requires direct URL</span>
              </div>
            )}
            {/* Active phase overlay */}
            {activePhase && (
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-semibold">
                Phase: {activePhase}
              </div>
            )}
          </div>

          {/* Progress bar */}
          {duration > 0 && (
            <div className="relative h-1.5 bg-secondary rounded-full cursor-pointer" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const t = ((e.clientX - rect.left) / rect.width) * duration;
              if (videoRef.current) videoRef.current.currentTime = t;
            }}>
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
              {/* Key frame markers */}
              {keyFrames.map(kf => (
                <div
                  key={kf.id}
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-yellow-400 border border-black"
                  style={{ left: `${(kf.timestamp_seconds / duration) * 100}%` }}
                  title={`KF: ${kf.phase || ''} @ ${Number(kf.timestamp_seconds).toFixed(1)}s`}
                />
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => stepFrame(-1)}>
              <SkipBack className="w-3.5 h-3.5" />
            </Button>
            {videoSrc && (
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => {
                if (isPlaying) videoRef.current?.pause();
                else videoRef.current?.play();
              }}>
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </Button>
            )}
            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => stepFrame(1)}>
              <SkipForward className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs font-mono text-muted-foreground">{currentTime.toFixed(2)}s / {duration.toFixed(1)}s</span>
            <div className="flex-1" />
            {/* Speed */}
            <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
              {SPEEDS.map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 text-[10px] font-medium transition-all ${speed === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {s}x
                </button>
              ))}
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleMarkKeyFrame} disabled={!reviewId}>
              <Bookmark className="w-3 h-3 mr-1" /> Mark {activePhase || 'Frame'}
            </Button>
          </div>

          {/* Key Frames */}
          {keyFrames.length > 0 && (
            <div className="p-2 rounded-lg bg-card border border-border">
              <div className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">Key Frames</div>
              <div className="flex gap-1.5 flex-wrap">
                {keyFrames.map((kf, i) => (
                  <div key={kf.id}
                    className="px-2.5 py-1 rounded-md bg-secondary border border-border text-[10px] cursor-pointer hover:border-primary/50"
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
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Quick Fault Tags</div>
            <div className="flex flex-wrap gap-1.5">
              {faultTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagFault(tag)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all border ${
                    activeFaultTags.includes(tag)
                      ? 'bg-destructive/20 border-destructive/50 text-destructive'
                      : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {activeFaultTags.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{activeFaultTags.length} tag{activeFaultTags.length > 1 ? 's' : ''} active</span>
                <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => setShowFindingForm(true)}>
                  <Plus className="w-3 h-3 mr-0.5" /> Create Finding
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Findings + Notes */}
        <div className="lg:col-span-3 space-y-3">
          <div className="p-3 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-foreground">Findings <span className="text-primary">({findings.length})</span></h3>
              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => setShowFindingForm(!showFindingForm)}>
                <Plus className="w-3 h-3 mr-0.5" /> Add
              </Button>
            </div>

            {showFindingForm && (
              <form onSubmit={handleAddFinding} className="space-y-2 mb-3 p-2.5 rounded-lg bg-secondary border border-border">
                <Input placeholder="Finding name *" value={findingForm.finding_name} onChange={e => setFindingForm(p => ({ ...p, finding_name: e.target.value }))} className="bg-card border-border text-xs h-7" />
                <Select value={findingForm.severity} onValueChange={v => setFindingForm(p => ({ ...p, severity: v }))}>
                  <SelectTrigger className="bg-card border-border text-xs h-7"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SEVERITY_LEVELS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={findingForm.phase} onValueChange={v => setFindingForm(p => ({ ...p, phase: v }))}>
                  <SelectTrigger className="bg-card border-border text-xs h-7"><SelectValue placeholder="Phase..." /></SelectTrigger>
                  <SelectContent>
                    {phases.map(ph => <SelectItem key={ph} value={ph}>{ph}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Textarea placeholder="Coach sees..." value={findingForm.coach_sees} onChange={e => setFindingForm(p => ({ ...p, coach_sees: e.target.value }))} className="bg-card border-border text-xs" rows={2} />
                <Textarea placeholder="Why it matters..." value={findingForm.why_it_matters} onChange={e => setFindingForm(p => ({ ...p, why_it_matters: e.target.value }))} className="bg-card border-border text-xs" rows={2} />
                <Input placeholder="Coaching cue" value={findingForm.cue} onChange={e => setFindingForm(p => ({ ...p, cue: e.target.value }))} className="bg-card border-border text-xs h-7" />
                <Input placeholder="Assigned drill" value={findingForm.drill} onChange={e => setFindingForm(p => ({ ...p, drill: e.target.value }))} className="bg-card border-border text-xs h-7" />
                <Input placeholder="Next focus area" value={findingForm.next_focus} onChange={e => setFindingForm(p => ({ ...p, next_focus: e.target.value }))} className="bg-card border-border text-xs h-7" />
                <div className="flex gap-1.5">
                  <Button type="submit" size="sm" className="flex-1 h-7 text-xs" disabled={!findingForm.finding_name || addFinding.isPending}>
                    {addFinding.isPending ? 'Saving...' : 'Save Finding'}
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowFindingForm(false)}>Cancel</Button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {findings.map(f => (
                <FindingCard key={f.id} finding={f} onSendToCoachMode={() => handleSendToCoachMode(f)} />
              ))}
              {findings.length === 0 && !showFindingForm && (
                <p className="text-[10px] text-muted-foreground text-center py-4">Tag a fault or add a finding to begin.</p>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-card border border-border">
            <h3 className="text-xs font-semibold text-foreground mb-2">Coach Notes</h3>
            <Textarea
              value={coachNotes}
              onChange={e => setCoachNotes(e.target.value)}
              placeholder="Overall technique notes for this session..."
              className="bg-secondary border-border text-xs"
              rows={5}
            />
            <Button size="sm" variant="outline" className="mt-2 w-full h-7 text-xs" onClick={() => updateNotes.mutate()} disabled={!reviewId}>
              {updateNotes.isPending ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>

          <Button
            className="w-full bg-primary text-primary-foreground text-xs"
            size="sm"
            onClick={() => navigate('/report')}
          >
            <FileText className="w-3.5 h-3.5 mr-1" /> Build Report
          </Button>
        </div>
      </div>
    </div>
  );
}
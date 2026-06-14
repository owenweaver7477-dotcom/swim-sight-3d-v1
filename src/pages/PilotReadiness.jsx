import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  HeartHandshake,
  Loader2,
  Send,
  ShieldCheck,
  TabletSmartphone,
} from 'lucide-react';
import entities from '@/lib/data/entities';
import { useAuth } from '@/lib/AuthContext';
import { useClubContext } from '@/lib/useClubContext';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PILOT_ROLES = ['owner', 'admin', 'coach'];

const readinessItems = [
  {
    title: 'Run database migrations through 014',
    detail: 'Confirm 012 upload lifecycle, 013 AI calibration, and 014 pilot feedback are applied in Supabase.',
  },
  {
    title: 'Confirm Render health',
    detail: 'Open the health endpoint and expect status ok with engine pose-mvp-0.4.',
    href: 'https://swim-sight-ai-server.onrender.com/health',
  },
  {
    title: 'Confirm Vercel production is current',
    detail: 'Use the latest main deployment before testing with a coach.',
  },
  {
    title: 'Prepare one test squad and swimmer',
    detail: 'Use a real but controlled profile so the coach can follow the full workflow.',
    to: '/swimmers',
  },
  {
    title: 'Upload a 5-15 second side-view clip',
    detail: 'MP4/MOV, 720p or 1080p, stable Wi-Fi. Avoid raw 4K slow-motion for the first pilot run.',
    to: '/analyse',
  },
  {
    title: 'Start AI Review and verify fallback',
    detail: 'If AI evidence is weak, continue manual review. Do not present weak evidence as automatic truth.',
    to: '/ai-reviews',
  },
  {
    title: 'Test Coach Draw',
    detail: 'Pause the video, mark a frame, save the coach-created annotation, and include it in the report.',
  },
  {
    title: 'Finalise and share safely',
    detail: 'Confirm the shared report opens logged out and shows approved content only.',
  },
  {
    title: 'Check AI calibration feedback',
    detail: 'Approve, edit, reject, and manually add at least one finding so calibration rows are captured.',
    to: '/ai-calibration',
  },
];

const pilotFlow = [
  'Login on iPad or laptop',
  'Select or create the club workspace',
  'Create a squad and swimmer',
  'Upload/select a private video',
  'Send for AI Review',
  'Open the AI Review queue',
  'Approve, edit, reject, or add a manual finding',
  'Use Coach Draw on one paused frame',
  'Include the annotation in the report',
  'Link a drill if useful',
  'Finalise the report',
  'Create and open a shared report logged out',
  'Copy the parent/swimmer message',
  'Check AI Calibration',
];

const defaultForm = {
  name: '',
  role: '',
  club_squad: '',
  device_used: 'iPad Safari PWA',
  file_size_range: '20-80 MB',
  flow_tested: '',
  what_worked: '',
  what_was_confusing: '',
  bug_description: '',
  screenshot_or_link: '',
  severity: 'suggestion',
  follow_up_ok: true,
};

function StatusCard({ icon: Icon, title, children, tone = 'blue' }) {
  const styles = {
    blue: 'border-sky-200 bg-sky-50 text-sky-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    green: 'border-green-200 bg-green-50 text-green-900',
  };
  return (
    <div className={`rounded-xl border p-4 ${styles[tone] || styles.blue}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <div className="text-sm font-bold">{title}</div>
          <div className="text-xs mt-1 leading-relaxed opacity-90">{children}</div>
        </div>
      </div>
    </div>
  );
}

function ReadinessItem({ item }) {
  const body = (
    <div className="rounded-xl border border-slate-200 bg-white p-4 h-full">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-900">{item.title}</div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.detail}</p>
        </div>
      </div>
    </div>
  );

  if (item.to) return <Link to={item.to}>{body}</Link>;
  if (item.href) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer">
        {body}
      </a>
    );
  }
  return body;
}

export default function PilotReadiness() {
  const { user } = useAuth();
  const { club } = useClubContext();
  const queryClient = useQueryClient();
  const memberRole = club?._memberRole || null;
  const canUsePilotTools = PILOT_ROLES.includes(memberRole) || user?.role === 'admin';
  const [form, setForm] = useState(defaultForm);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const feedbackQuery = useQuery({
    queryKey: ['pilot-feedback', club?.id],
    queryFn: () => entities.PilotFeedback.list('-created_at', 20),
    enabled: Boolean(club?.id && canUsePilotTools),
    retry: false,
  });

  const feedbackRows = feedbackQuery.data || [];
  const migrationMissing = Boolean(feedbackQuery.error?.message?.includes('pilot_feedback'));

  const submitFeedback = useMutation({
    mutationFn: async () => {
      if (!club?.id || !user?.id) throw new Error('Select a club before submitting pilot feedback.');
      return entities.PilotFeedback.create({
        ...form,
        club_id: club.id,
        user_id: user.id,
        role: form.role || memberRole || 'coach',
      });
    },
    onSuccess: () => {
      setSubmitError('');
      setSubmitMessage('Pilot feedback saved. Thank you - this is exactly the kind of detail that makes the test useful.');
      setForm({ ...defaultForm, name: form.name, role: form.role, club_squad: form.club_squad });
      queryClient.invalidateQueries({ queryKey: ['pilot-feedback', club?.id] });
    },
    onError: (error) => {
      setSubmitMessage('');
      setSubmitError(error?.message || 'Could not save pilot feedback. Check that migration 014 has been run.');
    },
  });

  const severityCounts = useMemo(() => {
    return feedbackRows.reduce((acc, row) => {
      acc[row.severity] = (acc[row.severity] || 0) + 1;
      return acc;
    }, {});
  }, [feedbackRows]);

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  if (!canUsePilotTools) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <ShieldCheck className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <div className="text-sm font-medium text-foreground">Coach access required</div>
        <p className="text-xs text-muted-foreground mt-1">Pilot QA notes are internal to the coaching team.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10 space-y-6">
      <PageHeader
        eyebrow="Controlled Club Pilot"
        title="Pilot Readiness"
        subtitle="A simple runbook for testing Swim Sight 3D with a coach without overclaiming AI accuracy or exposing private data."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/analyse">Upload Test Video</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/ai-reviews">Open AI Reviews</Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatusCard icon={TabletSmartphone} title="iPad first" tone="blue">
          Install from Safari, use a 5-15 second clip, and keep the tab open while upload/AI status changes.
        </StatusCard>
        <StatusCard icon={AlertTriangle} title="Manual review is a success path" tone="amber">
          If AI evidence is weak, tell the coach the system is protecting trust and continue with manual review.
        </StatusCard>
        <StatusCard icon={ShieldCheck} title="Public report stays safe" tone="green">
          Shared reports show coach-approved content only. They do not expose private videos, signed URLs, or raw AI payloads.
        </StatusCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Before the coach arrives</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {readinessItems.map(item => <ReadinessItem key={item.title} item={item} />)}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardCheck className="w-4 h-4 text-primary" />
              <div className="text-sm font-bold text-slate-900">Pilot test flow</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {pilotFlow.map((step, index) => (
                <div key={step} className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                  <div className="w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="text-xs text-slate-700">{step}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-primary" />
              <div className="text-sm font-bold text-slate-900">Safe demo wording</div>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>Say: AI-assisted, coach-reviewed, draft evidence, manual review fallback, secure shared report.</p>
              <p>Do not claim: fully automatic coaching, exact drag, a formal SwimPro relationship, medical diagnosis, or guaranteed biomechanics.</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-primary" />
                <div className="text-sm font-bold text-slate-900">Feedback summary</div>
              </div>
              {feedbackQuery.isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
            {migrationMissing ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Run `014_v1_pilot_feedback.sql` in Supabase before saving pilot feedback.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {['blocker', 'annoying', 'suggestion'].map(level => (
                  <div key={level} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
                    <div className="text-lg font-bold text-slate-900">{severityCounts[level] || 0}</div>
                    <div className="text-[10px] capitalize text-slate-500">{level}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bug className="w-4 h-4 text-primary" />
          <div>
            <div className="text-sm font-bold text-slate-900">Coach pilot feedback</div>
            <div className="text-xs text-slate-500">Capture what happened during the test while it is fresh.</div>
          </div>
        </div>

        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            submitFeedback.mutate();
          }}
        >
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={event => updateForm('name', event.target.value)} placeholder="Coach name" />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={form.role} onChange={event => updateForm('role', event.target.value)} placeholder={memberRole || 'coach'} />
          </div>
          <div className="space-y-2">
            <Label>Club / squad</Label>
            <Input value={form.club_squad} onChange={event => updateForm('club_squad', event.target.value)} placeholder={club?.name || 'Club and squad'} />
          </div>
          <div className="space-y-2">
            <Label>Device used</Label>
            <Select value={form.device_used} onValueChange={value => updateForm('device_used', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="iPad Safari PWA">iPad Safari PWA</SelectItem>
                <SelectItem value="iPad Safari browser">iPad Safari browser</SelectItem>
                <SelectItem value="iPhone Safari">iPhone Safari</SelectItem>
                <SelectItem value="Mac Chrome">Mac Chrome</SelectItem>
                <SelectItem value="Mac Safari">Mac Safari</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Video file size range</Label>
            <Select value={form.file_size_range} onValueChange={value => updateForm('file_size_range', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="under 20 MB">under 20 MB</SelectItem>
                <SelectItem value="20-80 MB">20-80 MB</SelectItem>
                <SelectItem value="80-150 MB">80-150 MB</SelectItem>
                <SelectItem value="150 MB+">150 MB+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Severity</Label>
            <Select value={form.severity} onValueChange={value => updateForm('severity', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="blocker">Blocker</SelectItem>
                <SelectItem value="annoying">Annoying</SelectItem>
                <SelectItem value="suggestion">Suggestion</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>What flow was tested?</Label>
            <Input value={form.flow_tested} onChange={event => updateForm('flow_tested', event.target.value)} placeholder="Upload -> AI Review -> Coach Draw -> finalise -> share" />
          </div>
          <div className="space-y-2">
            <Label>What worked?</Label>
            <Textarea value={form.what_worked} onChange={event => updateForm('what_worked', event.target.value)} rows={4} />
          </div>
          <div className="space-y-2">
            <Label>What was confusing?</Label>
            <Textarea value={form.what_was_confusing} onChange={event => updateForm('what_was_confusing', event.target.value)} rows={4} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Bug description</Label>
            <Textarea value={form.bug_description} onChange={event => updateForm('bug_description', event.target.value)} rows={4} placeholder="What did you click, what happened, and what did you expect?" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Screenshot or link notes</Label>
            <Input value={form.screenshot_or_link} onChange={event => updateForm('screenshot_or_link', event.target.value)} placeholder="Optional: paste a shared report link, page name, or screenshot filename" />
          </div>
          <label className="md:col-span-2 flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={form.follow_up_ok}
              onChange={event => updateForm('follow_up_ok', event.target.checked)}
              className="w-4 h-4"
            />
            It is okay to follow up about this feedback.
          </label>
          {(submitMessage || submitError) && (
            <div className={`md:col-span-2 rounded-lg border p-3 text-xs ${submitError ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
              {submitError || submitMessage}
            </div>
          )}
          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
            <a
              href="https://swim-sight-ai-server.onrender.com/health"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
            >
              Open Render health <ExternalLink className="w-3 h-3" />
            </a>
            <Button type="submit" disabled={submitFeedback.isPending || migrationMissing}>
              {submitFeedback.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Save Pilot Feedback
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

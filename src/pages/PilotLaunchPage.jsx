import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardCheck,
  LockKeyhole,
  ShieldAlert,
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { useClubContext } from '@/lib/useClubContext';
import { useAuth } from '@/lib/AuthContext';
import entities from '@/lib/data/entities';
import functions from '@/lib/data/functions';
import PilotSessionNotes from '@/components/pilot/PilotSessionNotes';
import CoachPilotFeedbackForm from '@/components/pilot/CoachPilotFeedbackForm';
import PilotReportSafetySummary from '@/components/pilot/PilotReportSafetySummary';
import { isAIFinding } from '@/lib/aiTrust';
import PilotReadinessWarning from '@/components/status/PilotReadinessWarning';
import FeatureReadinessPanel from '@/components/status/FeatureReadinessPanel';
import { getFeatureReadiness } from '@/lib/featureReadiness';
import PilotReadinessGate from '@/components/pilot/PilotReadinessGate';

const PILOT_ROLES = ['owner', 'admin', 'coach'];
const FINAL_REPORT_STATUSES = ['coach_approved', 'finalised', 'published', 'shared'];
const READY_VIDEO_STATUSES = ['uploaded', 'pending_ai', 'processing', 'manual_review', 'completed', 'error'];
const STATUS_STYLES = {
  'Not started': 'border-slate-200 bg-slate-50 text-slate-600',
  Ready: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  'Needs attention': 'border-amber-200 bg-amber-50 text-amber-800',
  Complete: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

function ChecklistCard({ index, title, detail, status, action, to }) {
  const Icon = status === 'Complete' ? CheckCircle2 : status === 'Needs attention' ? AlertTriangle : Circle;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border ${STATUS_STYLES[status]}`}>
        {status === 'Complete' ? <Icon className="h-4 w-4" /> : <span className="text-xs font-black">{index + 1}</span>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[status]}`}>{status}</span>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-600">{detail}</p>
      </div>
      {to.startsWith('#') ? (
        <a href={to} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:border-cyan-300 hover:text-cyan-800">
          {action} <ChevronRight className="h-3.5 w-3.5" />
        </a>
      ) : (
        <Button asChild variant="outline" className="min-h-11 flex-shrink-0 text-xs">
          <Link to={to}>{action}<ChevronRight className="ml-1 h-3.5 w-3.5" /></Link>
        </Button>
      )}
    </div>
  );
}

export default function PilotLaunchPage() {
  const { club, memberRole, loading } = useClubContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedReportId = searchParams.get('report_id');
  const canView = PILOT_ROLES.includes(memberRole || club?._memberRole) || user?.role === 'admin';

  const queryEnabled = Boolean(club?.id && canView);
  const swimmersQuery = useQuery({
    queryKey: ['pilot-swimmers', club?.id],
    queryFn: () => entities.Swimmer.filter({ club_id: club.id }, '-created_date', 100, { includeInactive: true }),
    enabled: queryEnabled,
    staleTime: 30 * 1000,
  });
  const videosQuery = useQuery({
    queryKey: ['pilot-videos', club?.id],
    queryFn: () => entities.VideoUpload.filter({ club_id: club.id }, '-created_date', 100),
    enabled: queryEnabled,
    staleTime: 15 * 1000,
  });
  const reportsQuery = useQuery({
    queryKey: ['pilot-reports', club?.id],
    queryFn: () => entities.Report.filter({ club_id: club.id }, '-created_date', 100),
    enabled: queryEnabled,
    staleTime: 15 * 1000,
  });
  const findingsQuery = useQuery({
    queryKey: ['pilot-findings', club?.id],
    queryFn: () => entities.Finding.filter({ club_id: club.id }, '-created_date', 250),
    enabled: queryEnabled,
    staleTime: 15 * 1000,
  });
  const linksQuery = useQuery({
    queryKey: ['pilot-share-links', club?.id],
    queryFn: () => entities.SharedReportLink.filter({ club_id: club.id }, '-created_date', 100),
    enabled: queryEnabled,
    staleTime: 15 * 1000,
  });

  const reports = reportsQuery.data || [];
  const activeReport = reports.find(report => report.id === requestedReportId) || reports[0] || null;
  const findings = (findingsQuery.data || []).filter(finding => !activeReport || finding.report_id === activeReport.id);
  const consentSwimmerIds = useMemo(() => {
    const swimmers = swimmersQuery.data || [];
    const videos = videosQuery.data || [];
    const preferredIds = [
      activeReport?.swimmer_id,
      ...videos.map(video => video.swimmer_id),
      ...swimmers.map(swimmer => swimmer.id),
    ];
    return Array.from(new Set(preferredIds.filter(Boolean))).slice(0, 10);
  }, [activeReport?.swimmer_id, swimmersQuery.data, videosQuery.data]);
  const consentQuery = useQuery({
    queryKey: ['pilot-consent-statuses', club?.id, consentSwimmerIds],
    queryFn: async () => Promise.all(consentSwimmerIds.map(async (swimmerId) => {
      const result = await functions.getSwimmerConsent(swimmerId);
      const record = result?.data?.consent_record || {};
      return {
        swimmer_id: swimmerId,
        is_minor: record.is_minor === true,
        consent_status: record.consent_status || 'none',
      };
    })),
    enabled: queryEnabled && consentSwimmerIds.length > 0,
    retry: false,
    staleTime: 15 * 1000,
  });
  const annotationsQuery = useQuery({
    queryKey: ['pilot-annotations', activeReport?.id],
    queryFn: () => entities.VideoAnnotation.filter({ report_id: activeReport.id }, 'timestamp_seconds', 100),
    enabled: queryEnabled && Boolean(activeReport?.id),
    staleTime: 15 * 1000,
  });

  const storageScope = `${club?.id || 'no-club'}:${activeReport?.id || 'general'}`;
  const notesStorageKey = `ss3d:pilot:${storageScope}:notes`;
  const feedbackStorageKey = `ss3d:pilot:${storageScope}:feedback`;
  const [notesSaved, setNotesSaved] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  useEffect(() => {
    try {
      setNotesSaved(Boolean(window.localStorage.getItem(notesStorageKey)));
      setFeedbackSaved(Boolean(window.localStorage.getItem(feedbackStorageKey)));
    } catch {
      setNotesSaved(false);
      setFeedbackSaved(false);
    }
  }, [notesStorageKey, feedbackStorageKey]);

  const checklist = useMemo(() => {
    const swimmers = swimmersQuery.data || [];
    const videos = videosQuery.data || [];
    const links = linksQuery.data || [];
    const consentUnavailable = consentQuery.isError;
    const consentComplete = !consentUnavailable && (consentQuery.data || []).some(record => record.consent_status === 'granted');
    const readyVideo = videos.find(video => video.upload_status === 'uploaded' || READY_VIDEO_STATUSES.includes(video.processing_status));
    const aiFindings = findings.filter(isAIFinding);
    const unresolved = aiFindings.filter(finding => !['approved', 'rejected'].includes(finding.approval_status));
    const reviewComplete = Boolean(activeReport && unresolved.length === 0);
    const reportFinalised = Boolean(activeReport && FINAL_REPORT_STATUSES.includes(activeReport.status));
    const activeShare = links.some(link => link.report_id === activeReport?.id && link.status === 'active');
    const feedbackComplete = notesSaved && feedbackSaved;

    return [
      {
        title: 'Confirm swimmer consent recorded',
        status: consentComplete ? 'Complete' : swimmers.length ? 'Needs attention' : 'Not started',
        detail: consentComplete
          ? 'A consent record is available for this controlled test.'
          : consentUnavailable
            ? 'Consent records are currently unavailable. Do not process footage for a minor until migration 018 is confirmed.'
            : 'Record consent before processing footage, especially for a minor.',
        action: 'Open swimmers',
        to: '/swimmers',
      },
      {
        title: 'Upload or select one clean clip',
        status: readyVideo ? 'Complete' : consentComplete ? 'Ready' : 'Not started',
        detail: readyVideo ? 'At least one uploaded clip is ready for review.' : 'Use a 5–15 second, well-lit clip with one swimmer clearly visible.',
        action: 'Open analysis',
        to: '/analyse',
      },
      {
        title: 'Run AI-assisted review',
        status: activeReport ? 'Needs attention' : readyVideo ? 'Needs attention' : 'Not started',
        detail: activeReport
          ? 'A review report exists, but the Render worker is not yet production-verified. Treat AI content as draft evidence and keep manual review available.'
          : 'Live pilot AI use needs backend verification first. Continue with manual Coach Studio review for controlled testing.',
        action: activeReport ? 'Open Coach Studio' : 'Open manual review',
        to: activeReport ? `/ai-review?report_id=${activeReport.id}` : '/analyse',
      },
      {
        title: 'Coach reviews every AI draft',
        status: reviewComplete ? 'Complete' : activeReport ? 'Needs attention' : 'Not started',
        detail: reviewComplete
          ? aiFindings.length ? 'Every AI-assisted draft has a coach decision.' : 'No AI drafts were returned; manual coach review remains available.'
          : `${unresolved.length} draft finding${unresolved.length === 1 ? '' : 's'} still need coach review.`,
        action: 'Open Coach Studio',
        to: activeReport ? `/ai-review?report_id=${activeReport.id}` : '/ai-reviews',
      },
      {
        title: 'Generate coach-approved report',
        status: reportFinalised ? 'Complete' : reviewComplete ? 'Ready' : 'Not started',
        detail: reportFinalised ? 'The selected report is finalised or coach-approved.' : 'Finalise only after all draft findings have been approved, edited, or rejected.',
        action: 'Review report',
        to: activeReport ? `/ai-review?report_id=${activeReport.id}` : '/ai-reviews',
      },
      {
        title: 'Share report only after approval',
        status: activeShare ? 'Complete' : reportFinalised ? 'Ready' : 'Not started',
        detail: activeShare ? 'An active secure share link exists. Test it while logged out.' : 'Public sharing remains unavailable until coach approval and finalisation.',
        action: 'Check safety',
        to: '#report-safety',
      },
      {
        title: 'Record coach feedback after session',
        status: feedbackComplete ? 'Complete' : reportFinalised ? 'Ready' : notesSaved || feedbackSaved ? 'Needs attention' : 'Not started',
        detail: feedbackComplete ? 'Session notes and structured feedback are saved locally.' : 'Capture workflow trust, confusion, report value, and willingness to test again.',
        action: 'Record feedback',
        to: '#feedback',
      },
    ];
  }, [activeReport, consentQuery.data, consentQuery.isError, feedbackSaved, findings, linksQuery.data, notesSaved, swimmersQuery.data, videosQuery.data]);

  if (loading) return null;

  if (!club) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-slate-400" />
        <h1 className="text-sm font-bold text-slate-900">Club workspace required</h1>
        <p className="mt-1 text-xs text-slate-600">Select or create a club workspace before preparing a private pilot.</p>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <LockKeyhole className="mx-auto mb-3 h-10 w-10 text-amber-500" />
        <h1 className="text-sm font-bold text-slate-900">Internal pilot access only</h1>
        <p className="mt-1 text-xs text-slate-600">This internal checklist is available to club owners, admins, and coaches.</p>
        <Button variant="outline" className="mt-4 text-xs" onClick={() => navigate('/dashboard')}>Back to dashboard</Button>
      </div>
    );
  }

  const queryError = [swimmersQuery, videosQuery, reportsQuery, findingsQuery, linksQuery, consentQuery, annotationsQuery].find(query => query.isError);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24 lg:pb-8">
      <PageHeader
        eyebrow="Internal pilot"
        title="Private Coach Pilot"
        subtitle="A controlled workflow check for 1–2 swimmers and a small number of short clips. AI-assisted drafts remain coach-reviewed."
      />

      <PilotReadinessWarning className="mb-5" />

      <div className="mb-5"><PilotReadinessGate /></div>

      <div className="mb-5 grid gap-3 lg:grid-cols-3">
        <FeatureReadinessPanel feature={getFeatureReadiness('aiReview')} compact />
        <FeatureReadinessPanel feature={getFeatureReadiness('consentRecords')} compact />
        <FeatureReadinessPanel feature={getFeatureReadiness('coachStudio')} compact />
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 sm:col-span-2">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-900">
            <ClipboardCheck className="h-4 w-4" /> Pilot objective
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
            Validate whether coaches understand and trust the workflow enough to use Swim Sight 3D again.
          </p>
          <p className="mt-1 text-xs leading-5 text-cyan-900/80">
            This pilot does not prove AI performance. It tests review clarity, coach control, report usefulness, and safe sharing.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current context</div>
          <div className="mt-2 text-sm font-bold text-slate-900">{club.name}</div>
          <div className="mt-1 text-xs text-slate-600">{activeReport ? activeReport.title || 'Selected report' : 'No report selected yet'}</div>
        </div>
      </div>

      {queryError && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Some live checklist status could not be loaded. The pilot instructions remain available, but verify each step manually.
        </div>
      )}

      <section className="space-y-2" aria-label="Private coach pilot checklist">
        {checklist.map((item, index) => <ChecklistCard key={item.title} index={index} {...item} />)}
      </section>

      <div className="mt-6 space-y-6">
        <PilotReportSafetySummary report={activeReport} findings={findings} annotations={annotationsQuery.data || []} />
        <PilotSessionNotes storageKey={notesStorageKey} onSaved={record => setNotesSaved(Boolean(record))} />
        <CoachPilotFeedbackForm
          storageKey={feedbackStorageKey}
          clubName={club.name}
          coachName={user?.full_name || user?.name || ''}
          coachEmail={user?.email || ''}
          onSaved={record => setFeedbackSaved(Boolean(record))}
        />
      </div>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getReviewSession } from '@/lib/swimState';
import { useClubContext } from '@/lib/useClubContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import {
  FileText, Share2, Printer, CheckCircle2, Loader2, Copy, Globe,
  Lock, EyeOff, AlertTriangle, ChevronDown, ChevronUp, Target, Dumbbell
} from 'lucide-react';

function generateShareId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

const SEVERITY_CONFIG = {
  low: { bg: 'bg-green-900/30', text: 'text-green-400', label: 'Low' },
  medium: { bg: 'bg-yellow-900/30', text: 'text-yellow-400', label: 'Medium' },
  high: { bg: 'bg-orange-900/30', text: 'text-orange-400', label: 'High' },
  critical: { bg: 'bg-red-900/30', text: 'text-red-400', label: 'Critical' },
};

function SeverityBadge({ severity }) {
  const c = SEVERITY_CONFIG[severity] || { bg: 'bg-secondary', text: 'text-muted-foreground', label: severity };
  return (
    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${c.bg} ${c.text}`}>{c.label}</span>
  );
}

function FindingBlock({ finding, index }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-secondary/60 hover:bg-secondary transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-foreground">Finding {index + 1}: {finding.finding_name}</span>
          {finding.severity && <SeverityBadge severity={finding.severity} />}
          {finding.phase && <span className="text-[10px] text-primary font-medium">{finding.phase}</span>}
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="px-4 py-3 space-y-2.5 bg-card">
          {finding.coach_sees && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Coach Sees</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{finding.coach_sees}</p>
            </div>
          )}
          {finding.why_it_matters && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Why It Matters</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{finding.why_it_matters}</p>
            </div>
          )}
          {finding.cue && (
            <div className="p-2.5 rounded-lg bg-primary/8 border border-primary/20">
              <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Coaching Cue · </span>
              <span className="text-xs text-foreground font-medium">{finding.cue}</span>
            </div>
          )}
          {finding.drill && (
            <div className="flex items-start gap-2">
              <Dumbbell className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Drill: </span>
                <span className="text-xs text-foreground">{finding.drill}</span>
              </div>
            </div>
          )}
          {finding.next_focus && (
            <div className="flex items-start gap-2">
              <Target className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Next Focus: </span>
                <span className="text-xs text-foreground">{finding.next_focus}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = getReviewSession();
  const { club } = useClubContext();
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const printRef = useRef();

  const reviewId = session?.review_id;

  const { data: findings = [] } = useQuery({
    queryKey: ['findings', reviewId],
    queryFn: () => base44.entities.Finding.filter({ review_id: reviewId }),
    enabled: !!reviewId,
  });

  const { data: reviewArr = [] } = useQuery({
    queryKey: ['review-detail', reviewId],
    queryFn: () => base44.entities.Review.filter({ id: reviewId }),
    enabled: !!reviewId,
  });

  const { data: swimmerArr = [] } = useQuery({
    queryKey: ['swimmer-detail', session?.swimmer_id],
    queryFn: () => base44.entities.Swimmer.filter({ id: session.swimmer_id }),
    enabled: !!session?.swimmer_id,
  });

  const { data: existingReports = [] } = useQuery({
    queryKey: ['report-for-review', reviewId],
    queryFn: () => base44.entities.Report.filter({ review_id: reviewId }),
    enabled: !!reviewId,
  });

  const review = reviewArr[0];
  const swimmer = swimmerArr[0];
  const reportFindings = findings.filter(f => f.included_in_report !== false);
  const existingReport = existingReports[0];
  const isPublished = existingReport?.status === 'published';

  // Most critical finding for "Main Fix First"
  const mainFix = reportFindings.find(f => f.severity === 'critical') ||
                  reportFindings.find(f => f.severity === 'high') ||
                  reportFindings[0];

  const handlePrint = () => window.print();

  const handleShare = async () => {
    setPublishing(true);
    let report = existingReport;

    if (!report) {
      const shareId = generateShareId();
      report = await base44.entities.Report.create({
        review_id: reviewId,
        club_id: club?.id || undefined,
        swimmer_id: session?.swimmer_id || undefined,
        title: `${review?.stroke_or_movement || 'Technique'} Review${swimmer ? ` — ${swimmer.name}` : ''}`,
        public_share_id: shareId,
        status: 'published',
      });
      queryClient.invalidateQueries({ queryKey: ['report-for-review', reviewId] });
    } else if (!isPublished) {
      report = await base44.entities.Report.update(existingReport.id, { status: 'published' });
      queryClient.invalidateQueries({ queryKey: ['report-for-review', reviewId] });
    }

    const shareId = report.public_share_id || existingReport?.public_share_id;
    const url = `${window.location.origin}/public-report?id=${shareId}`;
    setShareLink(url);

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {}

    setPublishing(false);
  };

  const handleRevoke = async () => {
    if (!existingReport) return;
    setRevoking(true);
    await base44.entities.Report.update(existingReport.id, { status: 'draft', public_share_id: null });
    queryClient.invalidateQueries({ queryKey: ['report-for-review', reviewId] });
    setShareLink('');
    setRevoking(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (!session || !reviewId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
          icon={FileText}
          title="No Review Session"
          description="Complete a review session to generate a report."
          actions={[{ label: 'Start Review', to: '/analyse' }]}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <PageHeader
        eyebrow={club?.name || 'Swim Sight 3D'}
        title="Technique Review Report"
        subtitle={`${review?.stroke_or_movement || '—'} · ${review?.camera_angle || '—'}`}
      >
        {/* Privacy status */}
        <div className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full mt-2 ${
          isPublished ? 'bg-green-900/20 text-green-400 border border-green-700/30' : 'bg-secondary text-muted-foreground border border-border'
        }`}>
          {isPublished ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
          {isPublished ? 'Shared via link' : 'Private'}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <Button size="sm" variant="outline" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5 mr-1" /> Print / PDF
          </Button>
          {!isPublished ? (
            <Button size="sm" onClick={handleShare} disabled={publishing || !reviewId} className="bg-primary text-primary-foreground">
              {publishing ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Creating link...</>
              ) : (
                <><Share2 className="w-3.5 h-3.5 mr-1" /> Create Share Link</>
              )}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleShare} disabled={publishing}>
                <Copy className="w-3.5 h-3.5 mr-1" /> Copy Link
              </Button>
              <Button size="sm" variant="outline" onClick={handleRevoke} disabled={revoking} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                {revoking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <EyeOff className="w-3.5 h-3.5 mr-1" />}
                Revoke Link
              </Button>
            </div>
          )}
        </div>

        {shareLink && (
          <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-card border border-border">
            <Globe className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-xs text-muted-foreground flex-1 truncate">{shareLink}</span>
            <Button size="sm" variant="ghost" onClick={handleCopyLink} className="shrink-0 h-7">
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="ml-1 text-xs">{copied ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
        )}
      </PageHeader>

      {/* Report body */}
      <div id="report-sheet" ref={printRef} className="space-y-4">
        {/* Club header */}
        {club && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: club.primary_color || '#0ea5e9' }}
            >
              {club.initials || club.name?.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">{club.name}</div>
              <div className="text-xs text-muted-foreground">{club.location || 'Technique Review Report'}</div>
            </div>
            <div className="ml-auto text-xs text-muted-foreground">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        )}

        {/* Swimmer + Review meta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-card border border-border text-xs">
          <div>
            <div className="text-muted-foreground mb-0.5">Swimmer</div>
            <div className="font-semibold text-foreground">{swimmer?.name || session?.swimmer_name || '—'}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-0.5">Stroke</div>
            <div className="font-semibold text-foreground">{review?.stroke_or_movement || '—'}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-0.5">Camera</div>
            <div className="font-semibold text-foreground">{review?.camera_angle || '—'}</div>
          </div>
          <div>
            <div className="text-muted-foreground mb-0.5">Review Type</div>
            <div className="font-semibold text-foreground capitalize">{review?.review_type?.replace(/_/g,' ') || '—'}</div>
          </div>
        </div>

        {/* Main Fix First */}
        {mainFix && (
          <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wide">Main Fix First</span>
              {mainFix.severity && <SeverityBadge severity={mainFix.severity} />}
            </div>
            <div className="text-sm font-semibold text-foreground mb-1">{mainFix.finding_name}</div>
            {mainFix.coach_sees && <p className="text-xs text-muted-foreground mb-2">{mainFix.coach_sees}</p>}
            {mainFix.cue && (
              <div className="mt-2 p-2.5 rounded-lg bg-primary/8 border border-primary/20">
                <span className="text-[10px] text-primary font-semibold uppercase tracking-wider">Correction: </span>
                <span className="text-xs text-foreground">{mainFix.cue}</span>
              </div>
            )}
            {mainFix.drill && (
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
                <Dumbbell className="w-3 h-3" /> <strong>Drill:</strong> {mainFix.drill}
              </div>
            )}
          </div>
        )}

        {/* All findings */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider px-1">
            All Findings ({reportFindings.length})
          </h2>
          {reportFindings.length === 0 ? (
            <div className="p-6 rounded-xl bg-card border border-border text-center text-xs text-muted-foreground">
              No findings added. Return to Analysis Studio to add coach findings.
            </div>
          ) : (
            <div className="space-y-2">
              {reportFindings.map((f, i) => (
                <FindingBlock key={f.id} finding={f} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Coach notes */}
        {review?.coach_notes && (
          <div className="p-4 rounded-xl bg-card border border-border">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Coach Notes</h2>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{review.coach_notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border">
          <span>Generated by Swim Sight 3D · {new Date().toLocaleDateString()}</span>
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3" /> Private Report
          </span>
        </div>
      </div>
    </div>
  );
}
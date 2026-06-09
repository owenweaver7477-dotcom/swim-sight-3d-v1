import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import entities from '@/lib/data/entities';
import functions from '@/lib/data/functions';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Link2, CheckCircle2, XCircle, Loader2, ExternalLink, AlertCircle, Mail, UserRound, UsersRound, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';

function RecipientCard({ recipient, shareUrl, reportId, activeLinkId, swimmerId, onLogged }) {
  const [copiedMessage, setCopiedMessage] = useState(false);

  const logDelivery = useMutation({
    mutationFn: (status) => functions.logReportDelivery(reportId, {
      shared_report_link_id: activeLinkId,
      swimmer_id: swimmerId,
      recipient_email: recipient.email || null,
      recipient_type: recipient.type,
      delivery_method: 'manual_copy',
      status,
    }),
    onSuccess: () => {
      onLogged?.();
    },
    onError: (error) => {
      toast.warning(error?.message || 'Could not log delivery action. The link was still copied.');
    },
  });

  const copyMessage = async () => {
    const label = recipient.label.toLowerCase();
    const message = [
      `Hi${recipient.name ? ` ${recipient.name}` : ''},`,
      '',
      'Your Swim Sight 3D coach report is ready.',
      shareUrl,
      '',
      'AI-assisted evidence supports coach review. Final report content is coach-approved.',
    ].join('\n');
    try {
      await navigator.clipboard.writeText(message);
      setCopiedMessage(true);
      toast.success(`Manual share message copied for ${label}`);
      await logDelivery.mutateAsync('copied');
      setTimeout(() => setCopiedMessage(false), 2000);
    } catch {
      toast.error('Failed to copy delivery message');
    }
  };

  const Icon = recipient.type === 'parent' ? UsersRound : UserRound;

  return (
    <div className="p-3 rounded-xl bg-secondary/40 border border-border space-y-2">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-foreground">{recipient.label}</div>
          <div className="text-[10px] text-muted-foreground truncate">{recipient.email || 'No email saved'}</div>
        </div>
      </div>
      {recipient.email ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={copyMessage} className="h-8 text-xs" disabled={logDelivery.isPending}>
            {copiedMessage ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
            Copy Message
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => logDelivery.mutate('prepared')}
            disabled={logDelivery.isPending}
            className="h-8 text-xs"
          >
            {logDelivery.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" />}
            Mark Prepared
          </Button>
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Add this email on the swimmer profile to prepare recipient-specific delivery.
        </p>
      )}
    </div>
  );
}

export default function ShareReportSection({ report, reportId, swimmer, canEdit, isCoachApproved, findings = [], analysisMode }) {
  const queryClient = useQueryClient();
  const [shareUrl, setShareUrl] = useState('');
  const [activeLinkId, setActiveLinkId] = useState('');
  const [copied, setCopied] = useState(false);
  const [functionError, setFunctionError] = useState('');

  // Load existing active share link on mount
  const { data: existingLinks = [] } = useQuery({
    queryKey: ['shared-links', reportId],
    queryFn: () => entities.SharedReportLink.filter({ report_id: reportId, status: 'active' }),
    enabled: !!reportId && isCoachApproved && canEdit,
  });

  const { data: deliveryLogs = [] } = useQuery({
    queryKey: ['notification-logs', reportId],
    queryFn: async () => {
      try {
        return await entities.NotificationLog.filter({ report_id: reportId }, '-created_date', 20);
      } catch {
        return [];
      }
    },
    enabled: !!reportId && isCoachApproved && canEdit,
  });

  useEffect(() => {
    if (existingLinks.length > 0 && !shareUrl) {
      const link = existingLinks[0];
      const origin = window.location.origin;
      setActiveLinkId(link.id);
      setShareUrl(`${origin}/shared-report/${link.token}`);
    }
  }, [existingLinks]);

  const pendingCount = findings.filter(f => f.approval_status === 'pending').length;
  const canShare = isCoachApproved && pendingCount === 0;

  const createLink = useMutation({
    mutationFn: async () => {
      setFunctionError('');
      const res = await functions.createSharedReportLink(reportId);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.error) {
        setFunctionError(data.error);
        toast.error(data.error);
      } else {
        setShareUrl(data.public_url);
        setActiveLinkId(data.share_link_id || '');
        queryClient.invalidateQueries({ queryKey: ['shared-links', reportId] });
        toast.success('Share link created');
      }
    },
    onError: (err) => {
      const errorMsg = err?.response?.data?.error || 'Failed to create link';
      setFunctionError(errorMsg);
      toast.error(errorMsg);
    },
  });

  const disableLink = useMutation({
    mutationFn: async () => {
      if (!activeLinkId) throw new Error('No active share link selected.');
      await functions.disableSharedReportLink(activeLinkId);
    },
    onSuccess: () => {
      setShareUrl('');
      setActiveLinkId('');
      queryClient.invalidateQueries({ queryKey: ['shared-links', reportId] });
      queryClient.invalidateQueries({ queryKey: ['notification-logs', reportId] });
      toast.success('Share link disabled');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.error || 'Failed to disable link');
    },
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      if (activeLinkId) {
        functions.logReportDelivery(reportId, {
          shared_report_link_id: activeLinkId,
          swimmer_id: swimmer?.id || report?.swimmer_id || null,
          recipient_type: 'other',
          delivery_method: 'manual_copy',
          status: 'copied',
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['notification-logs', reportId] });
        }).catch(() => {});
      }
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  if (!canEdit) {
    return (
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Share2 className="w-3.5 h-3.5" />
          <span>Only coaches can create share links</span>
        </div>
      </div>
    );
  }

  // Block sharing for placeholder reports unless all findings have been manually reviewed
  const isPlaceholder = !analysisMode || analysisMode === 'placeholder';
  const allFindingsReviewed = findings.every(f => f.approval_status !== 'pending');

  if (isPlaceholder && !allFindingsReviewed) {
    return (
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-xs font-semibold text-amber-800">Sharing Blocked — Placeholder Report</div>
            <p className="text-[10px] text-amber-700 leading-relaxed">
              This report contains placeholder AI findings (not real pose analysis). You must review and approve or dismiss every finding before a share link can be created.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isCoachApproved) {
    return (
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="flex items-start gap-2.5">
          <Link2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-xs font-semibold text-foreground">Share Link Not Available</div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              This report must be marked as "Coach Approved" before it can be shared. Review and approve all findings above, then finalise the report.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (shareUrl) {
    const recipients = [
      {
        type: 'swimmer',
        label: 'Swimmer',
        name: swimmer?.first_name || swimmer?.name?.split(' ')?.[0] || '',
        email: swimmer?.swimmer_email || '',
      },
      {
        type: 'parent',
        label: 'Parent / Guardian',
        name: '',
        email: swimmer?.parent_email || '',
      },
    ];
    const manualCount = deliveryLogs.filter(log => log.delivery_method === 'manual_copy').length;
    const latestLog = deliveryLogs[0];

    return (
      <div className="space-y-3">
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="text-xs font-semibold text-foreground">Secure Share Link Active</div>
              <p className="text-[10px] text-muted-foreground">
                Anyone with this link can view the approved, read-only coach report. No private video URL is included.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground font-mono truncate">
                  {shareUrl}
                </div>
                <Button size="sm" variant="outline" onClick={handleCopy} className="h-9" title="Copy link">
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.open(shareUrl, '_blank')} className="h-9" title="Open shared report">
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => disableLink.mutate()}
                  disabled={disableLink.isPending}
                  className="h-8 text-xs"
                >
                  {disableLink.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5 mr-1.5" />}
                  Disable Link
                </Button>
                {latestLog && (
                  <span className="text-[10px] text-muted-foreground">
                    Last delivery action: {latestLog.status?.replace(/_/g, ' ')} · {manualCount} manual log{manualCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <div className="flex items-start gap-2.5">
            <Mail className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-foreground">Notify Swimmer / Parent</div>
              <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                Email delivery is not connected yet. Copy the secure report link and send it manually.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recipients.map(recipient => (
              <RecipientCard
                key={recipient.type}
                recipient={recipient}
                shareUrl={shareUrl}
                reportId={reportId}
                activeLinkId={activeLinkId}
                swimmerId={swimmer?.id || report?.swimmer_id}
                onLogged={() => queryClient.invalidateQueries({ queryKey: ['notification-logs', reportId] })}
              />
            ))}
          </div>

          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-[10px] text-amber-800 leading-relaxed">
              No email has been sent by Swim Sight 3D. When real email delivery is connected later, emails should contain only this secure report link, not private video, raw AI data, or pending findings.
            </p>
          </div>
      </div>
    </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main share section */}
      <div className="p-4 rounded-xl bg-card border border-border space-y-3">
        <div className="flex items-start gap-2.5">
          <Share2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <div className="text-xs font-semibold text-foreground">Create Share Link</div>
            <p className="text-[10px] text-muted-foreground">
              Generate a secure, read-only link to share this coach-approved report with swimmers or parents.
            </p>
            <Button
              size="sm"
              onClick={() => createLink.mutate()}
              disabled={createLink.isPending || !canShare}
              className="h-8 text-xs"
            >
              {createLink.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5 mr-1.5" />}
              {createLink.isPending ? 'Creating...' : 'Create Share Link'}
            </Button>
            {pendingCount > 0 && (
              <div className="flex items-start gap-1.5 p-2 rounded bg-yellow-900/10 border border-yellow-700/20">
                <AlertCircle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-yellow-400/80">
                  {pendingCount} finding{pendingCount > 1 ? 's' : ''} still pending review — only approved findings will appear in the shared report.
                </p>
              </div>
            )}
            {functionError && (
              <div className="flex items-start gap-1.5 p-2 rounded bg-red-900/10 border border-red-700/20">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-red-400/80">{functionError}</p>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}

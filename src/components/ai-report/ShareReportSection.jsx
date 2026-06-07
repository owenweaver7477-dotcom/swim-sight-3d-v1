import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Link2, CheckCircle2, XCircle, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareReportSection({ report, reportId, canEdit, isCoachApproved, findings = [], analysisMode }) {
  const queryClient = useQueryClient();
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [functionError, setFunctionError] = useState('');

  // Load existing active share link on mount
  const { data: existingLinks = [] } = useQuery({
    queryKey: ['shared-links', reportId],
    queryFn: () => base44.entities.SharedReportLink.filter({ report_id: reportId, is_active: true }),
    enabled: !!reportId && isCoachApproved && canEdit,
  });

  useEffect(() => {
    if (existingLinks.length > 0 && !shareUrl) {
      const link = existingLinks[0];
      const origin = window.location.origin;
      setShareUrl(`${origin}/shared-report/${link.token}`);
    }
  }, [existingLinks]);

  const approvedCount = findings.filter(f => f.approval_status === 'approved').length;
  const pendingCount = findings.filter(f => f.approval_status === 'pending').length;
  const rejectedCount = findings.filter(f => f.approval_status === 'rejected').length;
  const canShare = approvedCount > 0;

  const createLink = useMutation({
    mutationFn: async () => {
      setFunctionError('');
      const res = await base44.functions.invoke('createSharedReportLink', { report_id: reportId });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.error) {
        setFunctionError(data.error);
        toast.error(data.error);
      } else {
        setShareUrl(data.public_url);
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
      await base44.functions.invoke('disableSharedReportLink', { report_id: reportId });
    },
    onSuccess: () => {
      setShareUrl('');
      queryClient.invalidateQueries({ queryKey: ['shared-links', reportId] });
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
  const allFindingsReviewed = findings.length > 0 && findings.every(f => f.approval_status !== 'pending');

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
    return (
      <div className="p-4 rounded-xl bg-card border border-border space-y-3">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="text-xs font-semibold text-foreground">Share Link Active</div>
            <p className="text-[10px] text-muted-foreground">
              Anyone with this link can view the approved coach report (read-only).
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground font-mono truncate">
                {shareUrl}
              </div>
              <Button size="sm" variant="outline" onClick={handleCopy} className="h-9">
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.open(shareUrl, '_blank')} className="h-9">
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>
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
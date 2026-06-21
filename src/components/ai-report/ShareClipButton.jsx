import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import functions from '@/lib/data/functions';
import { Button } from '@/components/ui/button';
import { Film, Loader2, Copy, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Feature B — shareable analysis clip. Flag-gated, DEFAULT OFF.
// Set VITE_ENABLE_SHARE_CLIP=true to enable. With it off this renders nothing,
// so existing behaviour is unchanged.
const SHARE_CLIP_ENABLED = import.meta.env.VITE_ENABLE_SHARE_CLIP === 'true';

/**
 * Export a short, coach-approved clip (overlay + up to 3 approved callouts burned
 * in) that's safe to share. Mirrors ShareReportSection's gating: coach-approved,
 * non-placeholder, no pending findings. The BACKEND must additionally enforce
 * consent (REQUIRE_CONSENT) and include ONLY approved + public items — this UI is
 * the trigger, not the trust boundary.
 *
 * Wiring: add `exportShareableClip(reportId)` to src/lib/data/functions.js (see
 * FRONTEND_FEATURES_WIRING.md), then mount <ShareClipButton/> inside
 * ShareReportSection.
 */
export default function ShareClipButton({ reportId, isCoachApproved, findings = [], analysisMode }) {
  const [clipUrl, setClipUrl] = useState('');
  const [copied, setCopied] = useState(false);


  const isPlaceholder = !analysisMode || analysisMode === 'placeholder';
  const pendingCount = findings.filter((f) => f.approval_status === 'pending').length;
  const approvedCount = findings.filter((f) => f.approval_status === 'approved').length;
  const canExport = !isPlaceholder && pendingCount === 0 && approvedCount > 0;

  const exportClip = useMutation({
    mutationFn: async () => {
      const res = await functions.exportShareableClip(reportId);
      if (res?.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: (data) => {
      setClipUrl(data?.clip_url || '');
      toast.success('Shareable clip ready');
    },
    onError: (err) => toast.error(err?.message || 'Could not export clip'),
  });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(clipUrl);
      setCopied(true);
      toast.success('Clip link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  if (!SHARE_CLIP_ENABLED || !isCoachApproved) return null;

  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-3">
      <div className="flex items-start gap-2.5">
        <Film className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
        <div className="space-y-2 flex-1">
          <div className="text-xs font-semibold text-foreground">Export Shareable Clip</div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Render a short, coach-approved clip with the overlay and up to three approved callouts burned in — safe to send
            to swimmers/parents or post. AI-assisted, coach-approved. No private video, raw AI data, or pending findings are included.
          </p>

          {!clipUrl ? (
            <>
              <Button
                size="sm"
                onClick={() => exportClip.mutate()}
                disabled={exportClip.isPending || !canExport}
                className="h-8 text-xs"
              >
                {exportClip.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Film className="w-3.5 h-3.5 mr-1.5" />}
                {exportClip.isPending ? 'Rendering…' : 'Export Clip'}
              </Button>
              {!canExport && (
                <div className="flex items-start gap-1.5 p-2 rounded bg-amber-50 border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700">
                    Approve all findings on a real (non-placeholder) report with at least one approved finding to export a clip.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <video src={clipUrl} controls className="w-full rounded-lg border border-border" />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={copyLink} className="h-8 text-xs">
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                  Copy Link
                </Button>
                <a href={clipUrl} download className="inline-flex">
                  <Button size="sm" variant="outline" className="h-8 text-xs">
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download
                  </Button>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Clapperboard, Film, User, Download, Share2 } from 'lucide-react';

export default function ReportNavActions({ report, swimmer, video, onScrollToFindings, onScrollToFinalReport, onScrollToShare, onDownloadPDF, onViewSourceVideo }) {
  const navigate = useNavigate();
  const isPublished = ['coach_approved', 'finalised', 'published', 'shared'].includes(report?.status);

  if (!isPublished) return null;

  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Report Navigation</div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onScrollToFinalReport}>
          <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" /> View Final Coach Report
        </Button>
        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={onScrollToFindings}>
          <Clapperboard className="w-3.5 h-3.5 mr-1.5" /> Back to review
        </Button>
        {/* DE-5. This navigated to /analyse?video_id=… but Analyse.jsx never reads
            video_id — it reads only `swimmer` — and initialises at step 0, so the coach
            was dumped on the swimmer picker of the new-review wizard with no swimmer, no
            video, and no sign that a specific clip had been asked for. The clip is
            already on this page in the Coach Studio, so scroll to it instead of
            navigating away to a screen that cannot honour the request. */}
        {video && onViewSourceVideo && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
            onClick={onViewSourceVideo}
          >
            <Film className="w-3.5 h-3.5 mr-1.5" /> View Source Video
          </Button>
        )}
        {swimmer && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
            onClick={() => navigate(`/swimmers?swimmer_id=${swimmer.id}`)}
          >
            <User className="w-3.5 h-3.5 mr-1.5" /> Swimmer Profile
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={onScrollToShare}>
          <Share2 className="w-3.5 h-3.5 mr-1.5" /> Manage Share Link
        </Button>
        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={onDownloadPDF}>
          <Download className="w-3.5 h-3.5 mr-1.5" /> Download PDF
        </Button>
      </div>
    </div>
  );
}

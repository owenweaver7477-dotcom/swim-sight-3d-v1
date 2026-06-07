import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, AlertCircle } from 'lucide-react';

export default function PublicReportView({ shareId }) {
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['public-report', shareId],
    queryFn: () => base44.entities.Report.filter({ public_share_id: shareId, status: 'published' }),
    enabled: !!shareId,
  });

  const report = reports[0] || null;

  const { data: findings = [] } = useQuery({
    queryKey: ['public-findings', report?.review_id],
    queryFn: () => base44.entities.Finding.filter({ review_id: report.review_id }),
    enabled: !!report?.review_id,
  });

  const { data: reviewArr = [] } = useQuery({
    queryKey: ['public-review', report?.review_id],
    queryFn: () => base44.entities.Review.filter({ id: report.review_id }),
    enabled: !!report?.review_id,
  });

  const { data: clubs = [] } = useQuery({
    queryKey: ['public-club', report?.club_id],
    queryFn: () => base44.entities.Club.filter({ id: report.club_id }),
    enabled: !!report?.club_id,
  });

  const { data: swimmers = [] } = useQuery({
    queryKey: ['public-swimmer', report?.swimmer_id],
    queryFn: () => base44.entities.Swimmer.filter({ id: report.swimmer_id }),
    enabled: !!report?.swimmer_id,
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  );

  if (!report) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <div className="text-sm font-medium text-foreground mb-1">Report Not Found</div>
        <div className="text-xs text-muted-foreground">This report link is invalid or has been removed.</div>
      </div>
    </div>
  );

  const review = reviewArr[0];
  const club = clubs[0];
  const swimmer = swimmers[0];
  const reportFindings = findings.filter(f => f.included_in_report !== false);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        {/* Club Header */}
        {club && (
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: club.primary_color || '#0ea5e9' }}
            >
              {club.initials || club.name?.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">{club.name}</div>
              <div className="text-xs text-gray-500">Technique Review Report</div>
            </div>
          </div>
        )}

        <h1 className="text-lg font-bold text-gray-900 mb-1">{report.title || 'Technique Review'}</h1>
        {swimmer && <div className="text-sm text-gray-600 mb-4">Athlete: {swimmer.name}</div>}

        {review && (
          <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
            {review.stroke_or_movement && <div><span className="text-gray-500">Stroke</span><div className="font-medium text-gray-900">{review.stroke_or_movement}</div></div>}
            {review.camera_angle && <div><span className="text-gray-500">Camera</span><div className="font-medium text-gray-900">{review.camera_angle}</div></div>}
            {review.environment && <div><span className="text-gray-500">Environment</span><div className="font-medium text-gray-900 capitalize">{review.environment}</div></div>}
            {review.review_type && <div><span className="text-gray-500">Type</span><div className="font-medium text-gray-900">{review.review_type.replace(/_/g,' ')}</div></div>}
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Findings ({reportFindings.length})</h3>
          {reportFindings.length === 0 ? (
            <p className="text-xs text-gray-500">No findings in this report.</p>
          ) : (
            <div className="space-y-4">
              {reportFindings.map((f, i) => (
                <div key={f.id} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">{i+1}. {f.finding_name}</h4>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-200 text-gray-600 capitalize">{f.severity}</span>
                  </div>
                  {f.coach_sees && <div className="text-xs mb-1"><span className="font-medium text-gray-700">Coach Sees:</span> {f.coach_sees}</div>}
                  {f.why_it_matters && <div className="text-xs mb-1"><span className="font-medium text-gray-700">Why It Matters:</span> {f.why_it_matters}</div>}
                  {f.cue && <div className="text-xs mb-1 p-2 rounded bg-blue-50 border border-blue-100"><span className="font-medium text-blue-700">Cue:</span> {f.cue}</div>}
                  {f.drill && <div className="text-xs mb-1"><span className="font-medium text-gray-700">Drill:</span> {f.drill}</div>}
                  {f.next_focus && <div className="text-xs"><span className="font-medium text-gray-700">Next Focus:</span> {f.next_focus}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {review?.coach_notes && (
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Coach Notes</h3>
            <p className="text-xs text-gray-700 whitespace-pre-wrap">{review.coach_notes}</p>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100 text-[10px] text-gray-400">
          Swim Sight 3D · Read-only shared report
        </div>
      </div>
    </div>
  );
}
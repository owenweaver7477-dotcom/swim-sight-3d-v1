import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, X, Plus, ChevronDown, ChevronUp, Info, Zap } from 'lucide-react';
import DragRiskCreateModal from './DragRiskCreateModal';
import DragRiskSummary from './DragRiskSummary';

const RISK_CONFIG = {
  low:     { label: 'Low Risk',     cls: 'text-green-700 bg-green-50 border-green-200',    dot: 'bg-green-500' },
  medium:  { label: 'Medium Risk',  cls: 'text-amber-700 bg-amber-50 border-amber-200',    dot: 'bg-amber-500' },
  high:    { label: 'High Risk',    cls: 'text-red-700 bg-red-50 border-red-200',          dot: 'bg-red-500' },
  unknown: { label: 'Unknown',      cls: 'text-slate-600 bg-slate-50 border-slate-200',    dot: 'bg-slate-400' },
};

const OVERLAY_LABELS = {
  body_line:        'Body Line',
  frontal_area:     'Frontal Area',
  flow_arrows:      'Flow Arrows',
  kick_width:       'Kick Width',
  streamline_break: 'Streamline Break',
  head_lift:        'Head Lift',
  hip_drop:         'Hip Drop',
};

const ZONE_LABELS = {
  head: 'Head', shoulders: 'Shoulders', torso: 'Torso', hips: 'Hips',
  knees: 'Knees', ankles: 'Ankles', arms: 'Arms', streamline: 'Streamline', full_body: 'Full Body',
};

function RiskBadge({ level }) {
  const cfg = RISK_CONFIG[level] || RISK_CONFIG.unknown;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function DragItemCard({ item, canEdit, onApprove, onReject, onToggleReport, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = RISK_CONFIG[item.drag_risk_level] || RISK_CONFIG.unknown;
  const isAI = item.source === 'ai_pose';

  return (
    <div className={`rounded-lg border bg-white overflow-hidden ${
      item.approval_status === 'rejected' ? 'opacity-50' : ''
    }`}>
      <div className="p-3">
        <div className="flex items-start gap-2">
          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-semibold text-foreground">
                {OVERLAY_LABELS[item.overlay_type] || item.overlay_type || 'Drag Risk'}
              </span>
              <RiskBadge level={item.drag_risk_level} />
              {item.drag_zone && (
                <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                  {ZONE_LABELS[item.drag_zone] || item.drag_zone}
                </span>
              )}
              {item.stroke_phase && (
                <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                  {item.stroke_phase}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              {isAI ? (
                <span className="flex items-center gap-1 text-yellow-600">
                  <Zap className="w-3 h-3" /> AI suggested — coach review required
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Coach annotation
                </span>
              )}
              {item.timestamp_start != null && (
                <span className="font-mono">@ {item.timestamp_start.toFixed(1)}s</span>
              )}
              {item.approval_status === 'approved' && (
                <span className="text-green-600 font-medium">✓ Approved</span>
              )}
              {item.approval_status === 'rejected' && (
                <span className="text-muted-foreground">Dismissed</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setExpanded(v => !v)} className="p-1 text-muted-foreground hover:text-foreground">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {canEdit && onDelete && (
              <button onClick={() => onDelete(item.id)} className="p-1 text-muted-foreground hover:text-destructive">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            {item.measurement_summary && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Evidence Summary</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.measurement_summary}</p>
              </div>
            )}
            {item.coach_notes && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Coach Notes</div>
                <p className="text-xs text-foreground leading-relaxed">{item.coach_notes}</p>
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              Evidence: {item.evidence_type || 'coach_review'} · Mode: {item.analysis_mode || 'manual'}
            </div>

            {canEdit && item.approval_status !== 'rejected' && (
              <div className="flex items-center gap-2 pt-1">
                {item.approval_status === 'pending' && (
                  <>
                    <Button size="sm" className="h-7 text-xs bg-green-700 hover:bg-green-600 text-white" onClick={() => onApprove(item)}>
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onReject(item)}>
                      <X className="w-3 h-3 mr-1" /> Dismiss
                    </Button>
                  </>
                )}
                {item.approval_status === 'approved' && (
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.included_in_report || false}
                      onChange={e => onToggleReport(item, e.target.checked)}
                      className="accent-primary"
                    />
                    Include in final report
                  </label>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DragRiskPanel({ report, video, findings = [], canEdit }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const videoUploadId = video?.id || report?.video_upload_id;

  const { data: dragItems = [] } = useQuery({
    queryKey: ['drag-analysis', videoUploadId],
    queryFn: () => base44.entities.DragAnalysis.filter({ video_upload_id: videoUploadId }, '-created_date', 50),
    enabled: !!videoUploadId,
  });

  const approve = useMutation({
    mutationFn: (item) => base44.entities.DragAnalysis.update(item.id, { approval_status: 'approved' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drag-analysis', videoUploadId] }),
  });

  const reject = useMutation({
    mutationFn: (item) => base44.entities.DragAnalysis.update(item.id, { approval_status: 'rejected' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drag-analysis', videoUploadId] }),
  });

  const toggleReport = useMutation({
    mutationFn: ({ item, included }) => base44.entities.DragAnalysis.update(item.id, { included_in_report: included }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drag-analysis', videoUploadId] }),
  });

  const deleteItem = useMutation({
    mutationFn: (id) => base44.entities.DragAnalysis.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drag-analysis', videoUploadId] }),
  });

  const updateStandard = useMutation({
    mutationFn: ({ item, id, title }) => base44.entities.DragAnalysis.update(item.id, { linked_standard_id: id, linked_standard_title: title }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drag-analysis', videoUploadId] }),
  });

  const active = dragItems.filter(d => d.approval_status !== 'rejected');
  const pending = dragItems.filter(d => d.approval_status === 'pending');
  const approved = dragItems.filter(d => d.approval_status === 'approved');
  const visible = showAll ? dragItems : dragItems.slice(0, 4);

  // Real pose check
  const hasReliablePose = report?.analysis_mode === 'real_pose' && report?.real_pose_detected === true;

  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Drag Risk Visualisation</h3>
            {pending.length > 0 && (
              <span className="text-[10px] text-yellow-600 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded-full">
                {pending.length} pending
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Estimates likely resistance areas from video evidence and coach annotations.
          </p>
        </div>
        {canEdit && (
          <Button size="sm" variant="outline" className="h-7 text-xs flex-shrink-0" onClick={() => setShowCreate(true)}>
            <Plus className="w-3 h-3 mr-1" /> Add Overlay
          </Button>
        )}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
        <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-amber-700 leading-relaxed">
          Drag risk overlays are coaching aids. They estimate likely resistance areas from video evidence and must be reviewed by a coach. This is not a fluid-dynamic measurement.
        </p>
      </div>

      {/* No pose warning for AI-derived */}
      {!hasReliablePose && dragItems.filter(d => d.source === 'ai_pose').length === 0 && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-secondary/50 border border-border">
          <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            AI-derived drag visualisation requires reliable pose evidence. Upload clearer footage for AI suggestions, or use manual annotation tools to add drag overlays.
          </p>
        </div>
      )}

      {/* Summary scores */}
      {(active.length > 0 || approved.length > 0) && (
        <DragRiskSummary dragItems={active} />
      )}

      {/* Items list */}
      {dragItems.length === 0 ? (
        <div className="text-center py-4 text-xs text-muted-foreground">
          No drag risk overlays yet.{canEdit ? ' Click "Add Overlay" to create one manually.' : ''}
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map(item => (
            <DragItemCard
              key={item.id}
              item={item}
              canEdit={canEdit}
              onApprove={(i) => approve.mutate(i)}
              onReject={(i) => reject.mutate(i)}
              onToggleReport={(i, v) => toggleReport.mutate({ item: i, included: v })}
              onDelete={(id) => deleteItem.mutate(id)}
              clubId={report?.club_id}
            />
          ))}
          {dragItems.length > 4 && (
            <button
              className="text-[10px] text-primary hover:underline w-full text-center"
              onClick={() => setShowAll(v => !v)}
            >
              {showAll ? 'Show less' : `Show all ${dragItems.length} overlays`}
            </button>
          )}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <DragRiskCreateModal
          report={report}
          video={video}
          findings={findings}
          userId={user?.id}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['drag-analysis', videoUploadId] });
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useClubContext } from '@/lib/useClubContext';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, AlertTriangle, MinusCircle, Loader2, ChevronDown, ChevronRight, ExternalLink, Plus, Star } from 'lucide-react';
import { format } from 'date-fns';
import TestSessionModal from './TestSessionModal';

const STATUS_CONFIG = {
  not_started: { icon: Circle,        label: 'Not started', cls: 'text-slate-400' },
  tested:      { icon: CheckCircle2,  label: 'Tested',      cls: 'text-green-600' },
  issue_found: { icon: AlertTriangle, label: 'Issue found',  cls: 'text-red-500' },
  skipped:     { icon: MinusCircle,   label: 'Skipped',      cls: 'text-slate-300' },
};

const SEV_STYLE = {
  low:      'bg-slate-100 text-slate-600 border-slate-200',
  medium:   'bg-amber-50 text-amber-700 border-amber-200',
  high:     'bg-red-50 text-red-600 border-red-200',
  critical: 'bg-red-100 text-red-700 border-red-300 font-bold',
};

const SESSION_STATUS_STYLE = {
  planned:     'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-50 text-blue-700',
  completed:   'bg-green-50 text-green-700',
};

function StarDisplay({ value }) {
  if (!value) return null;
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={`w-3 h-3 ${n <= value ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />
      ))}
    </span>
  );
}

function ChecklistItem({ item }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(item.notes || '');
  const [severity, setSeverity] = useState(item.severity || '');
  const [saving, setSaving] = useState(false);

  const Cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.not_started;
  const Icon = Cfg.icon;

  const setStatus = async (newStatus) => {
    // Clear local severity when moving away from issue_found
    if (newStatus !== 'issue_found') setSeverity('');
    await base44.entities.CoachTestingItem.update(item.id, {
      status: newStatus,
      severity: newStatus !== 'issue_found' ? undefined : (severity || undefined),
    });
    qc.invalidateQueries({ queryKey: ['testing-items'] });
  };

  const save = async () => {
    setSaving(true);
    await base44.entities.CoachTestingItem.update(item.id, {
      notes: notes || undefined,
      severity: item.status === 'issue_found' && severity ? severity : undefined,
    });
    setSaving(false);
    qc.invalidateQueries({ queryKey: ['testing-items'] });
    setExpanded(false);
  };

  return (
    <div className={`rounded-lg border ${item.status === 'issue_found' ? 'border-red-200 bg-red-50/30' : item.status === 'tested' ? 'border-green-200 bg-green-50/20' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center gap-3 p-3">
        <Icon className={`w-4 h-4 flex-shrink-0 ${Cfg.cls}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate-800">{item.label}</span>
            {item.status === 'issue_found' && item.severity && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded border capitalize ${SEV_STYLE[item.severity]}`}>{item.severity}</span>
            )}
          </div>
          {item.notes && !expanded && (
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">{item.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {item.route && (
            <a href={item.route} className="text-slate-400 hover:text-primary" title={`Go to ${item.route}`}>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-slate-600">
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-slate-100 pt-3 space-y-3">
          {/* Status buttons */}
          <div className="flex gap-1.5 flex-wrap">
            {Object.entries(STATUS_CONFIG).map(([s, cfg]) => {
              const I = cfg.icon;
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border transition-colors ${item.status === s ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:border-primary/40'}`}
                >
                  <I className="w-3 h-3" /> {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Severity if issue */}
          {item.status === 'issue_found' && (
            <div className="flex gap-1.5 flex-wrap">
              {['low','medium','high','critical'].map(s => (
                <button
                  key={s}
                  onClick={() => setSeverity(s === severity ? '' : s)}
                  className={`text-[10px] px-2 py-1 rounded-full border capitalize transition-colors ${severity === s ? (s === 'critical' || s === 'high' ? 'bg-red-500 text-white border-red-500' : s === 'medium' ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-500 text-white border-slate-500') : 'border-slate-200 text-slate-600'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Notes */}
          <textarea
            className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            rows={2}
            placeholder="Notes about this item…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <Button size="sm" className="h-7 text-xs bg-primary text-white" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}Save
          </Button>
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, items, onSelect, isSelected }) {
  const total = items.length;
  const tested = items.filter(i => i.status === 'tested').length;
  const issues = items.filter(i => i.status === 'issue_found').length;
  const qc = useQueryClient();

  const setSessionStatus = async (status) => {
    await base44.entities.CoachTestingSession.update(session.id, { status });
    qc.invalidateQueries({ queryKey: ['testing-sessions'] });
  };

  return (
    <div
      className={`p-4 rounded-xl border cursor-pointer transition-colors ${isSelected ? 'border-primary/40 bg-primary/5' : 'border-slate-200 bg-white hover:border-primary/20'}`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-900">{session.tester_name}</div>
          {session.tester_role && <div className="text-[11px] text-slate-500">{session.tester_role}</div>}
          {session.testing_date && <div className="text-[10px] text-slate-400 mt-0.5">{format(new Date(session.testing_date), 'dd MMM yyyy')}</div>}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${SESSION_STATUS_STYLE[session.status] || SESSION_STATUS_STYLE.planned}`}>
            {session.status.replace('_', ' ')}
          </span>
          {session.overall_rating && <StarDisplay value={session.overall_rating} />}
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
        <span className="text-green-600 font-medium">{tested} tested</span>
        {issues > 0 && <span className="text-red-500 font-medium">{issues} issues</span>}
        <span className="text-slate-400">{total - tested - issues} remaining</span>
      </div>
      {/* Quick status change */}
      {isSelected && (
        <div className="flex gap-1.5 mt-2 flex-wrap" onClick={e => e.stopPropagation()}>
          {['planned','in_progress','completed'].map(s => (
            <button key={s} onClick={() => setSessionStatus(s)}
              className={`text-[10px] px-2 py-0.5 rounded-full border capitalize transition-colors ${session.status === s ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:border-primary/40'}`}>
              {s.replace('_',' ')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RatingsForm({ session }) {
  const qc = useQueryClient();
  const [ratings, setRatings] = useState({
    overall_rating: session.overall_rating || 0,
    ease_of_use_rating: session.ease_of_use_rating || 0,
    professional_look_rating: session.professional_look_rating || 0,
    ai_trust_rating: session.ai_trust_rating || 0,
    report_quality_rating: session.report_quality_rating || 0,
  });
  const [notes, setNotes] = useState(session.notes || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await base44.entities.CoachTestingSession.update(session.id, {
      ...ratings,
      notes: notes || undefined,
    });
    setSaving(false);
    qc.invalidateQueries({ queryKey: ['testing-sessions'] });
  };

  const RATING_FIELDS = [
    { key: 'overall_rating',           label: 'Overall' },
    { key: 'ease_of_use_rating',       label: 'Ease of use' },
    { key: 'professional_look_rating', label: 'Professional look' },
    { key: 'ai_trust_rating',          label: 'AI trust' },
    { key: 'report_quality_rating',    label: 'Report quality' },
  ];

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
      <div className="text-xs font-semibold text-slate-700 mb-2">Post-session ratings</div>
      {RATING_FIELDS.map(f => (
        <div key={f.key} className="flex items-center gap-3">
          <span className="text-[11px] text-slate-600 w-36 flex-shrink-0">{f.label}</span>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(n => (
              <button key={n} type="button" onClick={() => setRatings(r => ({ ...r, [f.key]: n === r[f.key] ? 0 : n }))}
                className={`transition-colors ${n <= ratings[f.key] ? 'text-amber-400' : 'text-slate-200 hover:text-amber-300'}`}>
                <Star className="w-4 h-4 fill-current" />
              </button>
            ))}
          </div>
        </div>
      ))}
      <textarea className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none" rows={2} placeholder="Session notes…" value={notes} onChange={e => setNotes(e.target.value)} />
      <Button size="sm" className="h-7 text-xs bg-primary text-white" onClick={save} disabled={saving}>
        {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null} Save Ratings
      </Button>
    </div>
  );
}

export default function ChecklistTab() {
  const { club } = useClubContext();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['testing-sessions', club?.id],
    queryFn: () => base44.entities.CoachTestingSession.filter({ club_id: club.id }, '-created_date', 20),
    enabled: !!club?.id,
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ['testing-items', club?.id],
    queryFn: () => base44.entities.CoachTestingItem.filter({ club_id: club.id }, 'checklist_key', 100),
    enabled: !!club?.id,
  });

  const selected = sessions.find(s => s.id === selectedId) || sessions[0];
  const sessionItems = allItems.filter(i => i.testing_session_id === selected?.id);

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</div>
        <Button size="sm" className="h-8 text-xs bg-primary text-white" onClick={() => setShowNew(true)}>
          <Plus className="w-3 h-3 mr-1" /> New Test Session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-500 text-sm">
          No sessions yet. Create your first test session to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Session list */}
          <div className="space-y-2">
            {sessions.map(s => (
              <SessionCard
                key={s.id}
                session={s}
                items={allItems.filter(i => i.testing_session_id === s.id)}
                isSelected={s.id === (selected?.id)}
                onSelect={() => setSelectedId(s.id)}
              />
            ))}
          </div>

          {/* Checklist */}
          {selected && (
            <div className="md:col-span-2 space-y-3">
              <div className="text-xs font-semibold text-slate-700">Checklist — {selected.tester_name}</div>
              {sessionItems.length === 0 ? (
                <div className="text-xs text-slate-500 p-4 text-center border border-dashed rounded-lg">No checklist items yet.</div>
              ) : (
                <div className="space-y-1.5">
                  {sessionItems.map(item => <ChecklistItem key={item.id} item={item} />)}
                </div>
              )}
              <RatingsForm session={selected} />
            </div>
          )}
        </div>
      )}

      {showNew && (
        <TestSessionModal
          onClose={() => setShowNew(false)}
          onCreated={(s) => { setSelectedId(s.id); qc.invalidateQueries({ queryKey: ['testing-sessions'] }); qc.invalidateQueries({ queryKey: ['testing-items'] }); }}
        />
      )}
    </div>
  );
}
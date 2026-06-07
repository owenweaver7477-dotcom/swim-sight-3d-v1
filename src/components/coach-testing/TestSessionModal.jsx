import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useClubContext } from '@/lib/useClubContext';

const DEFAULT_CHECKLIST = [
  { key: 'create_club',         label: 'Create/join club',                         route: '/club-onboarding' },
  { key: 'add_swimmer',         label: 'Add swimmer',                               route: '/swimmers' },
  { key: 'upload_video',        label: 'Upload video',                              route: '/analyse' },
  { key: 'send_ai_review',      label: 'Send for AI Review',                        route: '/analyse' },
  { key: 'ai_reliability',      label: 'Interpret AI reliability label',            route: '/ai-reviews' },
  { key: 'manual_fallback',     label: 'Continue manual review if AI unreliable',   route: '/ai-review' },
  { key: 'approve_finding',     label: 'Approve / edit / reject finding',           route: '/ai-review' },
  { key: 'manual_finding',      label: 'Add manual finding',                        route: '/ai-review' },
  { key: 'add_annotation',      label: 'Add annotation',                            route: '/ai-review' },
  { key: 'add_drag_risk',       label: 'Add drag-risk item',                        route: '/ai-review' },
  { key: 'link_drill',          label: 'Link drill',                                route: '/ai-review' },
  { key: 'link_standard',       label: 'Link technical standard',                   route: '/ai-review' },
  { key: 'finalise_report',     label: 'Finalise report',                           route: '/ai-review' },
  { key: 'export_pdf',          label: 'Export PDF',                                route: '/ai-review' },
  { key: 'create_share_link',   label: 'Create shared report link',                 route: '/ai-review' },
  { key: 'open_shared_report',  label: 'Open shared report as public viewer',       route: '/shared-report' },
  { key: 'swimmer_profile',     label: 'Check swimmer profile',                     route: '/swimmers' },
  { key: 'performance_hub',     label: 'Check Performance Hub',                     route: '/performance' },
  { key: 'drill_library',       label: 'Check Drill Library',                       route: '/drill-library' },
  { key: 'club_settings',       label: 'Check Club Settings / Invites',             route: '/club-settings' },
];

export default function TestSessionModal({ onClose, onCreated }) {
  const { club } = useClubContext();
  const [form, setForm] = useState({ tester_name: '', tester_role: '', testing_date: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tester_name.trim() || saving || submitted) return;
    setSaving(true);
    setSubmitted(true);
    const user = await base44.auth.me();
    const session = await base44.entities.CoachTestingSession.create({
      club_id: club.id,
      tester_name: form.tester_name,
      tester_role: form.tester_role || undefined,
      testing_date: form.testing_date || undefined,
      notes: form.notes || undefined,
      status: 'planned',
      created_by: user?.id,
    });
    // Create default checklist items
    await base44.entities.CoachTestingItem.bulkCreate(
      DEFAULT_CHECKLIST.map(item => ({
        testing_session_id: session.id,
        club_id: club.id,
        checklist_key: item.key,
        label: item.label,
        route: item.route,
        status: 'not_started',
      }))
    );
    setSaving(false);
    if (onCreated) onCreated(session);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm font-bold text-slate-900">New Test Session</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Tester Name <span className="text-red-400">*</span></label>
            <input className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Coach name…" value={form.tester_name} onChange={e => set('tester_name', e.target.value)} required />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Role</label>
            <input className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. Head Coach, Assistant Coach…" value={form.tester_role} onChange={e => set('tester_role', e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Testing Date</label>
            <input type="date" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary" value={form.testing_date} onChange={e => set('testing_date', e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Notes</label>
            <textarea className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none" rows={2} placeholder="Context or observations…" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          <p className="text-[10px] text-slate-400">20 default checklist items will be created automatically.</p>
          <div className="flex gap-2 justify-end">
            <Button size="sm" type="button" variant="outline" className="h-8 text-xs" onClick={onClose}>Cancel</Button>
            <Button size="sm" type="submit" className="h-8 text-xs bg-primary text-white" disabled={saving || !form.tester_name.trim()}>
              {saving ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Creating…</> : 'Create Session'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
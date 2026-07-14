import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useClubContext } from '@/lib/useClubContext';
import entities from '@/lib/data/entities';
import { supabase } from '@/lib/supabaseClient';
import PortalLayout from '@/components/portal/PortalLayout';
import PrintableReport from '@/components/reports/PrintableReport';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Target, FileText, ArrowLeft, Check, Clock, ImageUp, ShieldCheck, User } from 'lucide-react';

const PHOTO_BUCKET = 'swimmer-photos';
const isFinalised = (r) => ['finalised', 'finalized', 'complete', 'completed', 'shared'].includes(String(r?.status || '').toLowerCase()) || !!r?.finalised_at || !!r?.shared_at;

// Compact goal-times editor (event -> target time) over the jsonb value.
function GoalTimes({ value = {}, editable, onChange }) {
  const entries = Object.entries(value || {});
  if (!editable) {
    if (!entries.length) return <p className="text-sm text-muted-foreground">No goal times set yet.</p>;
    return (
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([ev, t]) => (
          <span key={ev} className="rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs">
            <span className="text-muted-foreground">{ev}</span> <span className="font-mono font-semibold">{t}</span>
          </span>
        ))}
      </div>
    );
  }
  const setRow = (i, field, v) => {
    const next = entries.map((e) => [...e]);
    next[i][field === 'event' ? 0 : 1] = v;
    onChange(Object.fromEntries(next.filter(([k]) => k.trim())));
  };
  return (
    <div className="space-y-1.5">
      {entries.map(([ev, t], i) => (
        <div key={i} className="flex items-center gap-2">
          <Input value={ev} onChange={(e) => setRow(i, 'event', e.target.value)} placeholder="Event" className="h-8 flex-1 text-xs" />
          <Input value={t} onChange={(e) => setRow(i, 'time', e.target.value)} placeholder="Target" className="h-8 w-28 text-xs" />
          <button type="button" onClick={() => { const n = { ...value }; delete n[ev]; onChange(n); }} className="px-1 text-xs text-muted-foreground hover:text-destructive">✕</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange({ ...(value || {}), '': '' })} className="text-[11px] font-semibold text-primary hover:underline">+ Add goal time</button>
    </div>
  );
}

// A single report rendered read-only for the swimmer/parent, with its PDF button.
function PortalReportView({ report, club, swimmer, onBack }) {
  const { data: findings = [] } = useQuery({ queryKey: ['portal-findings', report.id], queryFn: () => entities.Finding.filter({ report_id: report.id }, '-created_date', 100) });
  const { data: annotations = [] } = useQuery({ queryKey: ['portal-annos', report.id], queryFn: () => entities.VideoAnnotation.filter({ report_id: report.id }, 'timestamp_seconds', 100) });
  return (
    <div>
      <button className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground" onClick={onBack}>
        <ArrowLeft className="h-3.5 w-3.5" /> Back to my reports
      </button>
      <div id="printable-report-area">
        <PrintableReport report={report} swimmer={swimmer} club={club} findings={findings} annotations={annotations} showPrintButton isManualReview />
      </div>
    </div>
  );
}

export default function SwimmerPortal() {
  const { club } = useClubContext();
  const queryClient = useQueryClient();
  const role = club?._memberRole;
  const isParent = role === 'parent';
  const isSwimmer = role === 'swimmer';
  const swimmerId = club?.linked_swimmer_id;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ goal_times: {}, goal_short_term: '', goal_long_term: '', strengths: '', weaknesses: '' });
  const [openReport, setOpenReport] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: swimmerRows = [], isLoading } = useQuery({
    queryKey: ['portal-swimmer', swimmerId],
    queryFn: () => entities.Swimmer.filter({ id: swimmerId }),
    enabled: !!swimmerId,
  });
  const swimmer = swimmerRows[0] || null;

  const { data: reports = [] } = useQuery({
    queryKey: ['portal-reports', swimmerId],
    queryFn: () => entities.Report.filter({ swimmer_id: swimmerId }, '-created_date', 100),
    enabled: !!swimmerId,
  });
  const visibleReports = reports.filter(isFinalised);

  // Load a signed URL for the private photo (swimmer + parent can read their own).
  useEffect(() => {
    let cancelled = false;
    if (!swimmer?.photo_url) { setPhotoUrl(''); return () => { cancelled = true; }; }
    supabase.storage.from(PHOTO_BUCKET).createSignedUrl(swimmer.photo_url, 600).then(({ data }) => {
      if (!cancelled) setPhotoUrl(data?.signedUrl || '');
    });
    return () => { cancelled = true; };
  }, [swimmer?.photo_url]);

  const startEdit = () => {
    setForm({
      goal_times: swimmer?.goal_times && typeof swimmer.goal_times === 'object' ? swimmer.goal_times : {},
      goal_short_term: swimmer?.goal_short_term || '',
      goal_long_term: swimmer?.goal_long_term || '',
      strengths: swimmer?.strengths || '',
      weaknesses: swimmer?.weaknesses || '',
    });
    setEditing(true);
  };

  const saveProfile = useMutation({
    mutationFn: () => supabase.rpc('update_my_swimmer_profile', {
      p_swimmer_id: swimmerId,
      p_goal_times: form.goal_times,
      p_goal_short_term: form.goal_short_term,
      p_goal_long_term: form.goal_long_term,
      p_strengths: form.strengths,
      p_weaknesses: form.weaknesses,
    }).then(({ error }) => { if (error) throw error; }),
    onSuccess: () => { setEditing(false); queryClient.invalidateQueries({ queryKey: ['portal-swimmer', swimmerId] }); },
  });

  const approvePhoto = useMutation({
    mutationFn: (approved) => supabase.rpc('set_swimmer_photo_approval', { p_swimmer_id: swimmerId, p_approved: approved }).then(({ error }) => { if (error) throw error; }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portal-swimmer', swimmerId] }),
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !club?.id || !swimmerId) return;
    setUploading(true);
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${club.id}/${swimmerId}/photo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, { upsert: true, contentType: file.type || undefined });
      if (upErr) throw upErr;
      const { error: rpcErr } = await supabase.rpc('update_my_swimmer_profile', { p_swimmer_id: swimmerId, p_photo_url: path });
      if (rpcErr) throw rpcErr;
      queryClient.invalidateQueries({ queryKey: ['portal-swimmer', swimmerId] });
    } catch (err) {
      console.warn('Photo upload failed', err?.message || err);
    } finally {
      setUploading(false);
    }
  };

  if (!swimmerId) {
    return (
      <PortalLayout>
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <User className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <div className="text-sm font-semibold">Portal not linked yet</div>
          <p className="mt-1 text-xs text-muted-foreground">Your account isn&apos;t linked to a swimmer yet. Your coach can connect it from their swimmer list.</p>
        </div>
      </PortalLayout>
    );
  }

  if (openReport) {
    return <PortalLayout><PortalReportView report={openReport} club={club} swimmer={swimmer} onBack={() => setOpenReport(null)} /></PortalLayout>;
  }

  const photoApproved = swimmer?.photo_approved_by_parent;

  return (
    <PortalLayout>
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-5">
          {/* Profile header */}
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
            <div className="relative">
              {photoUrl ? (
                <img src={photoUrl} alt="" className="h-16 w-16 rounded-2xl border border-border object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"><User className="h-7 w-7 text-primary" /></div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-bold">{swimmer?.name || `${swimmer?.first_name || ''} ${swimmer?.last_name || ''}`.trim() || 'Swimmer'}</h1>
              <p className="text-xs text-muted-foreground">{isParent ? 'Parent view' : 'Your swimmer profile'}</p>
              {swimmer?.photo_url && (
                <span className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${photoApproved ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  {photoApproved ? <><Check className="h-3 w-3" /> Photo approved</> : <><Clock className="h-3 w-3" /> Photo pending parent approval</>}
                </span>
              )}
            </div>
          </div>

          {/* Photo controls: swimmer uploads, parent approves */}
          {isSwimmer && (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card p-3 text-xs font-semibold text-muted-foreground hover:text-foreground">
              <ImageUp className="h-4 w-4" /> {uploading ? 'Uploading…' : swimmer?.photo_url ? 'Change photo' : 'Upload a profile photo (optional)'}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          )}
          {isParent && swimmer?.photo_url && !photoApproved && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
              <div className="flex items-center gap-2 text-xs text-foreground"><ShieldCheck className="h-4 w-4 text-amber-500" /> Approve this profile photo for {swimmer?.first_name}?</div>
              <Button size="sm" className="h-8 text-xs" onClick={() => approvePhoto.mutate(true)} disabled={approvePhoto.isPending}>Approve</Button>
            </div>
          )}
          {isParent && swimmer?.photo_url && photoApproved && (
            <button className="text-[11px] text-muted-foreground hover:text-destructive" onClick={() => approvePhoto.mutate(false)}>Revoke photo approval</button>
          )}

          {/* Goals & profile */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold"><Target className="h-4 w-4 text-primary" /> Goals &amp; profile</div>
              {isSwimmer && !editing && <Button size="sm" variant="outline" className="h-8 text-xs" onClick={startEdit}>Edit</Button>}
            </div>

            {editing ? (
              <div className="space-y-3">
                <div><Label className="text-xs text-muted-foreground">Goal times</Label><div className="mt-1"><GoalTimes value={form.goal_times} editable onChange={(g) => setForm((p) => ({ ...p, goal_times: g }))} /></div></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Short-term goal</Label><Input value={form.goal_short_term} onChange={(e) => setForm((p) => ({ ...p, goal_short_term: e.target.value }))} className="mt-1" /></div>
                  <div><Label className="text-xs text-muted-foreground">Long-term goal</Label><Input value={form.goal_long_term} onChange={(e) => setForm((p) => ({ ...p, goal_long_term: e.target.value }))} className="mt-1" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Strengths</Label><Textarea value={form.strengths} onChange={(e) => setForm((p) => ({ ...p, strengths: e.target.value }))} rows={2} className="mt-1" /></div>
                  <div><Label className="text-xs text-muted-foreground">Areas to work on</Label><Textarea value={form.weaknesses} onChange={(e) => setForm((p) => ({ ...p, weaknesses: e.target.value }))} rows={2} className="mt-1" /></div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-8 text-xs" onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>{saveProfile.isPending ? 'Saving…' : 'Save'}</Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div><div className="mb-1.5 text-xs font-semibold">Goal times</div><GoalTimes value={swimmer?.goal_times} editable={false} /></div>
                {(swimmer?.goal_short_term || swimmer?.goal_long_term) && (
                  <div className="grid grid-cols-2 gap-3">
                    {swimmer?.goal_short_term && <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Short-term</div><p className="text-sm">{swimmer.goal_short_term}</p></div>}
                    {swimmer?.goal_long_term && <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Long-term</div><p className="text-sm">{swimmer.goal_long_term}</p></div>}
                  </div>
                )}
                {(swimmer?.strengths || swimmer?.weaknesses) && (
                  <div className="grid grid-cols-2 gap-3">
                    {swimmer?.strengths && <div><div className="text-[10px] uppercase tracking-wider text-emerald-500">Strengths</div><p className="whitespace-pre-line text-sm">{swimmer.strengths}</p></div>}
                    {swimmer?.weaknesses && <div><div className="text-[10px] uppercase tracking-wider text-amber-500">Areas to work on</div><p className="whitespace-pre-line text-sm">{swimmer.weaknesses}</p></div>}
                  </div>
                )}
                {!swimmer?.goal_short_term && !swimmer?.goal_long_term && !swimmer?.strengths && !swimmer?.weaknesses && Object.keys(swimmer?.goal_times || {}).length === 0 && (
                  <p className="text-xs text-muted-foreground">{isSwimmer ? 'Add your goals and strengths with Edit.' : 'No goals set yet.'}</p>
                )}
              </div>
            )}
          </div>

          {/* Reports */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold"><FileText className="h-4 w-4 text-primary" /> My reports</div>
            {visibleReports.length === 0 ? (
              <p className="text-xs text-muted-foreground">No shared reports yet. Your coach&apos;s finalised reports will appear here.</p>
            ) : (
              <div className="space-y-2">
                {visibleReports.map((r) => (
                  <button key={r.id} onClick={() => setOpenReport(r)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background p-3 text-left transition-colors hover:border-primary/40">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{r.title || r.stroke_type || 'Coach review'}</div>
                      <div className="text-[11px] text-muted-foreground">{new Date(r.created_date || r.created_at).toLocaleDateString()}</div>
                    </div>
                    <span className="flex-shrink-0 text-xs font-semibold text-primary">View →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PortalLayout>
  );
}

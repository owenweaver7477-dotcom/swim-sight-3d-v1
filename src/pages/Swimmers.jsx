import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import entities from '@/lib/data/entities';
import { setReviewSession } from '@/lib/swimState';
import { useClubContext } from '@/lib/useClubContext';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/shared/PageHeader';
import { Plus, User, Waves, ChevronRight, Video, FileText, Target, Activity, ArrowLeft, Bell, CheckCircle2, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SwimmerProgressAnalytics from '@/components/analytics/SwimmerProgressAnalytics';
import ReportHistoryList from '@/components/analytics/ReportHistoryList';
import { activeCompletedReports, PENDING_STATUSES } from '@/components/analytics/analyticsHelpers';

const MANAGE_SWIMMER_ROLES = ['owner', 'admin', 'coach'];
const EMPTY_FORM = {
  name: '',
  squad_id: '',
  main_strokes: '',
  notes: '',
  swimmer_email: '',
  parent_email: '',
};

export default function Swimmers() {
  const { club, memberRole } = useClubContext();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // swimmer to confirm delete
  const [form, setForm] = useState(EMPTY_FORM);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const canManageSwimmers = MANAGE_SWIMMER_ROLES.includes(memberRole);

  const { data: swimmers = [], isLoading } = useQuery({
    queryKey: ['swimmers', club?.id],
    queryFn: () => entities.Swimmer.filter({ club_id: club.id }, 'last_name', 250),
    enabled: !!club?.id,
  });

  const { data: squads = [] } = useQuery({
    queryKey: ['squads', club?.id],
    queryFn: () => entities.Squad.filter({ club_id: club.id }, 'name', 100),
    enabled: !!club?.id,
  });

  const { data: swimmerReports = [] } = useQuery({
    queryKey: ['reports-for-swimmer', selected?.id],
    queryFn: () => entities.Report.filter({ swimmer_id: selected.id }, '-created_date', 100),
    enabled: !!selected?.id,
  });

  const { data: swimmerFindings = [] } = useQuery({
    queryKey: ['findings-for-swimmer', selected?.id],
    queryFn: () => entities.Finding.filter({ swimmer_id: selected.id }, '-created_date', 500),
    enabled: !!selected?.id,
  });

  const swimmerNotifications = [];

  // Accurate counters — active (non-deleted) reports only
  const activeReports = swimmerReports.filter(r => !r.is_deleted);
  const completedReports = activeCompletedReports(activeReports);
  const pendingReports = activeReports.filter(r => PENDING_STATUSES.includes(r.status));

  const deleteSwimmer = useMutation({
    mutationFn: (id) => entities.Swimmer.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swimmers', club?.id] });
      setDeleteTarget(null);
      if (selected?.id === deleteTarget?.id) setSelected(null);
    },
  });

  const addSwimmer = useMutation({
    mutationFn: (data) => entities.Swimmer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swimmers', club?.id] });
      setOpen(false);
      setForm(EMPTY_FORM);
    },
  });

  const handleStartReview = (swimmer) => {
    setReviewSession(null);
    navigate(`/analyse`);
  };

  if (!club) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="p-10 rounded-xl bg-card border border-border text-center">
          <Waves className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <div className="text-sm font-medium text-foreground mb-1">No club workspace selected</div>
          <p className="text-xs text-muted-foreground mb-4">Create a club workspace to manage your swimmers.</p>
          <Button size="sm" onClick={() => navigate('/club-onboarding')}><Plus className="w-3.5 h-3.5 mr-1" /> Create Club</Button>
        </div>
      </div>
    );
  }

  // Swimmer detail view
  if (selected) {
    const squad = squads.find(sq => sq.id === selected.squad_id);
    const strokes = selected.main_strokes?.split(',').map(s => s.trim()).filter(Boolean) || [];

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6" onClick={() => setSelected(null)}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Swimmers
        </button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Profile Card */}
          <div className="md:col-span-1 p-5 rounded-xl bg-card border border-border">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <User className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">{selected.name}</h2>
            {squad && <div className="text-xs text-muted-foreground mb-2">Squad: {squad.name}</div>}
            {strokes.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {strokes.map(s => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
              </div>
            )}
            {selected.notes && (
              <div className="text-xs text-muted-foreground border-t border-border pt-3 mt-3">{selected.notes}</div>
            )}
            <Button size="sm" className="w-full mt-4 bg-primary text-primary-foreground text-xs" onClick={() => handleStartReview(selected)}>
              <Video className="w-3.5 h-3.5 mr-1" /> Start New Review
            </Button>
          </div>

          {/* Stats */}
          <div className="md:col-span-2 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: FileText, label: 'Total Reports', value: activeReports.length },
                { icon: Activity, label: 'Completed', value: completedReports.length },
                { icon: Target, label: 'In Progress', value: pendingReports.length },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl bg-card border border-border text-center">
                  <div className="text-2xl font-bold text-primary">{s.value}</div>
                  <div className="text-[10px] text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Analytics — full width below */}
        <div className="space-y-4 mt-4">
          <SwimmerProgressAnalytics swimmer={selected} />
          <ReportHistoryList swimmerReports={activeReports} allFindings={swimmerFindings} />

          {/* Notification History */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-primary" />
            <div className="text-xs font-bold text-foreground">Notification History</div>
              <span className="text-[10px] text-muted-foreground ml-auto">{swimmerNotifications.length} total</span>
            </div>
            {swimmerNotifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Notifications are coming later in the Supabase migration. Email details are saved on the swimmer profile.
              </div>
            ) : (
              <div className="space-y-2">
                {swimmerNotifications.map(n => {
                  const date = n.created_date ? new Date(n.created_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' }) : '';
                  const statusCfg = {
                    sent:   { color: 'text-green-700 bg-green-100', icon: CheckCircle2 },
                    read:   { color: 'text-muted-foreground bg-secondary', icon: CheckCircle2 },
                    queued: { color: 'text-blue-700 bg-blue-100', icon: Clock },
                    draft:  { color: 'text-muted-foreground bg-secondary', icon: Clock },
                    failed: { color: 'text-red-700 bg-red-100', icon: AlertCircle },
                  }[n.status] || { color: 'text-muted-foreground bg-secondary', icon: Clock };
                  const Icon = statusCfg.icon;
                  return (
                    <div key={n.id} className="flex items-start gap-3 p-2.5 rounded-lg border border-border bg-secondary/20 text-xs">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">{n.title}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${statusCfg.color}`}>
                          <Icon className="w-2.5 h-2.5" />{n.status}
                        </span>
                        {date && <span className="text-[10px] text-muted-foreground">{date}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
      <PageHeader
        eyebrow={club.name}
        title="Swimmers"
        subtitle={`${swimmers.length} swimmer${swimmers.length !== 1 ? 's' : ''} registered.`}
        action={
          canManageSwimmers ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs"><Plus className="w-3.5 h-3.5 mr-1" /> Add Swimmer</Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle>Add Swimmer</DialogTitle></DialogHeader>
                <form onSubmit={e => { e.preventDefault(); addSwimmer.mutate({ ...form, club_id: club.id, created_by: user?.id }); }} className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" className="bg-secondary border-border mt-1" />
                  </div>
                  {squads.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Squad</Label>
                      <Select value={form.squad_id} onValueChange={v => setForm(p => ({ ...p, squad_id: v }))}>
                        <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Select squad" /></SelectTrigger>
                        <SelectContent>
                          {squads.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-muted-foreground">Main Strokes</Label>
                    <Input value={form.main_strokes} onChange={e => setForm(p => ({ ...p, main_strokes: e.target.value }))} placeholder="e.g. Breaststroke, IM" className="bg-secondary border-border mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Coach Notes</Label>
                    <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Technical notes, injury flags..." className="bg-secondary border-border mt-1" rows={2} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Swimmer Email (optional)</Label>
                    <Input value={form.swimmer_email} onChange={e => setForm(p => ({ ...p, swimmer_email: e.target.value }))} placeholder="swimmer@email.com" className="bg-secondary border-border mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Parent Email (optional)</Label>
                    <Input value={form.parent_email} onChange={e => setForm(p => ({ ...p, parent_email: e.target.value }))} placeholder="parent@email.com" className="bg-secondary border-border mt-1" />
                  </div>
                  <Button type="submit" className="w-full" disabled={!form.name.trim() || addSwimmer.isPending}>
                    {addSwimmer.isPending ? 'Adding...' : 'Add Swimmer'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      {swimmers.length === 0 ? (
        <div className="p-10 rounded-xl bg-card border border-border text-center">
          <Waves className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <div className="text-sm font-medium text-foreground mb-1">No swimmers registered yet</div>
          <p className="text-xs text-muted-foreground mb-4">Build your squad list before reviewing videos.</p>
          {canManageSwimmers && (
            <Button size="sm" onClick={() => setOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Add Swimmer</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {swimmers.map(s => {
            const squad = squads.find(sq => sq.id === s.squad_id);
            const strokes = s.main_strokes?.split(',').map(x => x.trim()).filter(Boolean) || [];
            return (
              <div
                key={s.id}
                className="p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors cursor-pointer group"
                onClick={() => setSelected(s)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground">{s.name}</div>
                    {squad && <div className="text-[10px] text-muted-foreground">{squad.name}</div>}
                  </div>
                  {canManageSwimmers && (
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteTarget(s); }}
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove swimmer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                {strokes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {strokes.map(st => <Badge key={st} variant="secondary" className="text-[10px]">{st}</Badge>)}
                  </div>
                )}
                <Button
                  size="sm"
                  className="w-full h-7 text-xs bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-0 mt-1"
                  onClick={(e) => { e.stopPropagation(); handleStartReview(s); }}
                >
                  <Video className="w-3 h-3 mr-1" /> Start Review
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-sm font-bold text-foreground mb-1">Remove swimmer?</h3>
            <p className="text-xs text-muted-foreground mb-5">
              <span className="font-semibold text-foreground">{deleteTarget.name}</span> will be archived from the active squad list. Their videos and reports stay linked for historical review.
            </p>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={deleteSwimmer.isPending}
                onClick={() => deleteSwimmer.mutate(deleteTarget.id)}
              >
                {deleteSwimmer.isPending ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

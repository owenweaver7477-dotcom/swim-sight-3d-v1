/**
 * NotificationPanel — slide-in panel showing outgoing coach notifications
 * and a bell trigger for the header.
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useClubContext } from '@/lib/useClubContext';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Bell, CheckCircle2, Clock, AlertCircle, Send, X } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  draft:   { label: 'Draft',  color: 'text-muted-foreground bg-secondary',     icon: Clock },
  queued:  { label: 'Queued', color: 'text-blue-700 bg-blue-100',              icon: Clock },
  sent:    { label: 'Sent',   color: 'text-green-700 bg-green-100',            icon: CheckCircle2 },
  failed:  { label: 'Failed', color: 'text-red-700 bg-red-100',               icon: AlertCircle },
  read:    { label: 'Read',   color: 'text-muted-foreground bg-secondary/80',  icon: CheckCircle2 },
};

const TYPE_LABELS = {
  report_ready:  'Report Ready',
  focus_assigned:'Focus Assigned',
  drill_assigned:'Drill Assigned',
  report_shared: 'Report Shared',
  review_required:'Review Required',
};

function NotificationItem({ notif, swimmers, onMarkRead }) {
  const swimmer = swimmers.find(s => s.id === notif.swimmer_id);
  const cfg = STATUS_CONFIG[notif.status] || STATUS_CONFIG.queued;
  const Icon = cfg.icon;
  const date = notif.created_date ? format(new Date(notif.created_date), 'dd MMM') : '';

  return (
    <div className="p-3 rounded-lg border border-border bg-white space-y-1.5 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground truncate">{notif.title}</div>
          {swimmer && <div className="text-[10px] text-muted-foreground">To: {swimmer.name}</div>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${cfg.color}`}>
            <Icon className="w-2.5 h-2.5" />{cfg.label}
          </span>
          {date && <span className="text-[10px] text-muted-foreground">{date}</span>}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{notif.message}</p>
      <div className="flex items-center justify-between">
        {notif.notification_type && (
          <span className="text-[10px] text-primary">{TYPE_LABELS[notif.notification_type] || notif.notification_type}</span>
        )}
        {notif.status === 'sent' && (
          <button
            className="text-[10px] text-muted-foreground hover:text-foreground underline"
            onClick={() => onMarkRead(notif)}
          >
            Mark read
          </button>
        )}
      </div>
    </div>
  );
}

export default function NotificationPanel() {
  const { club } = useClubContext();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications-coach', club?.id],
    queryFn: () => base44.entities.Notification.filter({ club_id: club.id }, '-created_date', 50),
    enabled: !!club?.id,
  });

  const { data: swimmers = [] } = useQuery({
    queryKey: ['swimmers', club?.id],
    queryFn: () => base44.entities.Swimmer.filter({ club_id: club.id }),
    enabled: !!club?.id,
  });

  const markRead = useMutation({
    mutationFn: (n) => base44.entities.Notification.update(n.id, { status: 'read', read_at: new Date().toISOString() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-coach', club?.id] }),
  });

  const unread = notifications.filter(n => ['sent', 'queued'].includes(n.status)).length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors" title="Notifications">
          <Bell className="w-4 h-4 text-muted-foreground" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 bg-background p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
          <SheetTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> Notifications
          </SheetTitle>
          <p className="text-[10px] text-muted-foreground">Outgoing swimmer notifications from this club.</p>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {notifications.length === 0 ? (
            <div className="py-10 text-center">
              <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-30" />
              <div className="text-xs text-muted-foreground">No notifications yet.</div>
              <p className="text-[10px] text-muted-foreground mt-1">Finalise a report and click "Notify Swimmer" to create one.</p>
            </div>
          ) : (
            notifications.map(n => (
              <NotificationItem
                key={n.id}
                notif={n}
                swimmers={swimmers}
                onMarkRead={(n) => markRead.mutate(n)}
              />
            ))
          )}
        </div>
        <div className="px-4 py-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            In-app notifications only. Email sending coming soon.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
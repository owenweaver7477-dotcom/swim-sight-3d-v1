/**
 * NotificationPanel — Supabase-backed delivery log for report sharing.
 * It shows manual copy/prepared actions and future real email sends.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import entities from '@/lib/data/entities';
import { useClubContext } from '@/lib/useClubContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AlertCircle, Bell, CheckCircle2, ClipboardCheck, Clock, Mail } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  prepared: { label: 'Prepared', color: 'text-blue-700 bg-blue-100', icon: ClipboardCheck },
  copied:   { label: 'Copied',   color: 'text-green-700 bg-green-100', icon: CheckCircle2 },
  sent:     { label: 'Sent',     color: 'text-green-700 bg-green-100', icon: Mail },
  failed:   { label: 'Failed',   color: 'text-red-700 bg-red-100', icon: AlertCircle },
  skipped:  { label: 'Skipped',  color: 'text-muted-foreground bg-secondary', icon: Clock },
};

const RECIPIENT_LABELS = {
  swimmer: 'Swimmer',
  parent: 'Parent',
  coach: 'Coach',
  other: 'Manual share',
};

function formatDate(value) {
  if (!value) return '';
  try {
    return format(new Date(value), 'dd MMM');
  } catch {
    return '';
  }
}

function NotificationItem({ log, swimmers }) {
  const swimmer = swimmers.find(item => item.id === log.swimmer_id);
  const cfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.prepared;
  const Icon = cfg.icon;
  const date = formatDate(log.created_date || log.created_at);
  const swimmerName = swimmer?.name || [swimmer?.first_name, swimmer?.last_name].filter(Boolean).join(' ');

  return (
    <div className="p-3 rounded-lg border border-border bg-white space-y-1.5 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground truncate">
            Report delivery {RECIPIENT_LABELS[log.recipient_type] ? `· ${RECIPIENT_LABELS[log.recipient_type]}` : ''}
          </div>
          {swimmerName && <div className="text-[10px] text-muted-foreground truncate">For: {swimmerName}</div>}
          {log.recipient_email && <div className="text-[10px] text-muted-foreground truncate">To: {log.recipient_email}</div>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${cfg.color}`}>
            <Icon className="w-2.5 h-2.5" />{cfg.label}
          </span>
          {date && <span className="text-[10px] text-muted-foreground">{date}</span>}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        {log.delivery_method === 'email'
          ? 'Email delivery log. Email should contain only a secure shared report link.'
          : 'Manual share action. No email was sent by Swim Sight 3D.'}
      </p>
      {log.error_message && <p className="text-[10px] text-red-600">{log.error_message}</p>}
    </div>
  );
}

export default function NotificationPanel() {
  const { club } = useClubContext();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications-coach', club?.id],
    queryFn: async () => {
      try {
        return await entities.NotificationLog.filter({ club_id: club.id }, '-created_date', 50);
      } catch {
        return [];
      }
    },
    enabled: !!club?.id,
  });

  const { data: swimmers = [] } = useQuery({
    queryKey: ['notification-swimmers', club?.id],
    queryFn: () => entities.Swimmer.filter({ club_id: club.id }, 'last_name', 300),
    enabled: !!club?.id,
  });

  const activeCount = notifications.filter(log => ['prepared', 'copied', 'sent', 'failed'].includes(log.status)).length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors" title="Delivery log">
          <Bell className="w-4 h-4 text-muted-foreground" />
          {activeCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
              {activeCount > 9 ? '9+' : activeCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 bg-background p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
          <SheetTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> Delivery Log
          </SheetTitle>
          <p className="text-[10px] text-muted-foreground">Manual shared-report delivery actions for this club.</p>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {notifications.length === 0 ? (
            <div className="py-10 text-center">
              <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-30" />
              <div className="text-xs text-muted-foreground">No delivery logs yet.</div>
              <p className="text-[10px] text-muted-foreground mt-1">Finalise a report, create a shared link, then copy it for swimmer or parent delivery.</p>
            </div>
          ) : (
            notifications.map(log => (
              <NotificationItem key={log.id} log={log} swimmers={swimmers} />
            ))
          )}
        </div>
        <div className="px-4 py-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            Reports are delivered by secure link — copy and send it to the swimmer or parent.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * NotifySwimmerModal — Coach creates + previews a swimmer notification
 * before sending. Sends a real email if swimmer_email or parent_email is set.
 */
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bell, Send, Eye, CheckCircle2, Info, Mail, MessageSquare } from 'lucide-react';

export default function NotifySwimmerModal({ open, onClose, report, swimmer, club, shareLink }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const strokeLabel = report?.title?.replace('AI Technique Report — ', '') || 'your recent session';
  const shareUrl = shareLink ? `${window.location.origin}/shared-report/${shareLink.token}` : null;

  const defaultTitle = 'Your swim technique report is ready';
  const defaultMessage = `Hi ${swimmer?.name || 'there'},\n\nYour coach has completed your technique report for ${strokeLabel}. Please open it to review your key focus areas and assigned drills.\n\n${shareUrl ? `View your report:\n${shareUrl}` : 'Log in to the app to view your full report.'}`;

  const [title, setTitle] = useState(defaultTitle);
  const [message, setMessage] = useState(defaultMessage);
  const [preview, setPreview] = useState(false);
  const [result, setResult] = useState(null); // { emailSent, emailAddress }

  // Who gets the email?
  const recipientEmail = swimmer?.swimmer_email || swimmer?.parent_email || null;
  const hasEmail = !!recipientEmail;

  const sendNotification = useMutation({
    mutationFn: async () => {
      // 1. Create the Notification record
      const notif = await base44.entities.Notification.create({
        club_id: club?.id,
        swimmer_id: swimmer?.id,
        report_id: report?.id,
        recipient_type: 'swimmer',
        recipient_name: swimmer?.name,
        recipient_email: recipientEmail || undefined,
        notification_type: 'report_ready',
        title,
        message,
        status: hasEmail ? 'queued' : 'sent',
        delivery_channel: hasEmail ? 'email_placeholder' : 'in_app',
        created_by: user?.id,
        sent_at: hasEmail ? undefined : new Date().toISOString(),
        action_url: shareLink ? `/shared-report/${shareLink.token}` : `/ai-review?report_id=${report?.id}`,
      });

      // 2. If there's an email, trigger the email send
      if (hasEmail) {
        await base44.functions.invoke('sendSwimmerNotificationEmail', {
          notification_id: notif.id,
        });
      }

      return { emailSent: hasEmail, emailAddress: recipientEmail };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications-coach', club?.id] });
      queryClient.invalidateQueries({ queryKey: ['swimmer-notifications', swimmer?.id] });
      setResult(data);
    },
  });

  if (result) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md bg-white">
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
            <div className="text-sm font-bold text-foreground">Notification Sent</div>
            {result.emailSent ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  An in-app notification was created and an email was sent to{' '}
                  <span className="font-medium text-foreground">{result.emailAddress}</span>.
                </p>
                <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-green-50 border border-green-200 text-left">
                  <Mail className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  <p className="text-[10px] text-green-700">Email delivered successfully.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  An in-app notification has been created for {swimmer?.name}.
                </p>
                <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-left">
                  <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <p className="text-[10px] text-amber-700">
                    No email address on file. Add a swimmer or parent email to the profile to enable email delivery.
                  </p>
                </div>
              </div>
            )}
            <Button size="sm" onClick={onClose} className="w-full">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> Notify Swimmer
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {swimmer && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 border border-border">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                {swimmer.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground">{swimmer.name}</div>
                {hasEmail ? (
                  <div className="flex items-center gap-1 text-[10px] text-green-600">
                    <Mail className="w-2.5 h-2.5" />
                    Email will be sent to {recipientEmail}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MessageSquare className="w-2.5 h-2.5" />
                    In-app only — no email on file
                  </div>
                )}
              </div>
            </div>
          )}

          {!preview ? (
            <>
              <div>
                <Label className="text-xs text-muted-foreground">Subject / Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 text-xs bg-white" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Message</Label>
                <Textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} className="mt-1 text-xs bg-white" />
              </div>
              {!hasEmail && (
                <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                  <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <p className="text-[10px] text-amber-700">
                    To send an email, add a swimmer or parent email address to the swimmer's profile.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 rounded-xl bg-white border border-border space-y-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Preview</div>
              <div className="text-sm font-bold text-foreground">{title}</div>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{message}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => setPreview(v => !v)}
            >
              <Eye className="w-3 h-3 mr-1" />{preview ? 'Edit' : 'Preview'}
            </Button>
            <Button
              size="sm"
              className="flex-1 text-xs bg-primary text-primary-foreground"
              onClick={() => sendNotification.mutate()}
              disabled={!title.trim() || !message.trim() || sendNotification.isPending}
            >
              {hasEmail
                ? <><Mail className="w-3 h-3 mr-1" />{sendNotification.isPending ? 'Sending…' : 'Send & Email'}</>
                : <><Send className="w-3 h-3 mr-1" />{sendNotification.isPending ? 'Sending…' : 'Send Notification'}</>
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
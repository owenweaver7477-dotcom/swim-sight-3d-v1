/**
 * NotifySwimmerModal — manual shared-report delivery helper.
 * Email delivery is intentionally not sent unless a real provider is wired in a
 * future phase. This modal only copies the secure link/message and logs it.
 */
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import functions from '@/lib/data/functions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bell, CheckCircle2, Copy, Eye, Info, Mail, MessageSquare } from 'lucide-react';

export default function NotifySwimmerModal({ open, onClose, report, swimmer, club, shareLink }) {
  const queryClient = useQueryClient();
  const shareUrl = shareLink?.token ? `${window.location.origin}/shared-report/${shareLink.token}` : '';
  const swimmerName = swimmer?.name || [swimmer?.first_name, swimmer?.last_name].filter(Boolean).join(' ') || 'there';
  const recipientEmail = swimmer?.swimmer_email || swimmer?.parent_email || '';
  const recipientType = swimmer?.swimmer_email ? 'swimmer' : swimmer?.parent_email ? 'parent' : 'other';
  const strokeLabel = report?.stroke_type || report?.title || 'your recent session';

  const [title, setTitle] = useState('Your Swim Sight 3D coach report is ready');
  const [message, setMessage] = useState(
    `Hi ${swimmerName},\n\nYour coach has completed your Swim Sight 3D technique report for ${strokeLabel}.\n\nOpen the secure report link:\n${shareUrl || '[Create a shared report link first]'}\n\nAI-assisted evidence supports coach review. Final report content is coach-approved.`
  );
  const [preview, setPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const logDelivery = useMutation({
    mutationFn: (status) => functions.logReportDelivery(report?.id, {
      shared_report_link_id: shareLink?.id,
      swimmer_id: swimmer?.id,
      recipient_email: recipientEmail || null,
      recipient_type: recipientType,
      delivery_method: 'manual_copy',
      status,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-coach', club?.id] });
      queryClient.invalidateQueries({ queryKey: ['notification-logs', report?.id] });
    },
  });

  const copyMessage = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(`${title}\n\n${message}`);
    setCopied(true);
    await logDelivery.mutateAsync('copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> Notify Swimmer / Parent
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 border border-border">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
              {swimmerName?.[0] || 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground">{swimmerName}</div>
              {recipientEmail ? (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Mail className="w-2.5 h-2.5" />
                  Copy message for {recipientEmail}
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <MessageSquare className="w-2.5 h-2.5" />
                  No swimmer or parent email saved
                </div>
              )}
            </div>
          </div>

          {!shareUrl && (
            <div className="flex items-start gap-1.5 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-700">
                Create a secure shared report link before preparing delivery.
              </p>
            </div>
          )}

          {!preview ? (
            <>
              <div>
                <Label className="text-xs text-muted-foreground">Subject / Title</Label>
                <Input value={title} onChange={event => setTitle(event.target.value)} className="mt-1 text-xs bg-white" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Manual Message</Label>
                <Textarea value={message} onChange={event => setMessage(event.target.value)} rows={7} className="mt-1 text-xs bg-white" />
              </div>
            </>
          ) : (
            <div className="p-4 rounded-xl bg-white border border-border space-y-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Preview</div>
              <div className="text-sm font-bold text-foreground">{title}</div>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{message}</p>
            </div>
          )}

          <div className="flex items-start gap-1.5 p-2.5 rounded-lg bg-blue-50 border border-blue-200">
            <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-700">
              Email delivery is not connected yet. Copy this secure-link message and send it manually. Swim Sight 3D will log the manual copy action only.
            </p>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setPreview(value => !value)}>
              <Eye className="w-3 h-3 mr-1" />{preview ? 'Edit' : 'Preview'}
            </Button>
            <Button
              size="sm"
              className="flex-1 text-xs bg-primary text-primary-foreground"
              onClick={copyMessage}
              disabled={!shareUrl || !title.trim() || !message.trim() || logDelivery.isPending}
            >
              {copied ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
              {logDelivery.isPending ? 'Logging...' : copied ? 'Copied' : 'Copy Message'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

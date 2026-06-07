import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Sends a real email notification to a swimmer or parent.
 * Called after a Notification record is created (delivery_channel: email).
 * Payload: { notification_id }
 */
Deno.serve(async (req) => {
  try {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { notification_id } = await req.json();
  if (!notification_id) {
    return Response.json({ error: 'notification_id is required' }, { status: 400 });
  }

  // Load the notification
  const notifications = await base44.asServiceRole.entities.Notification.filter({ id: notification_id });
  if (!notifications || notifications.length === 0) {
    return Response.json({ error: 'Notification not found' }, { status: 404 });
  }
  const notif = notifications[0];

  if (!notif.recipient_email) {
    return Response.json({ error: 'No recipient email on this notification' }, { status: 400 });
  }

  // Send the email via Core integration
  const appOrigin = '';
  const bodyWithLink = notif.action_url
    ? `${notif.message}\n\n${appOrigin}${notif.action_url}`
    : notif.message;

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: notif.recipient_email,
    subject: notif.title,
    body: bodyWithLink,
    from_name: 'Swim Sight 3D',
  });

  // Mark the notification as sent
  await base44.asServiceRole.entities.Notification.update(notif.id, {
    status: 'sent',
    delivery_channel: 'email',
    sent_at: new Date().toISOString(),
  });

  return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
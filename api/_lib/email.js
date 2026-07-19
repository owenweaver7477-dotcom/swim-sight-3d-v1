// Provider-agnostic transactional email — dormant until configured.
//
// Activate by setting two env vars in the deployment (e.g. from a Resend account):
//   EMAIL_API_KEY  — the provider API key
//   EMAIL_FROM     — a verified sender, e.g. "Swim Sight 3D <noreply@your-domain>"
// Optional: APP_BASE_URL (defaults to https://swimsight3d.com) for links in emails.
//
// Uses the Resend REST shape via plain fetch (no npm dependency). It NEVER throws —
// callers treat email as best-effort, so an unconfigured or failing provider can
// never break the flow that triggered it (invites still work by code/link).

const EMAIL_ENDPOINT = 'https://api.resend.com/emails';

export function isEmailConfigured() {
  return Boolean(process.env.EMAIL_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail({ to, subject, html, text }) {
  if (!isEmailConfigured()) {
    return { sent: false, reason: 'not_configured' };
  }
  if (!to || !subject || (!html && !text)) {
    return { sent: false, reason: 'invalid_args' };
  }
  try {
    const response = await fetch(EMAIL_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        ...(html ? { html } : {}),
        ...(text ? { text } : {}),
      }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      return { sent: false, reason: `provider_${response.status}`, detail: detail.slice(0, 300) };
    }
    return { sent: true };
  } catch (error) {
    return { sent: false, reason: 'network_error', detail: error?.message };
  }
}

// Minimal, flat, brand-consistent invite email. Escapes the dynamic bits.
export function inviteEmailHtml({ clubName, joinUrl, code, roleLabel }) {
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return `<!doctype html><html><body style="margin:0;background:#f6f8fb;font-family:Inter,Arial,sans-serif;color:#0b1f33;">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
    <div style="font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#0369a1;">Swim Sight 3D</div>
    <h1 style="margin:12px 0 8px;font-size:22px;line-height:1.25;">You're invited to ${esc(clubName)}</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#40566b;">
      You've been invited to join <strong>${esc(clubName)}</strong> on Swim Sight 3D${roleLabel ? ` as ${esc(roleLabel)}` : ''}. Tap below to join.
    </p>
    <a href="${esc(joinUrl)}" style="display:inline-block;background:#0b1f33;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:8px;">Join the club</a>
    <p style="margin:20px 0 0;font-size:13px;color:#6b7f92;">Or enter this code at swimsight3d.com/join: <strong style="letter-spacing:.1em;">${esc(code)}</strong></p>
    <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">If you weren't expecting this, you can ignore this email.</p>
  </div></body></html>`;
}

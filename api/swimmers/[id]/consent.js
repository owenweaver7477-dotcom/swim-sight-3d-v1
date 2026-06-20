import {
  createServiceClient,
  handleApiError,
  readJsonBody,
  requireClubRole,
  requireUser,
  sendJson,
} from '../../_lib/server.js';

const CONSENT_ROLES = ['owner', 'admin', 'coach'];
const CONSENT_STATUSES = ['none', 'granted', 'withdrawn'];

function cleanOptional(value) {
  const cleaned = String(value || '').trim();
  return cleaned || null;
}

function cleanEmail(value) {
  const email = cleanOptional(value)?.toLowerCase() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error('Enter a valid guardian email address.');
    error.status = 400;
    throw error;
  }
  return email;
}

export default async function handler(req, res) {
  if (!['GET', 'POST', 'PATCH'].includes(req.method)) {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { user } = await requireUser(req);
    const service = createServiceClient();
    const swimmerId = req.query.id;
    const { data: swimmer, error: swimmerError } = await service
      .from('swimmers')
      .select('id,club_id')
      .eq('id', swimmerId)
      .maybeSingle();
    if (swimmerError) throw swimmerError;
    if (!swimmer) return sendJson(res, 404, { error: 'Swimmer not found' });

    await requireClubRole(service, swimmer.club_id, user.id, CONSENT_ROLES);

    if (req.method === 'GET') {
      const { data, error } = await service
        .from('swimmer_consent_records')
        .select('*')
        .eq('club_id', swimmer.club_id)
        .eq('swimmer_id', swimmer.id)
        .maybeSingle();
      if (error) throw error;
      return sendJson(res, 200, {
        consent_record: data || {
          club_id: swimmer.club_id,
          swimmer_id: swimmer.id,
          is_minor: false,
          consent_status: 'none',
        },
      });
    }

    const body = await readJsonBody(req);
    if (typeof body.is_minor !== 'boolean') {
      return sendJson(res, 400, { error: 'is_minor must be true or false' });
    }
    const consentStatus = String(body.consent_status || 'none').toLowerCase();
    if (!CONSENT_STATUSES.includes(consentStatus)) {
      return sendJson(res, 400, { error: 'consent_status must be none, granted, or withdrawn' });
    }

    const guardianName = cleanOptional(body.guardian_name);
    const guardianEmail = cleanEmail(body.guardian_email);
    const consentSource = cleanOptional(body.consent_source);
    if (body.is_minor && consentStatus === 'granted' && (!guardianName || !guardianEmail || !consentSource)) {
      return sendJson(res, 400, {
        error: 'Guardian name, guardian email, and consent source are required before granting consent for a minor.',
      });
    }

    const { data: existing, error: existingError } = await service
      .from('swimmer_consent_records')
      .select('id,created_by,consent_status,consent_granted_at')
      .eq('swimmer_id', swimmer.id)
      .maybeSingle();
    if (existingError) throw existingError;

    const now = new Date().toISOString();
    const record = {
      club_id: swimmer.club_id,
      swimmer_id: swimmer.id,
      is_minor: body.is_minor,
      consent_status: consentStatus,
      guardian_name: guardianName,
      guardian_email: guardianEmail,
      consent_source: consentSource,
      consent_granted_at: consentStatus === 'granted'
        ? existing?.consent_granted_at || now
        : null,
      consent_withdrawn_at: consentStatus === 'withdrawn' ? now : null,
      updated_by: user.id,
    };
    const mutation = existing
      ? service.from('swimmer_consent_records').update(record).eq('id', existing.id)
      : service.from('swimmer_consent_records').insert({ ...record, created_by: user.id });
    const { data, error } = await mutation.select('*').single();
    if (error) throw error;

    return sendJson(res, 200, {
      success: true,
      consent_record: data,
      message: consentStatus === 'granted'
        ? 'Guardian consent recorded. The coach remains responsible for appropriate use of the footage.'
        : 'Consent status updated.',
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}

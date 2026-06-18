const PLAN_KEYS = {
  FREE_DEMO: 'free_demo',
  COACH_STUDIO: 'coach_studio',
  AI_ASSIST: 'ai_assist',
  CLUB_PRO: 'club_pro',
  ELITE_LAB: 'elite_lab',
};

const AI_ALLOWED_PLANS = new Set([
  PLAN_KEYS.AI_ASSIST,
  PLAN_KEYS.CLUB_PRO,
  PLAN_KEYS.ELITE_LAB,
]);

const PLAN_FIELD_NAMES = ['plan_key', 'plan', 'tier', 'subscription_plan', 'billing_plan', 'access_plan'];
const MISSING_TABLE_CODES = new Set(['42P01', 'PGRST205']);

function normalisePlanKey(source) {
  if (!source || typeof source !== 'object') return null;
  for (const field of PLAN_FIELD_NAMES) {
    const value = source[field];
    if (value && Object.values(PLAN_KEYS).includes(value)) return value;
  }
  return null;
}

function isMissingLedger(error) {
  return error && MISSING_TABLE_CODES.has(error.code);
}

export async function getAICreditBalance(service, clubId) {
  const { data, error } = await service
    .from('ai_credit_ledger')
    .select('amount')
    .eq('club_id', clubId);

  if (error) {
    if (isMissingLedger(error)) {
      return { balance: null, ledgerAvailable: false };
    }
    throw error;
  }

  const balance = (data || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  return { balance, ledgerAvailable: true };
}

export async function getClubAIEntitlement(service, { clubId, userId }) {
  const { data: club, error: clubError } = await service
    .from('clubs')
    .select('*')
    .eq('id', clubId)
    .maybeSingle();
  if (clubError) throw clubError;
  if (!club) {
    return {
      allowed: false,
      reason: 'club_not_found',
      message: 'Club workspace was not found.',
      required_plan: PLAN_KEYS.AI_ASSIST,
      manual_review_available: true,
    };
  }

  const { data: profile, error: profileError } = await service
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (profileError) throw profileError;

  const isAppAdmin = profile?.app_role === 'admin';
  const planKey = normalisePlanKey(profile) || normalisePlanKey(club);
  const aiEnabled = club.ai_enabled !== false;
  const pilotAccess = club.ai_pilot_access !== false && profile?.ai_pilot_access !== false;
  const creditMode = club.ai_credit_mode || (pilotAccess ? 'pilot_unlimited' : 'credit_limited');

  if (isAppAdmin) {
    return {
      allowed: true,
      reason: 'app_admin_bypass',
      message: 'AI Review available for app admin.',
      plan_key: planKey || PLAN_KEYS.ELITE_LAB,
      ai_credit_mode: 'admin_unlimited',
      ai_credit_balance: null,
      ledger_available: null,
      credits_required: 0,
      required_plan: PLAN_KEYS.AI_ASSIST,
      manual_review_available: true,
    };
  }

  if (!aiEnabled || creditMode === 'blocked') {
    return {
      allowed: false,
      reason: 'ai_disabled',
      message: 'AI Assist is not enabled for this club. Coach Studio/manual review remains available.',
      plan_key: planKey,
      ai_credit_mode: creditMode,
      ai_credit_balance: null,
      ledger_available: null,
      credits_required: 1,
      required_plan: PLAN_KEYS.AI_ASSIST,
      manual_review_available: true,
    };
  }

  if (pilotAccess && creditMode !== 'credit_limited') {
    return {
      allowed: true,
      reason: 'pilot_unlimited',
      message: 'AI Review available for pilot testing.',
      plan_key: planKey || PLAN_KEYS.AI_ASSIST,
      ai_credit_mode: 'pilot_unlimited',
      ai_credit_balance: null,
      ledger_available: null,
      credits_required: 0,
      required_plan: PLAN_KEYS.AI_ASSIST,
      manual_review_available: true,
    };
  }

  if (planKey && !AI_ALLOWED_PLANS.has(planKey)) {
    return {
      allowed: false,
      reason: 'plan_locked',
      message: 'AI Assist requires the AI Assist plan or higher. Coach Studio/manual review remains available.',
      plan_key: planKey,
      ai_credit_mode: creditMode,
      ai_credit_balance: null,
      ledger_available: null,
      credits_required: 1,
      required_plan: PLAN_KEYS.AI_ASSIST,
      manual_review_available: true,
    };
  }

  if (!planKey && creditMode !== 'credit_limited') {
    return {
      allowed: true,
      reason: 'pilot_fallback_missing_plan',
      message: 'AI Review available while pilot plan enforcement is being prepared.',
      plan_key: PLAN_KEYS.AI_ASSIST,
      ai_credit_mode: 'pilot_unlimited',
      ai_credit_balance: null,
      ledger_available: null,
      credits_required: 0,
      required_plan: PLAN_KEYS.AI_ASSIST,
      manual_review_available: true,
    };
  }

  const { balance, ledgerAvailable } = await getAICreditBalance(service, clubId);
  if (!ledgerAvailable) {
    return {
      allowed: false,
      reason: 'credit_ledger_unavailable',
      message: 'AI credit ledger is not available yet. Coach Studio/manual review remains available.',
      plan_key: planKey,
      ai_credit_mode: creditMode,
      ai_credit_balance: null,
      ledger_available: false,
      credits_required: 1,
      required_plan: PLAN_KEYS.AI_ASSIST,
      manual_review_available: true,
    };
  }

  if (balance < 1) {
    return {
      allowed: false,
      reason: 'insufficient_ai_credits',
      message: 'This club does not have an AI Review credit available. Coach Studio/manual review remains available.',
      plan_key: planKey,
      ai_credit_mode: creditMode,
      ai_credit_balance: balance,
      ledger_available: true,
      credits_required: 1,
      required_plan: PLAN_KEYS.AI_ASSIST,
      manual_review_available: true,
    };
  }

  return {
    allowed: true,
    reason: 'credit_limited_available',
    message: 'AI Review credit available.',
    plan_key: planKey,
    ai_credit_mode: creditMode,
    ai_credit_balance: balance,
    ledger_available: true,
    credits_required: 1,
    required_plan: PLAN_KEYS.AI_ASSIST,
    manual_review_available: true,
  };
}

export function publicEntitlementResponse(entitlement) {
  return {
    allowed: entitlement.allowed === true,
    reason: entitlement.reason,
    message: entitlement.message,
    plan_key: entitlement.plan_key || null,
    ai_credit_mode: entitlement.ai_credit_mode || null,
    ai_credit_balance: entitlement.ai_credit_balance ?? null,
    credits_required: entitlement.credits_required ?? 1,
    required_plan: entitlement.required_plan || PLAN_KEYS.AI_ASSIST,
    manual_review_available: true,
  };
}

export async function consumeAIReviewCredit(service, {
  entitlement,
  clubId,
  userId,
  videoUploadId,
  aiProcessingJobId,
}) {
  if (!entitlement?.allowed) {
    const error = new Error(entitlement?.message || 'AI Review is not allowed for this club.');
    error.status = 402;
    error.entitlement = publicEntitlementResponse(entitlement || {});
    throw error;
  }

  if (entitlement.ai_credit_mode !== 'credit_limited') {
    return { consumed: false, reason: entitlement.reason || 'unlimited_or_pilot' };
  }

  const { data: existing, error: existingError } = await service
    .from('ai_credit_ledger')
    .select('id')
    .eq('ai_processing_job_id', aiProcessingJobId)
    .eq('reason', 'standard_ai_review')
    .lt('amount', 0)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return { consumed: false, reason: 'already_consumed', ledger_id: existing.id };

  const { balance, ledgerAvailable } = await getAICreditBalance(service, clubId);
  if (!ledgerAvailable || balance < 1) {
    const error = new Error('This club does not have an AI Review credit available. Coach Studio/manual review remains available.');
    error.status = 402;
    error.entitlement = {
      ...publicEntitlementResponse(entitlement),
      reason: ledgerAvailable ? 'insufficient_ai_credits' : 'credit_ledger_unavailable',
      ai_credit_balance: balance ?? null,
    };
    throw error;
  }

  const { data, error } = await service
    .from('ai_credit_ledger')
    .insert({
      club_id: clubId,
      user_id: userId,
      video_upload_id: videoUploadId,
      ai_processing_job_id: aiProcessingJobId,
      amount: -1,
      reason: 'standard_ai_review',
      metadata: {
        plan_key: entitlement.plan_key || null,
        ai_credit_mode: entitlement.ai_credit_mode,
        source: 'api/ai/trigger',
      },
    })
    .select('*')
    .single();
  if (error) throw error;

  return { consumed: true, ledger_id: data.id, amount: data.amount };
}

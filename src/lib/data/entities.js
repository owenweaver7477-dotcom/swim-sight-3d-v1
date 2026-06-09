import { supabase } from '@/lib/supabaseClient';
import { getActiveClub } from '@/lib/swimState';

const CREATED_ALIAS = 'created_date';
const UPDATED_ALIAS = 'updated_date';

const entityTables = {
  Club: 'clubs',
  ClubMember: 'club_members',
  ClubInvite: 'club_invites',
  Squad: 'squads',
  Swimmer: 'swimmers',
  VideoUpload: 'video_uploads',
  AIProcessingJob: 'ai_processing_jobs',
  Report: 'reports',
  Finding: 'findings',
  KeyFrame: 'key_frames',
  SharedReportLink: 'shared_report_links',
  Drill: 'drills',
  VideoAnnotation: 'video_annotations',
  TechnicalStandard: 'technical_standards',
  ReferenceProfile: 'reference_profiles',
  ReferenceAsset: 'reference_assets',
  NotificationLog: 'notification_logs',
};

function normaliseOrder(order) {
  if (!order) return { column: 'created_at', ascending: false };
  const descending = order.startsWith('-');
  const rawColumn = descending ? order.slice(1) : order;
  const column = rawColumn === CREATED_ALIAS
    ? 'created_at'
    : rawColumn === UPDATED_ALIAS
    ? 'updated_at'
    : rawColumn;

  return { column, ascending: !descending };
}

function withBase44DateAliases(row) {
  if (!row) return row;
  return {
    ...row,
    created_date: row.created_date || row.created_at,
    updated_date: row.updated_date || row.updated_at,
  };
}

function stripUndefined(data) {
  return Object.fromEntries(
    Object.entries(data || {}).filter(([, value]) => value !== undefined)
  );
}

function splitName(name = '') {
  const [firstName, ...rest] = name.trim().split(/\s+/).filter(Boolean);
  return {
    first_name: firstName || '',
    last_name: rest.join(' '),
  };
}

function mapSwimmerToDb(data) {
  if (!data) return data;
  const { name, squad_id, ...remaining } = data;
  const parsed = splitName(name || '');
  const hasNameInput = Boolean(name || data.first_name !== undefined || data.last_name !== undefined);
  const mapped = {
    ...remaining,
  };

  if (squad_id !== undefined) mapped.squad_id = squad_id || null;

  if (hasNameInput) {
    mapped.first_name = data.first_name || parsed.first_name;
    mapped.last_name = data.last_name ?? parsed.last_name ?? '';
  }

  return mapped;
}

function mapSwimmerFromDb(row) {
  if (!row) return row;
  const name = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
  return withBase44DateAliases({
    ...row,
    name: row.name || name,
    main_strokes: row.main_strokes || '',
  });
}

function mapFindingToDb(data) {
  if (!data) return data;
  const {
    finding_name,
    phase,
    coach_sees,
    cue,
    confidence_score,
    included_in_report,
    timestamp_start,
    timestamp_end,
    evidence_type,
    measurement_summary,
    frame_reference,
    ...remaining
  } = data;
  return {
    ...remaining,
    observation: remaining.observation || coach_sees || finding_name,
    stroke_phase: remaining.stroke_phase || phase,
    correction_cue: remaining.correction_cue || cue,
    ai_confidence: remaining.ai_confidence ?? confidence_score,
    timestamp_seconds: remaining.timestamp_seconds ?? timestamp_start,
  };
}

function mapFindingFromDb(row) {
  if (!row) return row;
  return withBase44DateAliases({
    ...row,
    finding_name: row.finding_name || row.observation,
    phase: row.phase || row.stroke_phase,
    coach_sees: row.coach_sees || row.observation,
    cue: row.cue || row.correction_cue,
    confidence_score: row.confidence_score ?? row.ai_confidence,
    included_in_report: row.included_in_report ?? row.approval_status === 'approved',
    timestamp_start: row.timestamp_start ?? row.timestamp_seconds,
  });
}

function mapReportToDb(data) {
  if (!data) return data;
  const {
    title,
    source,
    ai_completed_at,
    ai_error_message,
    public_share_id,
    ...remaining
  } = data;
  return remaining;
}

function mapReportFromDb(row) {
  if (!row) return row;
  const title = row.title || [row.stroke_type, row.analysis_type].filter(Boolean).join(' ') || 'Coach Report';
  return withBase44DateAliases({
    ...row,
    title,
    source: row.source || 'ai',
    ai_completed_at: row.ai_completed_at || row.finalised_at || row.updated_at || row.created_at,
    ai_error_message: row.ai_error_message || row.technical_summary,
  });
}

function mapVideoUploadToDb(data) {
  if (!data) return data;
  const {
    file_uri,
    file_name,
    file_size,
    uploaded_by_user_id,
    stroke,
    review_goal,
    session_type,
    report_depth,
    primary_focus,
    coach_question,
    injury_or_limitations_note,
    desired_output,
    review_context_completed,
    upload_order,
    pose_visibility_score,
    frame_rate,
    notes,
    ...remaining
  } = data;

  const reviewContextFields = {
    review_goal,
    session_type,
    report_depth,
    primary_focus,
    coach_question,
    injury_or_limitations_note,
    desired_output,
    review_context_completed,
    upload_order,
    pose_visibility_score,
    frame_rate,
    notes,
  };
  const reviewContext = Object.fromEntries(
    Object.entries(reviewContextFields).filter(([, value]) => value !== undefined)
  );

  return {
    ...remaining,
    original_filename: remaining.original_filename || file_name,
    file_size_bytes: remaining.file_size_bytes ?? file_size,
    created_by: remaining.created_by || uploaded_by_user_id,
    stroke_type: remaining.stroke_type || stroke,
    review_context: Object.keys(reviewContext).length
      ? { ...(remaining.review_context || {}), ...reviewContext }
      : remaining.review_context,
  };
}

function mapVideoUploadFromDb(row) {
  if (!row) return row;
  const reviewContext = row.review_context || {};
  return withBase44DateAliases({
    ...row,
    ...reviewContext,
    file_uri: row.file_bucket && row.file_path ? `private://${row.file_bucket}/${row.file_path}` : undefined,
    file_name: row.original_filename,
    file_size: row.file_size_bytes,
    stroke: row.stroke_type,
    uploaded_by_user_id: row.created_by,
  });
}

function getMappers(entityName) {
  if (entityName === 'Swimmer') {
    return { toDb: mapSwimmerToDb, fromDb: mapSwimmerFromDb };
  }
  if (entityName === 'VideoUpload') {
    return { toDb: mapVideoUploadToDb, fromDb: mapVideoUploadFromDb };
  }
  if (entityName === 'Report') {
    return { toDb: mapReportToDb, fromDb: mapReportFromDb };
  }
  if (entityName === 'Finding') {
    return { toDb: mapFindingToDb, fromDb: mapFindingFromDb };
  }
  return { toDb: (data) => data, fromDb: withBase44DateAliases };
}

function currentClubId() {
  return getActiveClub()?.id || null;
}

function isSwimmerEntity(entityName) {
  return entityName === 'Swimmer';
}

function isClubScopedEntity(entityName) {
  return [
    'Squad',
    'Swimmer',
    'VideoUpload',
    'AIProcessingJob',
    'Report',
    'Finding',
    'KeyFrame',
    'SharedReportLink',
    'VideoAnnotation',
    'TechnicalStandard',
    'ReferenceProfile',
    'ReferenceAsset',
    'NotificationLog',
  ].includes(entityName);
}

function isReportEntity(entityName) {
  return entityName === 'Report';
}

function applyEntityDefaults(entityName, data = {}) {
  const cleaned = stripUndefined(data);
  const clubId = cleaned.club_id || (isClubScopedEntity(entityName) ? currentClubId() : null);

  if (isClubScopedEntity(entityName) && clubId) {
    cleaned.club_id = clubId;
  }

  if (isSwimmerEntity(entityName) && cleaned.is_active === undefined) {
    cleaned.is_active = true;
  }

  return cleaned;
}

function applyClubScope(query, entityName, filters = {}) {
  if (!isClubScopedEntity(entityName)) return query;
  const explicitClubId = filters.club_id;
  const activeClubId = currentClubId();

  if (explicitClubId) return query.eq('club_id', explicitClubId);
  if (activeClubId) return query.eq('club_id', activeClubId);
  return query;
}

function applyDefaultActiveScope(query, entityName, filters = {}, options = {}) {
  if (isSwimmerEntity(entityName)) {
    if (options.includeInactive || filters.includeInactive || filters.is_active !== undefined) return query;
    return query.eq('is_active', true);
  }

  if (isReportEntity(entityName)) {
    if (options.includeDeleted || filters.includeDeleted || filters.is_deleted !== undefined) return query;
    return query.eq('is_deleted', false);
  }

  return query;
}

function createEntityAdapter(entityName, tableName) {
  const { toDb, fromDb } = getMappers(entityName);

  return {
    async list(order = '-created_at', limit = 100, options = {}) {
      const { column, ascending } = normaliseOrder(order);
      let query = supabase.from(tableName).select('*').order(column, { ascending });
      query = applyClubScope(query, entityName, {});
      query = applyDefaultActiveScope(query, entityName, {}, options);
      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(fromDb);
    },

    async filter(filters = {}, order = '-created_at', limit = 100, options = {}) {
      const { column, ascending } = normaliseOrder(order);
      let query = supabase.from(tableName).select('*');
      const cleanedFilters = stripUndefined(filters);
      delete cleanedFilters.includeInactive;
      delete cleanedFilters.includeDeleted;

      Object.entries(cleanedFilters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      query = applyClubScope(query, entityName, cleanedFilters);
      query = applyDefaultActiveScope(query, entityName, filters, options);
      query = query.order(column, { ascending });
      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(fromDb);
    },

    async query(filters = {}, order = '-created_at', limit = 100, options = {}) {
      return this.filter(filters, order, limit, options);
    },

    async get(id) {
      let query = supabase.from(tableName).select('*').eq('id', id);
      query = applyClubScope(query, entityName, {});
      const { data, error } = await query.single();
      if (error) throw error;
      return fromDb(data);
    },

    async create(data) {
      const { data: created, error } = await supabase
        .from(tableName)
        .insert(applyEntityDefaults(entityName, toDb(data)))
        .select('*')
        .single();

      if (error) throw error;
      return fromDb(created);
    },

    async update(id, data) {
      let query = supabase
        .from(tableName)
        .update(stripUndefined(toDb(data)))
        .eq('id', id);
      query = applyClubScope(query, entityName, {});
      const { data: updated, error } = await query.select('*').single();

      if (error) throw error;
      return fromDb(updated);
    },

    async delete(id) {
      if (isSwimmerEntity(entityName)) {
        return this.update(id, { is_active: false });
      }
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },

    async softDelete(id) {
      return this.update(id, { is_active: false });
    },

    async bulkCreate(rows = []) {
      const { data, error } = await supabase
        .from(tableName)
        .insert(rows.map((row) => applyEntityDefaults(entityName, toDb(row))))
        .select('*');

      if (error) throw error;
      return (data || []).map(fromDb);
    },
  };
}

export const entities = Object.fromEntries(
  Object.entries(entityTables).map(([entityName, tableName]) => [
    entityName,
    createEntityAdapter(entityName, tableName),
  ])
);

// TODO: Replace Base44 imports page-by-page with this adapter after the API
// routes and auth context are wired. Unsupported advanced entities should stay
// on Base44 until their feature phase is intentionally migrated.

export default entities;

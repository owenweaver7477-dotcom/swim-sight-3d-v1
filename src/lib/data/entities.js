import { supabase } from '@/lib/supabaseClient';

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

function mapSwimmerToDb(data) {
  if (!data?.name) return data;
  const [firstName, ...rest] = data.name.trim().split(/\s+/);
  const { name, main_strokes, notification_preference, can_receive_notifications, ...remaining } = data;
  return {
    ...remaining,
    first_name: data.first_name || firstName || name,
    last_name: data.last_name || rest.join(' '),
    notes: data.notes,
  };
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
  const { finding_name, phase, coach_sees, cue, confidence_score, ...remaining } = data;
  return {
    ...remaining,
    observation: remaining.observation || coach_sees || finding_name,
    stroke_phase: remaining.stroke_phase || phase,
    correction_cue: remaining.correction_cue || cue,
    ai_confidence: remaining.ai_confidence ?? confidence_score,
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
  });
}

function getMappers(entityName) {
  if (entityName === 'Swimmer') {
    return { toDb: mapSwimmerToDb, fromDb: mapSwimmerFromDb };
  }
  if (entityName === 'Finding') {
    return { toDb: mapFindingToDb, fromDb: mapFindingFromDb };
  }
  return { toDb: (data) => data, fromDb: withBase44DateAliases };
}

function createEntityAdapter(entityName, tableName) {
  const { toDb, fromDb } = getMappers(entityName);

  return {
    async list(order = '-created_at', limit = 100) {
      const { column, ascending } = normaliseOrder(order);
      let query = supabase.from(tableName).select('*').order(column, { ascending });
      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(fromDb);
    },

    async filter(filters = {}, order = '-created_at', limit = 100) {
      const { column, ascending } = normaliseOrder(order);
      let query = supabase.from(tableName).select('*');

      Object.entries(stripUndefined(filters)).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      query = query.order(column, { ascending });
      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(fromDb);
    },

    async get(id) {
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
      if (error) throw error;
      return fromDb(data);
    },

    async create(data) {
      const { data: created, error } = await supabase
        .from(tableName)
        .insert(stripUndefined(toDb(data)))
        .select('*')
        .single();

      if (error) throw error;
      return fromDb(created);
    },

    async update(id, data) {
      const { data: updated, error } = await supabase
        .from(tableName)
        .update(stripUndefined(toDb(data)))
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return fromDb(updated);
    },

    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },

    async bulkCreate(rows = []) {
      const { data, error } = await supabase
        .from(tableName)
        .insert(rows.map((row) => stripUndefined(toDb(row))))
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

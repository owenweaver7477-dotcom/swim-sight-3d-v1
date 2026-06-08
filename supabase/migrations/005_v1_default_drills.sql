-- Swim Sight 3D V1 default drill library.
-- The frontend also bundles these defaults so Drill Library works before this
-- migration is applied. This table allows future club-private drills and
-- database-managed shared defaults.

create table if not exists public.drills (
  id text primary key,
  title text not null,
  stroke text not null,
  phase text,
  fault_tags text,
  purpose text,
  coaching_cue text,
  coaching_cues text,
  setup text,
  execution_steps jsonb not null default '[]'::jsonb,
  instructions text,
  common_mistakes text,
  progression text,
  regression text,
  difficulty text not null default 'Intermediate',
  equipment text not null default 'none',
  duration_or_reps text,
  safety_notes text,
  pack_ids text[] not null default '{}',
  visibility text not null default 'shared_default',
  is_default boolean not null default false,
  is_active boolean not null default true,
  club_id uuid references public.clubs(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint drills_visibility_check check (visibility in ('shared_default', 'club_private')),
  constraint drills_difficulty_check check (difficulty in ('Beginner', 'Intermediate', 'Advanced', 'Elite'))
);

create index if not exists drills_club_id_idx on public.drills(club_id);
create index if not exists drills_stroke_idx on public.drills(stroke);
create index if not exists drills_phase_idx on public.drills(phase);
create index if not exists drills_visibility_idx on public.drills(visibility);
create index if not exists drills_pack_ids_idx on public.drills using gin(pack_ids);

drop trigger if exists drills_set_updated_at on public.drills;
create trigger drills_set_updated_at before update on public.drills
for each row execute function public.set_updated_at();

alter table public.drills enable row level security;

drop policy if exists "drills_select_defaults_or_club" on public.drills;
create policy "drills_select_defaults_or_club" on public.drills
for select using (
  visibility = 'shared_default'
  or public.is_app_admin()
  or (club_id is not null and public.is_club_member(club_id))
);

drop policy if exists "drills_manage_club_coaches" on public.drills;
create policy "drills_manage_club_coaches" on public.drills
for all using (
  public.is_app_admin()
  or (
    visibility = 'club_private'
    and club_id is not null
    and public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  )
) with check (
  public.is_app_admin()
  or (
    visibility = 'club_private'
    and club_id is not null
    and public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  )
);

insert into public.drills (
  id, title, stroke, phase, fault_tags, purpose, coaching_cue, coaching_cues,
  setup, execution_steps, instructions, common_mistakes, progression,
  difficulty, equipment, duration_or_reps, safety_notes, pack_ids,
  visibility, is_default, is_active
) values
  (
    'bs-heel-recovery-pause',
    'Heel Recovery Pause Kick',
    'Breaststroke',
    'Kick Recovery',
    'kick timing, heel recovery, early foot turn, breaststroke',
    'Teaches swimmers to bring the heels up before turning the feet out.',
    'Heels first, feet turn last.',
    'Heels first, feet turn last.',
    'Hold the wall or use a kickboard at easy effort.',
    '["Recover heels slowly to the seat.","Pause for one count.","Turn feet out and snap together.","Glide for one beat before repeating."]'::jsonb,
    'Recover heels slowly to the seat. Pause for one count. Turn feet out and snap together. Glide for one beat before repeating.',
    'Turning the feet before the heels rise|Rushing the snap|Letting knees drift wide',
    'Remove the pause and keep the same sequence at normal rhythm.',
    'Beginner',
    'wall or board',
    '4 x 25m easy technique',
    'None.',
    array['breaststroke-kick-timing'],
    'shared_default',
    true,
    true
  ),
  (
    'bs-wall-narrow-kick',
    'Wall Narrow-Knee Kick',
    'Breaststroke',
    'Kick Recovery',
    'wide knees, knee width, narrow kick, breaststroke',
    'Creates visual feedback for knee width during kick recovery.',
    'Knees inside the hips.',
    'Knees inside the hips.',
    'Face the wall with hands on the gutter.',
    '["Set hips close to the surface.","Recover heels without flaring knees.","Watch knee width against the body line.","Snap and squeeze feet together."]'::jsonb,
    'Set hips close to the surface. Recover heels without flaring knees. Watch knee width against the body line. Snap and squeeze feet together.',
    'Knees opening wider than hips|Hips dropping|Pulling knees under the belly',
    'Move from wall to kickboard while keeping the same width.',
    'Beginner',
    'wall',
    '4 x 25m easy technique',
    'None.',
    array['breaststroke-knee-width-control'],
    'shared_default',
    true,
    true
  ),
  (
    'bs-small-pull-breath',
    'Small Pull Breath Drill',
    'Breaststroke',
    'Pull',
    'over-pull, breath timing, breaststroke pull',
    'Prevents the pull from sweeping too wide or too far back.',
    'Small heart shape, quick breath.',
    'Small heart shape, quick breath.',
    'Swim easy breaststroke focusing on arm path only.',
    '["Press out slightly.","Sweep in under the chin.","Breathe as the hands gather.","Shoot hands forward before kicking."]'::jsonb,
    'Press out slightly. Sweep in under the chin. Breathe as the hands gather. Shoot hands forward before kicking.',
    'Pulling past the shoulders|Breathing after the hands recover|Dropping elbows',
    'Add tempo while keeping the pull small.',
    'Intermediate',
    'none',
    '4 x 25m easy technique',
    'None.',
    array['breaststroke-pull-breath-timing'],
    'shared_default',
    true,
    true
  ),
  (
    'fr-streamline-kick',
    'Streamline Flutter Kick',
    'Freestyle',
    'Body Line',
    'body line, sinking hips, high head, freestyle',
    'Builds a long freestyle line without arm timing distractions.',
    'Long neck, ribs quiet, hips high.',
    'Long neck, ribs quiet, hips high.',
    'Push off in streamline and kick easy.',
    '["Lock hands in streamline.","Look down.","Kick small from the hips.","Hold the body line until speed fades."]'::jsonb,
    'Lock hands in streamline. Look down. Kick small from the hips. Hold the body line until speed fades.',
    'Kicking from the knees|Looking forward|Arching the lower back',
    'Add six kicks then one stroke while preserving the line.',
    'Beginner',
    'fins optional',
    '4 x 25m easy technique',
    'None.',
    array['freestyle-body-line', 'streamline-starts-turns'],
    'shared_default',
    true,
    true
  ),
  (
    'fr-front-scull',
    'Front Scull',
    'Freestyle',
    'Catch',
    'catch, feel for water, forearm pressure, freestyle',
    'Builds hand and forearm awareness at the start of the catch.',
    'Feel pressure, do not push down.',
    'Feel pressure, do not push down.',
    'Use a snorkel if available to keep the head quiet.',
    '["Extend arms in front.","Angle fingertips slightly down.","Sweep hands in and out small.","Keep elbows higher than hands."]'::jsonb,
    'Extend arms in front. Angle fingertips slightly down. Sweep hands in and out small. Keep elbows higher than hands.',
    'Large sweeping motions|Dropping elbows|Kicking too hard',
    'Scull for six beats, then swim six strokes.',
    'Intermediate',
    'snorkel optional',
    '4 x 25m easy technique',
    'None.',
    array['freestyle-catch-position'],
    'shared_default',
    true,
    true
  ),
  (
    'fr-one-goggle-breath',
    'One-Goggle Breath',
    'Freestyle',
    'Breathing',
    'breathing, head lift, low breath, freestyle',
    'Keeps the breath low so the head does not lift and sink the hips.',
    'One goggle in, one goggle out.',
    'One goggle in, one goggle out.',
    'Swim easy freestyle breathing every three or four strokes.',
    '["Rotate the head with the body.","Keep one lens in the water.","Return the face before the stroking arm enters.","Keep the lead arm patient."]'::jsonb,
    'Rotate the head with the body. Keep one lens in the water. Return the face before the stroking arm enters. Keep the lead arm patient.',
    'Lifting to breathe|Looking backward|Dropping the lead arm',
    'Use the same breath at moderate pace.',
    'Beginner',
    'none',
    '4 x 25m easy technique',
    'None.',
    array['freestyle-breathing-control'],
    'shared_default',
    true,
    true
  ),
  (
    'bk-hip-lift-kick',
    'Backstroke Hip-Lift Kick',
    'Backstroke',
    'Kick Drive',
    'dropped hips, knee kick, backstroke',
    'Shows the swimmer how to keep hips near the surface while kicking.',
    'Push the belt buckle to the sky.',
    'Push the belt buckle to the sky.',
    'Arms by side or streamlined on back.',
    '["Set the head still.","Lift hips gently toward the surface.","Kick small from the hips.","Keep knees below the surface."]'::jsonb,
    'Set the head still. Lift hips gently toward the surface. Kick small from the hips. Keep knees below the surface.',
    'Bending knees too much|Arching the back|Holding breath',
    'Add single-arm backstroke while keeping hips high.',
    'Beginner',
    'none',
    '4 x 25m easy technique',
    'None.',
    array['backstroke-hip-position'],
    'shared_default',
    true,
    true
  ),
  (
    'fly-body-dolphin',
    'Body Dolphin',
    'Butterfly',
    'Body Line',
    'body wave, dolphin kick, butterfly rhythm',
    'Builds a wave from chest to hips without arm timing.',
    'Chest presses, hips answer.',
    'Chest presses, hips answer.',
    'Arms by side or in streamline with fins if needed.',
    '["Press the chest slightly.","Let hips rise as the wave travels.","Kick from the hips.","Keep the head low."]'::jsonb,
    'Press the chest slightly. Let hips rise as the wave travels. Kick from the hips. Keep the head low.',
    'Kicking only from knees|Diving too deep|Lifting the head',
    'Add one-arm butterfly after body dolphin repeats.',
    'Intermediate',
    'fins optional',
    '4 x 25m easy technique',
    'None.',
    array['butterfly-rhythm-body-wave', 'streamline-starts-turns'],
    'shared_default',
    true,
    true
  ),
  (
    'st-wall-streamline-lock',
    'Wall Streamline Lock',
    'General',
    'Underwater',
    'streamline, push-off, underwater, starts and turns',
    'Builds a tight line before adding kick or breakout timing.',
    'Lock hands, squeeze ears, ribs quiet.',
    'Lock hands, squeeze ears, ribs quiet.',
    'Push off from the wall in streamline.',
    '["Set hands locked before push.","Squeeze ears with upper arms.","Push off and hold line.","Stop before the line loosens."]'::jsonb,
    'Set hands locked before push. Squeeze ears with upper arms. Push off and hold line. Stop before the line loosens.',
    'Hands separating|Head lifted|Fluttering legs immediately',
    'Add three dolphin kicks before breakout.',
    'Beginner',
    'none',
    '4 x 25m easy technique',
    'None.',
    array['streamline-starts-turns'],
    'shared_default',
    true,
    true
  )
on conflict (id) do update set
  title = excluded.title,
  stroke = excluded.stroke,
  phase = excluded.phase,
  fault_tags = excluded.fault_tags,
  purpose = excluded.purpose,
  coaching_cue = excluded.coaching_cue,
  coaching_cues = excluded.coaching_cues,
  setup = excluded.setup,
  execution_steps = excluded.execution_steps,
  instructions = excluded.instructions,
  common_mistakes = excluded.common_mistakes,
  progression = excluded.progression,
  difficulty = excluded.difficulty,
  equipment = excluded.equipment,
  duration_or_reps = excluded.duration_or_reps,
  safety_notes = excluded.safety_notes,
  pack_ids = excluded.pack_ids,
  visibility = excluded.visibility,
  is_default = excluded.is_default,
  is_active = excluded.is_active,
  updated_at = now();

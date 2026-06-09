-- Swim Sight 3D V1 technical standards and reference library.
-- Text/reference metadata only. No copyrighted athlete media or official federation assets are seeded.

create table if not exists public.technical_standards (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  title text not null,
  stroke text not null,
  phase text not null,
  standard_type text not null default 'club_standard',
  technical_goal text,
  key_positions text,
  coach_cues text,
  common_faults text,
  fault_tags text[] not null default '{}'::text[],
  linked_fault_tags text,
  linked_drag_zones text,
  success_criteria text,
  scoring_guidance text,
  difficulty text,
  difficulty_level text,
  visibility text not null default 'club_private',
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reference_profiles (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  name text not null,
  stroke_group text not null,
  event_distance text,
  description text,
  is_default boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reference_assets (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  profile_id uuid references public.reference_profiles(id) on delete set null,
  title text not null,
  stroke text,
  phase text,
  asset_type text not null default 'text_reference',
  file_path text,
  public_url text,
  description text,
  coaching_notes text,
  is_default boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists technical_standards_club_id_idx on public.technical_standards(club_id);
create index if not exists technical_standards_stroke_idx on public.technical_standards(stroke);
create index if not exists technical_standards_phase_idx on public.technical_standards(phase);
create index if not exists technical_standards_visibility_idx on public.technical_standards(visibility);
create index if not exists technical_standards_fault_tags_idx on public.technical_standards using gin(fault_tags);
create index if not exists reference_profiles_club_id_idx on public.reference_profiles(club_id);
create index if not exists reference_assets_club_id_idx on public.reference_assets(club_id);
create index if not exists reference_assets_profile_id_idx on public.reference_assets(profile_id);

drop trigger if exists technical_standards_set_updated_at on public.technical_standards;
create trigger technical_standards_set_updated_at before update on public.technical_standards
for each row execute function public.set_updated_at();

drop trigger if exists reference_profiles_set_updated_at on public.reference_profiles;
create trigger reference_profiles_set_updated_at before update on public.reference_profiles
for each row execute function public.set_updated_at();

drop trigger if exists reference_assets_set_updated_at on public.reference_assets;
create trigger reference_assets_set_updated_at before update on public.reference_assets
for each row execute function public.set_updated_at();

alter table public.technical_standards enable row level security;
alter table public.reference_profiles enable row level security;
alter table public.reference_assets enable row level security;

drop policy if exists "technical_standards_select_defaults_or_members" on public.technical_standards;
create policy "technical_standards_select_defaults_or_members" on public.technical_standards
for select using (
  visibility = 'shared_default'
  or club_id is null
  or public.is_club_member(club_id)
  or public.is_app_admin()
);

drop policy if exists "technical_standards_manage_coaches" on public.technical_standards;
create policy "technical_standards_manage_coaches" on public.technical_standards
for all using (
  club_id is not null and (
    public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
    or public.is_app_admin()
  )
) with check (
  club_id is not null and (
    public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
    or public.is_app_admin()
  )
);

drop policy if exists "reference_profiles_select_defaults_or_members" on public.reference_profiles;
create policy "reference_profiles_select_defaults_or_members" on public.reference_profiles
for select using (
  is_default = true
  or club_id is null
  or public.is_club_member(club_id)
  or public.is_app_admin()
);

drop policy if exists "reference_profiles_manage_coaches" on public.reference_profiles;
create policy "reference_profiles_manage_coaches" on public.reference_profiles
for all using (
  club_id is not null and (
    public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
    or public.is_app_admin()
  )
) with check (
  club_id is not null and (
    public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
    or public.is_app_admin()
  )
);

drop policy if exists "reference_assets_select_defaults_or_members" on public.reference_assets;
create policy "reference_assets_select_defaults_or_members" on public.reference_assets
for select using (
  is_default = true
  or club_id is null
  or public.is_club_member(club_id)
  or public.is_app_admin()
);

drop policy if exists "reference_assets_manage_coaches" on public.reference_assets;
create policy "reference_assets_manage_coaches" on public.reference_assets
for all using (
  club_id is not null and (
    public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
    or public.is_app_admin()
  )
) with check (
  club_id is not null and (
    public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
    or public.is_app_admin()
  )
);

insert into public.technical_standards (
  title, stroke, phase, standard_type, technical_goal, key_positions, coach_cues,
  common_faults, fault_tags, linked_fault_tags, success_criteria, difficulty,
  difficulty_level, visibility, is_default, is_active
) values
('Breaststroke Kick Recovery Standard','Breaststroke','Kick Recovery','default_reference','Heels recover high and narrow while knees stay inside the hip line.','Heels draw toward the glutes; knees stay narrow; feet turn late.','Heels first, narrow knees, turn late.','Wide knees, low heel recovery, early foot turn.',array['wide_knees','heel_recovery','early_foot_turn'],'wide_knees,heel_recovery,early_foot_turn','Coach can see heel-first recovery and reduced knee width.','Competitive','Competitive','shared_default',true,true),
('Breaststroke Kick Drive Standard','Breaststroke','Kick Drive','default_reference','Feet press backward and finish together in a long narrow line.','Late foot turn, backward sole pressure, feet snap together.','Soles back, snap together.','Circular kick, separated feet, short finish.',array['circular_kick','feet_separate','kick_finish'],'circular_kick,feet_separate,kick_finish','Kick path is narrower and finish is together.','Competitive','Competitive','shared_default',true,true),
('Breaststroke Timing Standard','Breaststroke','Timing','default_reference','Pull, breath, kick and glide sequence supports forward momentum.','Head returns before glide; arms recover as legs kick back.','Arms forward, head down, then glide.','Rushed timing, long glide, late head return.',array['timing','glide','late_head_return'],'timing,glide,late_head_return','Sequence is visible and repeatable across cycles.','Competitive','Competitive','shared_default',true,true),
('Freestyle Body Line Standard','Freestyle','Body Line','default_reference','Neutral head and high hips create a long low-resistance line.','Head neutral, hips near surface, kick supports line.','Long line, quiet head, hips high.','High head, sinking hips, broken line.',array['body_line','high_head','sinking_hips'],'body_line,high_head,sinking_hips','Body line stays long through breathing and kicking.','Competitive','Competitive','shared_default',true,true),
('Freestyle Catch Standard','Freestyle','Catch','default_reference','Early catch shape holds water with fingertips down and elbow supported.','Hand enters shoulder-width; forearm sets before pull.','Fingertips down, elbow proud.','Dropped elbow, crossover, pressing down.',array['catch','dropped_elbow','crossover'],'catch,dropped_elbow,crossover','Catch shape improves without crossover.','Competitive','Competitive','shared_default',true,true),
('Freestyle Breathing Standard','Freestyle','Breathing','default_reference','Breath happens through rotation without lifting the head.','One goggle near water, head returns before entry.','One goggle in, one out.','Head lift, late breath, hip drop.',array['breathing','head_lift','hip_drop'],'breathing,head_lift,hip_drop','Breath stays low and body line remains stable.','Competitive','Competitive','shared_default',true,true),
('Backstroke Hip Position Standard','Backstroke','Body Line','default_reference','Hips stay high with a narrow kick and stable head.','Ears in water, hips near surface, kick below body line.','Belly up, hips high.','Dropped hips, knee kick, head movement.',array['backstroke','hips','body_line'],'backstroke,hips,body_line','Hips remain high and kick stays compact.','Competitive','Competitive','shared_default',true,true),
('Butterfly Rhythm Standard','Butterfly','Timing','default_reference','Two-kick rhythm connects entry, catch, breath and recovery.','First kick at entry, second kick at exit; breath returns early.','Kick in, kick out, breathe low.','Late second kick, high breath, flat rhythm.',array['butterfly','timing','second_kick'],'butterfly,timing,second_kick','Two kicks per cycle and low breath are visible.','Competitive','Competitive','shared_default',true,true),
('Streamline and Breakout Standard','General','Underwater','default_reference','Swimmer holds a locked line and breaks out before speed fades.','Hands locked, head between arms, ribs quiet, patient breakout.','Lock the line before you leave the wall.','Loose streamline, early breakout, late breakout.',array['streamline','breakout','underwater'],'streamline,breakout,underwater','Line stays narrow and breakout timing is controlled.','Competitive','Competitive','shared_default',true,true)
on conflict do nothing;

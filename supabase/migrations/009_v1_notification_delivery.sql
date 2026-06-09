-- Swim Sight 3D V1 report delivery log.
-- This records manual copy/prepared delivery actions and future real email sends.
-- It does not store private report content, signed URLs, video paths, or raw AI payloads.

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  swimmer_id uuid references public.swimmers(id) on delete set null,
  shared_report_link_id uuid references public.shared_report_links(id) on delete set null,
  recipient_email text,
  recipient_type text not null default 'other',
  delivery_method text not null default 'manual_copy',
  status text not null default 'prepared',
  error_message text,
  sent_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint notification_logs_recipient_type_check
    check (recipient_type in ('swimmer', 'parent', 'coach', 'other')),
  constraint notification_logs_delivery_method_check
    check (delivery_method in ('manual_copy', 'email')),
  constraint notification_logs_status_check
    check (status in ('prepared', 'copied', 'sent', 'failed', 'skipped'))
);

create index if not exists notification_logs_club_id_idx on public.notification_logs(club_id);
create index if not exists notification_logs_report_id_idx on public.notification_logs(report_id);
create index if not exists notification_logs_swimmer_id_idx on public.notification_logs(swimmer_id);
create index if not exists notification_logs_shared_link_id_idx on public.notification_logs(shared_report_link_id);
create index if not exists notification_logs_created_at_idx on public.notification_logs(created_at);

alter table public.notification_logs enable row level security;

drop policy if exists "notification_logs_select_members" on public.notification_logs;
create policy "notification_logs_select_members" on public.notification_logs
for select using (
  public.is_club_member(club_id)
  or public.is_app_admin()
);

drop policy if exists "notification_logs_insert_coaches" on public.notification_logs;
create policy "notification_logs_insert_coaches" on public.notification_logs
for insert with check (
  public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or public.is_app_admin()
);

drop policy if exists "notification_logs_update_coaches" on public.notification_logs;
create policy "notification_logs_update_coaches" on public.notification_logs
for update using (
  public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or public.is_app_admin()
) with check (
  public.has_club_role(club_id, array['owner', 'admin', 'coach', 'assistant_coach']::public.club_member_role[])
  or public.is_app_admin()
);

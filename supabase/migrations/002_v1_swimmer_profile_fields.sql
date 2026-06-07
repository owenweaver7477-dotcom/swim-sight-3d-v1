alter table public.swimmers
  add column if not exists main_strokes text,
  add column if not exists notification_preference text not null default 'in_app',
  add column if not exists can_receive_notifications boolean not null default false;

alter table public.swimmers
  drop constraint if exists swimmers_notification_preference_check;

alter table public.swimmers
  add constraint swimmers_notification_preference_check
  check (notification_preference in ('none', 'in_app', 'email'));

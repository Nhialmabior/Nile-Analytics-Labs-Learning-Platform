-- Nile Analytics Labs: audited learner access management
-- Apply to staging first. This script is repeatable and intentionally does not
-- grant clients direct access to the audit table or profiles.access_enabled.

begin;

create table if not exists public.learner_access_audit (
  id bigint generated always as identity primary key,
  learner_id uuid not null references public.profiles(id) on delete restrict,
  changed_by uuid not null references public.profiles(id) on delete restrict,
  previous_access_enabled boolean not null,
  new_access_enabled boolean not null,
  reason text not null check (char_length(btrim(reason)) between 3 and 500),
  changed_at timestamptz not null default now(),
  constraint learner_access_audit_state_changed
    check (previous_access_enabled <> new_access_enabled)
);

create index if not exists learner_access_audit_learner_changed_at_idx
  on public.learner_access_audit (learner_id, changed_at desc);

alter table public.learner_access_audit enable row level security;
revoke all on table public.learner_access_audit from public, anon, authenticated, service_role;
revoke all on sequence public.learner_access_audit_id_seq from public, anon, authenticated, service_role;

create or replace function public.set_learner_access(
  p_learner_id uuid,
  p_access_enabled boolean,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_actor_role text;
  v_actor_enabled boolean;
  v_previous boolean;
  v_role text;
  v_reason text := pg_catalog.btrim(coalesce(p_reason, ''));
begin
  if v_actor is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  select p.role, p.access_enabled
    into v_actor_role, v_actor_enabled
  from public.profiles p
  where p.id = v_actor;

  if not found or v_actor_role <> 'admin' or not v_actor_enabled then
    raise exception 'Only an active administrator can change learner access.'
      using errcode = '42501';
  end if;

  if p_learner_id is null or p_access_enabled is null then
    raise exception 'A learner and access status are required.'
      using errcode = '22023';
  end if;

  if p_learner_id = v_actor then
    raise exception 'Administrators cannot change their own access through this operation.'
      using errcode = '42501';
  end if;

  if pg_catalog.char_length(v_reason) < 3 or pg_catalog.char_length(v_reason) > 500 then
    raise exception 'Provide a reason between 3 and 500 characters.'
      using errcode = '22023';
  end if;

  select p.role, p.access_enabled
    into v_role, v_previous
  from public.profiles p
  where p.id = p_learner_id
  for update;

  if not found then
    raise exception 'The learner profile was not found.' using errcode = 'P0002';
  end if;

  if v_role <> 'learner' then
    raise exception 'This operation can only change learner accounts.'
      using errcode = '42501';
  end if;

  if v_previous = p_access_enabled then
    raise exception 'The learner already has that access status.'
      using errcode = '22023';
  end if;

  update public.profiles
    set access_enabled = p_access_enabled
  where id = p_learner_id;

  insert into public.learner_access_audit (
    learner_id, changed_by, previous_access_enabled, new_access_enabled, reason
  ) values (
    p_learner_id, v_actor, v_previous, p_access_enabled, v_reason
  );
end;
$function$;

revoke all on function public.set_learner_access(uuid, boolean, text) from public, anon;
grant execute on function public.set_learner_access(uuid, boolean, text) to authenticated;

commit;

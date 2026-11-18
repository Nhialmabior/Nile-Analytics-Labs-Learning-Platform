-- Read-only administrator RPC for learner access audit history.
-- Run in staging after learner_access_management.sql.
create or replace function public.get_learner_access_audit(p_limit integer default 100)
returns table (
  id bigint,
  learner_id uuid,
  learner_name text,
  changed_by uuid,
  administrator_name text,
  previous_access_enabled boolean,
  new_access_enabled boolean,
  reason text,
  changed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_actor_role text;
  v_actor_enabled boolean;
begin
  if v_actor is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  select p.role, p.access_enabled
    into v_actor_role, v_actor_enabled
  from public.profiles p
  where p.id = v_actor;

  if not found or v_actor_role <> 'admin' or not v_actor_enabled then
    raise exception 'Only an active administrator can view learner access history.'
      using errcode = '42501';
  end if;

  return query
  select
    a.id,
    a.learner_id,
    coalesce(l.full_name, 'Learner account'),
    a.changed_by,
    coalesce(admin.full_name, 'Administrator account'),
    a.previous_access_enabled,
    a.new_access_enabled,
    a.reason,
    a.changed_at
  from public.learner_access_audit a
  join public.profiles l on l.id = a.learner_id
  join public.profiles admin on admin.id = a.changed_by
  order by a.changed_at desc
  limit greatest(1, least(coalesce(p_limit, 100), 200));
end;
$function$;

revoke all on function public.get_learner_access_audit(integer) from public, anon;
grant execute on function public.get_learner_access_audit(integer) to authenticated;

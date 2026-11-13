-- Nile Analytics Labs: learner name synchronization
-- Run in Supabase Dashboard > SQL Editor.
-- This backfills names for existing accounts and keeps new registrations in sync.
-- It never changes an existing account's role.

insert into public.profiles (id, full_name, role)
select
  u.id,
  coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), ''),
  'learner'
from auth.users u
on conflict (id) do update
set full_name = coalesce(
  nullif(trim(excluded.full_name), ''),
  public.profiles.full_name
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), ''),
    'learner'
  )
  on conflict (id) do update
  set full_name = coalesce(
    nullif(trim(excluded.full_name), ''),
    public.profiles.full_name
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Verification: every registered user should have a profile row and name.
select
  u.email,
  p.full_name,
  p.role,
  p.created_at
from auth.users u
left join public.profiles p on p.id = u.id
order by p.created_at desc nulls last;

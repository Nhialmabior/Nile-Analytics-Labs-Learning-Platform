-- Nile Analytics Labs: learner-editable profile fields
-- Run in Supabase Dashboard > SQL Editor.
-- Learners can update only their own profile information.

alter table public.profiles
  add column if not exists phone text not null default '',
  add column if not exists location text not null default '',
  add column if not exists institution text not null default '',
  add column if not exists bio text not null default '';

alter table public.profiles enable row level security;

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Restrict updates to editable fields; role, ID and created_at stay protected.
revoke update on table public.profiles from authenticated;
grant update (full_name, phone, location, institution, bio)
  on table public.profiles to authenticated;

select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
  and column_name in ('full_name', 'phone', 'location', 'institution', 'bio', 'role')
order by column_name;

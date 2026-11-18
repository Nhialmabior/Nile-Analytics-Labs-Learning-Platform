-- Nile Analytics Labs: production Phase 1 security preflight
-- READ ONLY. This file intentionally contains no DDL, DML, GRANT, REVOKE,
-- function execution, or schema changes. Run in the Supabase SQL Editor
-- connected to the intended project and save the results for review.

-- 1. Public tables and RLS posture.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by c.relname;

-- 2. Policies on all public application tables.
select
  schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;

-- 3. Security-definer functions exposed to API roles.
-- Some authenticated execution is intentional for helpers/RPCs, but every
-- such function must enforce authorization internally.
select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname, arguments;

-- 4. Sensitive table privileges. No direct API access should be granted to
-- voucher hashes, usage counters, or the private access-audit table.
select
  table_name, grantee, privilege_type, is_grantable
from information_schema.table_privileges
where table_schema = 'public'
  and table_name in (
    'profiles', 'learner_vouchers', 'learner_access_audit',
    'nile_bot_usage', 'assessment_submissions', 'lesson_progress',
    'quiz_answer_keys'
  )
order by table_name, grantee, privilege_type;

-- 5. Column-level write grants on protected learner and assessment data.
select
  table_name, column_name, grantee, privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name in ('profiles', 'assessment_submissions', 'lesson_progress')
  and grantee in ('anon', 'authenticated', 'PUBLIC')
  and privilege_type in ('INSERT', 'UPDATE')
order by table_name, grantee, privilege_type, column_name;

-- 6. Account state summary only; no names, emails, or identifiers.
select role, access_enabled, count(*) as account_count
from public.profiles
group by role, access_enabled
order by role, access_enabled;

-- 7. Views in public schema. Review whether any view exposes protected rows.
select schemaname, viewname, definition
from pg_views
where schemaname = 'public'
order by viewname;

-- Nile Analytics Labs: read-only Supabase security posture report.
-- Run after applying the setup and security migrations. This script changes nothing.

-- 1. RLS enabled status for application tables.
select n.nspname as schema_name, c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'profiles','courses','course_modules','lessons','enrollments',
    'lesson_progress','assessments','assessment_submissions',
    'quizzes','quiz_questions','quiz_answer_keys','quiz_attempts','quiz_responses'
  )
order by c.relname;

-- 2. Policies on the LMS tables.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles','courses','course_modules','lessons','enrollments',
    'lesson_progress','assessments','assessment_submissions',
    'quizzes','quiz_questions','quiz_answer_keys','quiz_attempts','quiz_responses'
  )
order by tablename, policyname;

-- 3. Column-level insert/update permissions on assessment submissions.
select grantee, column_name, privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'assessment_submissions'
  and grantee in ('anon','authenticated','PUBLIC')
  and privilege_type in ('INSERT','UPDATE')
order by grantee, privilege_type, column_name;

-- 4. Sensitive security-definer functions and whether they are executable by
-- anonymous or authenticated API roles.
select p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef as security_definer,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_admin','submit_quiz_attempt','grade_assessment_submission')
order by p.proname;

-- 5. Supabase Storage buckets and public/private status, if Storage is used.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by name;

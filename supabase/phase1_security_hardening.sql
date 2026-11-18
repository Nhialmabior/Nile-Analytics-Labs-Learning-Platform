-- Nile Analytics Labs: Phase 1 security hardening
-- Review against the live Supabase schema before execution.
-- Apply manually in Supabase SQL Editor only after taking a database backup.
-- This is intentionally a standalone, repeatable hardening script, not yet a
-- Supabase CLI migration: the repository has legacy SQL setup files but no
-- reconciled migration history. Do not run supabase db push until that is fixed.

begin;

-- Enforce the same active-account rule in database authorization as in the UI.
-- A disabled administrator must not retain elevated access through RLS or RPCs.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.access_enabled is true
  );
$function$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;


-- ---------------------------------------------------------------------------
-- 1. Course content: learners must have LMS access and an active enrolment.
-- Administrators retain access to drafts and all course content.
-- ---------------------------------------------------------------------------

drop policy if exists "Visible course modules" on public.course_modules;
create policy "Visible course modules"
on public.course_modules for select to authenticated
using (
  (select public.is_admin())
  or (
    (select public.has_lms_access())
    and exists (
      select 1
      from public.courses c
      join public.enrollments e on e.course_id = c.id
      where c.id = public.course_modules.course_id
        and c.is_published = true
        and e.learner_id = (select auth.uid())
        and e.status in ('active', 'completed')
    )
  )
);

drop policy if exists "Visible lessons" on public.lessons;
create policy "Visible lessons"
on public.lessons for select to authenticated
using (
  (select public.is_admin())
  or (
    (select public.has_lms_access())
    and is_published = true
    and exists (
      select 1
      from public.course_modules m
      join public.courses c on c.id = m.course_id
      join public.enrollments e on e.course_id = c.id
      where m.id = public.lessons.module_id
        and c.is_published = true
        and e.learner_id = (select auth.uid())
        and e.status in ('active', 'completed')
    )
  )
);

-- ---------------------------------------------------------------------------
-- 2. Lesson progress: remove every known permissive learner INSERT policy.
-- PostgreSQL permissive policies are ORed; leaving an older broad policy in
-- place would nullify the stricter policy below.
-- ---------------------------------------------------------------------------

drop policy if exists "Learners record own progress" on public.lesson_progress;
drop policy if exists "Learners record own enrolled published lesson progress" on public.lesson_progress;

create policy "Learners record own enrolled published lesson progress"
on public.lesson_progress for insert to authenticated
with check (
  (select public.has_lms_access())
  and learner_id = (select auth.uid())
  and exists (
    select 1
    from public.lessons l
    join public.course_modules m on m.id = l.module_id
    join public.courses c on c.id = m.course_id
    join public.enrollments e on e.course_id = c.id
    where l.id = lesson_id
      and l.is_published = true
      and c.is_published = true
      and e.learner_id = (select auth.uid())
      and e.status = 'active'
  )
);

-- Restrict learner writes to the two fields the frontend actually inserts.
-- Remove table-level and any legacy column-level write grants first.
revoke insert, update on table public.lesson_progress from authenticated;
revoke insert (id, learner_id, lesson_id, completed_at)
  on table public.lesson_progress from authenticated;
revoke update (id, learner_id, lesson_id, completed_at)
  on table public.lesson_progress from authenticated;
grant insert (learner_id, lesson_id)
  on table public.lesson_progress to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Assessments: only learners actively enrolled in a published course can
-- read published assessments or submit/update their own ungraded work.
-- ---------------------------------------------------------------------------

drop policy if exists "Published assessments visible" on public.assessments;
create policy "Published assessments visible"
on public.assessments for select to authenticated
using (
  (select public.is_admin())
  or (
    (select public.has_lms_access())
    and is_published = true
    and exists (
      select 1
      from public.courses c
      join public.enrollments e on e.course_id = c.id
      where c.id = public.assessments.course_id
        and c.is_published = true
        and e.learner_id = (select auth.uid())
        and e.status in ('active', 'completed')
    )
  )
);

drop policy if exists "Learners read own submissions" on public.assessment_submissions;
create policy "Learners read own submissions"
on public.assessment_submissions for select to authenticated
using (
  (select public.is_admin())
  or (
    (select public.has_lms_access())
    and learner_id = (select auth.uid())
  )
);

drop policy if exists "Learners submit own work" on public.assessment_submissions;
drop policy if exists "Learners submit own enrolled published assessment work" on public.assessment_submissions;
drop policy if exists "Enrolled learners submit published assessment work" on public.assessment_submissions;
create policy "Learners submit own enrolled published assessment work"
on public.assessment_submissions for insert to authenticated
with check (
  (select public.has_lms_access())
  and learner_id = (select auth.uid())
  and exists (
    select 1
    from public.assessments a
    join public.courses c on c.id = a.course_id
    join public.enrollments e on e.course_id = c.id
    where a.id = assessment_id
      and a.is_published = true
      and c.is_published = true
      and e.learner_id = (select auth.uid())
      and e.status = 'active'
  )
);

drop policy if exists "Learners update own ungraded submissions" on public.assessment_submissions;
create policy "Learners update own ungraded submissions"
on public.assessment_submissions for update to authenticated
using (
  (select public.has_lms_access())
  and learner_id = (select auth.uid())
  and graded_at is null
  and exists (
    select 1
    from public.assessments a
    join public.courses c on c.id = a.course_id
    join public.enrollments e on e.course_id = c.id
    where a.id = assessment_id
      and a.is_published = true
      and c.is_published = true
      and e.learner_id = (select auth.uid())
      and e.status = 'active'
  )
)
with check (
  (select public.has_lms_access())
  and learner_id = (select auth.uid())
  and graded_at is null
  and exists (
    select 1
    from public.assessments a
    join public.courses c on c.id = a.course_id
    join public.enrollments e on e.course_id = c.id
    where a.id = assessment_id
      and a.is_published = true
      and c.is_published = true
      and e.learner_id = (select auth.uid())
      and e.status = 'active'
  )
);

-- Remove table-level and legacy column-level INSERT/UPDATE privileges.
-- Learners may write only their submission text and optional resource URL.
revoke insert, update on table public.assessment_submissions from authenticated;
revoke insert (id, assessment_id, learner_id, submission_text, resource_url, score, feedback, submitted_at, graded_at)
  on table public.assessment_submissions from authenticated;
revoke update (id, assessment_id, learner_id, submission_text, resource_url, score, feedback, submitted_at, graded_at)
  on table public.assessment_submissions from authenticated;
grant insert (assessment_id, learner_id, submission_text, resource_url)
  on table public.assessment_submissions to authenticated;
grant update (submission_text, resource_url)
  on table public.assessment_submissions to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Quizzes: hide quiz questions until the learner is enrolled.
-- Correct answer keys remain administrator-only.
-- ---------------------------------------------------------------------------

-- Remove the older enrolment-only policy too: it did not check has_lms_access().
drop policy if exists "Enrolled learners view published course quizzes" on public.quizzes;
drop policy if exists "Learners view published course quizzes" on public.quizzes;
create policy "Learners view published course quizzes"
on public.quizzes for select to authenticated
using (
  (select public.is_admin())
  or (
    (select public.has_lms_access())
    and is_published = true
    and exists (
      select 1
      from public.courses c
      join public.enrollments e on e.course_id = c.id
      where c.id = public.quizzes.course_id
        and c.is_published = true
        and e.learner_id = (select auth.uid())
        and e.status in ('active', 'completed')
    )
  )
);

-- Remove the older enrolment-only policy too: it did not check has_lms_access().
drop policy if exists "Enrolled learners view published quiz questions" on public.quiz_questions;
drop policy if exists "Learners view published quiz questions" on public.quiz_questions;
create policy "Learners view published quiz questions"
on public.quiz_questions for select to authenticated
using (
  (select public.is_admin())
  or (
    (select public.has_lms_access())
    and exists (
      select 1
      from public.quizzes q
      join public.courses c on c.id = q.course_id
      join public.enrollments e on e.course_id = c.id
      where q.id = quiz_id
        and q.is_published = true
        and c.is_published = true
        and e.learner_id = (select auth.uid())
        and e.status in ('active', 'completed')
    )
  )
);

drop policy if exists "Learners read own quiz attempts" on public.quiz_attempts;
create policy "Learners read own quiz attempts"
on public.quiz_attempts for select to authenticated
using (
  (select public.is_admin())
  or (
    (select public.has_lms_access())
    and learner_id = (select auth.uid())
  )
);

drop policy if exists "Learners read own quiz responses" on public.quiz_responses;
create policy "Learners read own quiz responses"
on public.quiz_responses for select to authenticated
using (
  exists (
    select 1
    from public.quiz_attempts a
    where a.id = attempt_id
      and (
        (select public.is_admin())
        or (
          (select public.has_lms_access())
          and a.learner_id = (select auth.uid())
        )
      )
  )
);


-- ---------------------------------------------------------------------------
-- 5. SECURITY DEFINER RPC exposure: keep intended signed-in operations, but
-- do not expose privileged helpers or admin/quiz RPCs to anonymous callers.
-- The auth.users trigger can invoke handle_new_user without client EXECUTE.
-- ---------------------------------------------------------------------------

revoke all on function public.handle_new_user()
  from public, anon, authenticated, service_role;

revoke all on function public.grade_assessment_submission(uuid, numeric, text)
  from public, anon;
grant execute on function public.grade_assessment_submission(uuid, numeric, text)
  to authenticated;

revoke all on function public.is_admin()
  from public, anon;
grant execute on function public.is_admin()
  to authenticated;

revoke all on function public.submit_quiz_attempt(uuid, jsonb)
  from public, anon;
grant execute on function public.submit_quiz_attempt(uuid, jsonb)
  to authenticated;

commit;

-- ---------------------------------------------------------------------------
-- 5. Post-apply verification. Review the result; expected policies should
-- appear once per table/command, with no legacy broad learner write policy.
-- ---------------------------------------------------------------------------

select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'course_modules',
    'lessons',
    'lesson_progress',
    'assessments',
    'assessment_submissions',
    'quizzes',
    'quiz_questions',
    'quiz_attempts',
    'quiz_responses'
  )
order by tablename, cmd, policyname;

select
  table_name,
  column_name,
  privilege_type,
  grantee
from information_schema.column_privileges
where table_schema = 'public'
  and table_name in ('lesson_progress', 'assessment_submissions')
  and grantee = 'authenticated'
  and privilege_type in ('INSERT', 'UPDATE')
order by table_name, privilege_type, column_name;

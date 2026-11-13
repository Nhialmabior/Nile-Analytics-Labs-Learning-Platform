-- Nile Analytics Labs: tighten learner access to course progress and assessments.
-- Run after lms_schema.sql and secure_assessment_grading.sql.

-- A learner may record completion only for a published lesson in a course
-- for which they hold an active enrollment.
drop policy if exists "Learners record own progress" on public.lesson_progress;
create policy "Learners record own enrolled published lesson progress"
  on public.lesson_progress
  for insert to authenticated
  with check (
    learner_id = (select auth.uid())
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

-- A learner may submit work only for a published assessment in a published
-- course in which they are actively enrolled.
drop policy if exists "Learners submit own work" on public.assessment_submissions;
create policy "Enrolled learners submit published assessment work"
  on public.assessment_submissions
  for insert to authenticated
  with check (
    learner_id = (select auth.uid())
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

-- Retain the ungraded-submission update policy, but ensure the learner still
-- owns the row and remains actively enrolled in its course.
drop policy if exists "Learners update own ungraded submissions" on public.assessment_submissions;
create policy "Learners update own ungraded submissions"
  on public.assessment_submissions
  for update to authenticated
  using (
    learner_id = (select auth.uid())
    and graded_at is null
    and exists (
      select 1
      from public.assessments a
      join public.enrollments e on e.course_id = a.course_id
      where a.id = assessment_id
        and e.learner_id = (select auth.uid())
        and e.status = 'active'
    )
  )
  with check (
    learner_id = (select auth.uid())
    and graded_at is null
    and exists (
      select 1
      from public.assessments a
      join public.enrollments e on e.course_id = a.course_id
      where a.id = assessment_id
        and e.learner_id = (select auth.uid())
        and e.status = 'active'
    )
  );

-- Verify the active policies now installed on these tables.
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('lesson_progress', 'assessment_submissions')
order by tablename, policyname;

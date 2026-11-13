-- Nile Analytics Labs: protect assessment marks and enable secure administrator grading.
-- Run after supabase/lms_schema.sql in the Supabase SQL Editor.

-- Learners may submit and revise only their written response and resource link.
-- They cannot set or change scores, feedback, timestamps, learner IDs or assessment IDs.
revoke insert, update on table public.assessment_submissions from authenticated;
-- Clear any previous column-level grants too, so rerunning this migration
-- cannot leave an old permission that exposes grading fields.
revoke insert (id, score, feedback, submitted_at, graded_at)
  on table public.assessment_submissions from authenticated;
revoke update (id, assessment_id, learner_id, score, feedback, submitted_at, graded_at)
  on table public.assessment_submissions from authenticated;

grant insert (assessment_id, learner_id, submission_text, resource_url)
  on table public.assessment_submissions to authenticated;
grant update (submission_text, resource_url)
  on table public.assessment_submissions to authenticated;

-- Grading is performed only through this administrator-checked function.
create or replace function public.grade_assessment_submission(
  p_submission_id uuid,
  p_score numeric,
  p_feedback text default ''
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total_marks numeric;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Only an administrator can grade submissions.';
  end if;

  select a.total_marks
    into v_total_marks
  from public.assessment_submissions s
  join public.assessments a on a.id = s.assessment_id
  where s.id = p_submission_id
  for update of s;

  if not found then
    raise exception 'The assessment submission was not found.';
  end if;

  if p_score is null or p_score < 0 or p_score > v_total_marks then
    raise exception 'The mark must be between 0 and the assessment total.';
  end if;

  update public.assessment_submissions
  set score = round(p_score, 2),
      feedback = coalesce(p_feedback, ''),
      graded_at = now()
  where id = p_submission_id;
end;
$$;

revoke all on function public.grade_assessment_submission(uuid, numeric, text) from public;
grant execute on function public.grade_assessment_submission(uuid, numeric, text) to authenticated;

-- Verification: should return the function signature and the column-level
-- INSERT/UPDATE privileges for authenticated.
select
  routine_name,
  routine_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'grade_assessment_submission';

select
  column_name,
  privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'assessment_submissions'
  and grantee = 'authenticated'
  and privilege_type in ('INSERT', 'UPDATE')
order by privilege_type, column_name;

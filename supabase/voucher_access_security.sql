-- Voucher-controlled learner access. Run in Supabase SQL Editor before frontend deployment.
create extension if not exists pgcrypto with schema extensions;
alter table public.profiles add column if not exists access_enabled boolean not null default false;
-- Preserve all existing rows, but require fresh voucher redemption for existing learner accounts.
update public.profiles set access_enabled = (role = 'admin');

create table if not exists public.learner_vouchers (
 id uuid primary key default gen_random_uuid(),
 login_id text not null unique,
 full_name text not null,
 voucher_hash text not null,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now() + interval '30 days'),
 redeemed_at timestamptz,
 auth_user_id uuid unique references auth.users(id)
);
alter table public.learner_vouchers enable row level security;
revoke all on public.learner_vouchers from anon, authenticated;

create or replace function public.has_lms_access()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.access_enabled and p.role in ('learner','admin')); $$;
revoke all on function public.has_lms_access() from public, anon;
grant execute on function public.has_lms_access() to authenticated;

create or replace function public.issue_learner_voucher(p_full_name text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_login text; v_code text; v_expiry timestamptz := pg_catalog.now() + interval '30 days';
begin
 if not (select public.is_admin()) then raise exception 'Only an administrator can issue learner vouchers.'; end if;
 if pg_catalog.length(pg_catalog.btrim(coalesce(p_full_name,''))) < 2 then raise exception 'Enter the learner full name.'; end if;
 v_login := 'NAL-' || pg_catalog.upper(pg_catalog.substr(pg_catalog.replace(gen_random_uuid()::text,'-',''),1,10));
 v_code := 'NAL-' || pg_catalog.upper(pg_catalog.replace(gen_random_uuid()::text,'-',''));
 insert into public.learner_vouchers(login_id,full_name,voucher_hash,created_by,expires_at)
 values(v_login,pg_catalog.btrim(p_full_name),pg_catalog.encode(extensions.digest(pg_catalog.convert_to(v_code,'UTF8'),'sha256'),'hex'),(select auth.uid()),v_expiry);
 return pg_catalog.jsonb_build_object('login_id',v_login,'voucher',v_code,'full_name',pg_catalog.btrim(p_full_name),'expires_at',v_expiry);
end; $$;
revoke all on function public.issue_learner_voucher(text) from public, anon;
grant execute on function public.issue_learner_voucher(text) to authenticated;

create or replace function public.redeem_learner_voucher(p_login_id text,p_voucher_hash text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_row public.learner_vouchers%rowtype;
begin
 if (select auth.role()) <> 'service_role' then raise exception 'Not authorized.'; end if;
 select * into v_row from public.learner_vouchers
 where login_id=pg_catalog.upper(pg_catalog.btrim(p_login_id)) and voucher_hash=p_voucher_hash
 and redeemed_at is null and expires_at>pg_catalog.now() for update;
 if not found then raise exception 'The Login ID or voucher is invalid, expired, or already used.'; end if;
 update public.learner_vouchers set redeemed_at=pg_catalog.now() where id=v_row.id;
 return pg_catalog.jsonb_build_object('id',v_row.id,'full_name',v_row.full_name,'login_id',v_row.login_id);
end; $$;
revoke all on function public.redeem_learner_voucher(text,text) from public, anon, authenticated;
grant execute on function public.redeem_learner_voucher(text,text) to service_role;

create or replace function public.release_learner_voucher(p_voucher_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$ begin
 if (select auth.role()) <> 'service_role' then raise exception 'Not authorized.'; end if;
 update public.learner_vouchers set redeemed_at=null where id=p_voucher_id and auth_user_id is null;
end; $$;
revoke all on function public.release_learner_voucher(uuid) from public, anon, authenticated;
grant execute on function public.release_learner_voucher(uuid) to service_role;

-- Course catalogue and learning content.
drop policy if exists "Published courses are visible to authenticated users" on public.courses;
create policy "Published courses are visible to authenticated users" on public.courses for select to authenticated
using ((select public.has_lms_access()) and (is_published or (select public.is_admin())));
drop policy if exists "Visible course modules" on public.course_modules;
create policy "Visible course modules" on public.course_modules for select to authenticated
using ((select public.has_lms_access()) and exists(select 1 from public.courses c where c.id=course_id and (c.is_published or (select public.is_admin()))));
drop policy if exists "Visible lessons" on public.lessons;
create policy "Visible lessons" on public.lessons for select to authenticated
using ((select public.has_lms_access()) and exists(select 1 from public.course_modules m join public.courses c on c.id=m.course_id where m.id=module_id and (c.is_published or (select public.is_admin()))));

-- Enrolments and progress.
drop policy if exists "Learners read own enrollments" on public.enrollments;
create policy "Learners read own enrollments" on public.enrollments for select to authenticated
using ((select public.has_lms_access()) and (learner_id=(select auth.uid()) or (select public.is_admin())));
drop policy if exists "Learners enroll in published courses" on public.enrollments;
create policy "Learners enroll in published courses" on public.enrollments for insert to authenticated
with check ((select public.has_lms_access()) and learner_id=(select auth.uid()) and exists(select 1 from public.courses c where c.id=course_id and c.is_published));
drop policy if exists "Learners read own progress" on public.lesson_progress;
create policy "Learners read own progress" on public.lesson_progress for select to authenticated
using ((select public.has_lms_access()) and (learner_id=(select auth.uid()) or (select public.is_admin())));
drop policy if exists "Learners record own progress" on public.lesson_progress;
drop policy if exists "Learners record own enrolled published lesson progress" on public.lesson_progress;
create policy "Learners record own progress" on public.lesson_progress for insert to authenticated
with check ((select public.has_lms_access()) and learner_id=(select auth.uid()));
drop policy if exists "Learners remove own progress" on public.lesson_progress;
create policy "Learners remove own progress" on public.lesson_progress for delete to authenticated
using ((select public.has_lms_access()) and learner_id=(select auth.uid()));

-- Assessments and submissions.
drop policy if exists "Published assessments visible" on public.assessments;
create policy "Published assessments visible" on public.assessments for select to authenticated
using ((select public.has_lms_access()) and (is_published or (select public.is_admin())));
drop policy if exists "Learners read own submissions" on public.assessment_submissions;
create policy "Learners read own submissions" on public.assessment_submissions for select to authenticated
using ((select public.has_lms_access()) and (learner_id=(select auth.uid()) or (select public.is_admin())));
drop policy if exists "Learners submit own work" on public.assessment_submissions;
drop policy if exists "Enrolled learners submit published assessment work" on public.assessment_submissions;
create policy "Learners submit own work" on public.assessment_submissions for insert to authenticated
with check ((select public.has_lms_access()) and learner_id=(select auth.uid()) and exists(select 1 from public.assessments a where a.id=assessment_id and a.is_published));
drop policy if exists "Learners update own ungraded submissions" on public.assessment_submissions;
create policy "Learners update own ungraded submissions" on public.assessment_submissions for update to authenticated
using ((select public.has_lms_access()) and learner_id=(select auth.uid()) and graded_at is null)
with check ((select public.has_lms_access()) and learner_id=(select auth.uid()) and graded_at is null);

-- Quizzes and their learner-visible content.
drop policy if exists "Learners view published course quizzes" on public.quizzes;
create policy "Learners view published course quizzes" on public.quizzes for select to authenticated
using ((select public.has_lms_access()) and ((select public.is_admin()) or (is_published and exists(select 1 from public.courses c where c.id=course_id and c.is_published))));
drop policy if exists "Learners view published quiz questions" on public.quiz_questions;
create policy "Learners view published quiz questions" on public.quiz_questions for select to authenticated
using ((select public.has_lms_access()) and ((select public.is_admin()) or exists(select 1 from public.quizzes q join public.courses c on c.id=q.course_id where q.id=quiz_id and q.is_published and c.is_published)));
drop policy if exists "Learners read own quiz attempts" on public.quiz_attempts;
create policy "Learners read own quiz attempts" on public.quiz_attempts for select to authenticated
using ((select public.has_lms_access()) and (learner_id=(select auth.uid()) or (select public.is_admin())));
drop policy if exists "Learners read own quiz responses" on public.quiz_responses;
create policy "Learners read own quiz responses" on public.quiz_responses for select to authenticated
using ((select public.has_lms_access()) and exists(select 1 from public.quiz_attempts a where a.id=attempt_id and (a.learner_id=(select auth.uid()) or (select public.is_admin()))));

-- Keep the quiz marking RPC from becoming a bypass around profile access.
create or replace function public.submit_quiz_attempt(p_quiz_id uuid,p_answers jsonb)
returns table(attempt_id uuid,score numeric,total_questions integer,correct_answers integer,passed boolean)
language plpgsql security definer set search_path = ''
as $$
declare v_user uuid:=auth.uid(); v_course uuid; v_total integer; v_correct integer; v_attempt uuid;
begin
 if v_user is null or not (select public.has_lms_access()) then raise exception 'Your learner account is not authorised to access the LMS.'; end if;
 if jsonb_typeof(p_answers)<>'array' then raise exception 'Quiz answers must be submitted as a list.'; end if;
 select q.course_id into v_course from public.quizzes q join public.courses c on c.id=q.course_id where q.id=p_quiz_id and q.is_published and c.is_published;
 if v_course is null then raise exception 'This quiz is not currently available.'; end if;
 if not exists(select 1 from public.enrollments e where e.course_id=v_course and e.learner_id=v_user and e.status='active') then raise exception 'You must be enrolled in this course before taking its quizzes.'; end if;
 select count(*) into v_total from public.quiz_questions qq where qq.quiz_id=p_quiz_id;
 if v_total=0 or jsonb_array_length(p_answers)<>v_total or (select count(distinct a->>'question_id') from jsonb_array_elements(p_answers) a)<>v_total then raise exception 'Please answer every question once before submitting.'; end if;
 if exists(select 1 from jsonb_array_elements(p_answers) a where not(a?'question_id') or not(a?'selected_option')) then raise exception 'One or more answers are incomplete.'; end if;
 if exists(select 1 from jsonb_array_elements(p_answers) a left join public.quiz_questions qq on qq.id=(a->>'question_id')::uuid and qq.quiz_id=p_quiz_id where qq.id is null or (a->>'selected_option') !~ '^[0-9]+$' or (a->>'selected_option')::integer<0 or (a->>'selected_option')::integer>=jsonb_array_length(qq.options)) then raise exception 'The submitted answers contain an invalid question or option.'; end if;
 select count(*) into v_correct from jsonb_array_elements(p_answers) a join public.quiz_questions qq on qq.id=(a->>'question_id')::uuid and qq.quiz_id=p_quiz_id join public.quiz_answer_keys k on k.question_id=qq.id where k.correct_option=(a->>'selected_option')::integer;
 insert into public.quiz_attempts(quiz_id,learner_id,score,total_questions,correct_answers,passed)
 select p_quiz_id,v_user,round((v_correct::numeric/v_total)*100,2),v_total,v_correct,round((v_correct::numeric/v_total)*100,2)>=q.pass_mark from public.quizzes q where q.id=p_quiz_id returning id into v_attempt;
 insert into public.quiz_responses(attempt_id,question_id,selected_option,is_correct)
 select v_attempt,(a->>'question_id')::uuid,(a->>'selected_option')::integer,exists(select 1 from public.quiz_answer_keys k where k.question_id=(a->>'question_id')::uuid and k.correct_option=(a->>'selected_option')::integer) from jsonb_array_elements(p_answers) a;
 return query select a.id,a.score,a.total_questions,a.correct_answers,a.passed from public.quiz_attempts a where a.id=v_attempt;
end; $$;
revoke all on function public.submit_quiz_attempt(uuid,jsonb) from public;
grant execute on function public.submit_quiz_attempt(uuid,jsonb) to authenticated;

-- Nile Analytics Labs LMS: learning-management schema
-- Run after supabase/setup.sql in Supabase Dashboard > SQL Editor.
-- Safe to run more than once.

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null,
  description text not null default '',
  level text not null default 'Beginner',
  duration text not null default '',
  thumbnail_url text,
  is_published boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.course_modules(id) on delete cascade,
  title text not null,
  content text not null default '',
  video_url text,
  resource_url text,
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (learner_id, course_id)
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (learner_id, lesson_id)
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  instructions text not null default '',
  due_at timestamptz,
  total_marks numeric(8,2) not null default 100 check (total_marks > 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.assessment_submissions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  learner_id uuid not null references auth.users(id) on delete cascade,
  submission_text text not null default '',
  resource_url text,
  score numeric(8,2),
  feedback text not null default '',
  submitted_at timestamptz not null default now(),
  graded_at timestamptz,
  unique (assessment_id, learner_id)
);

create index if not exists courses_published_idx on public.courses(is_published);
create index if not exists modules_course_idx on public.course_modules(course_id, sort_order);
create index if not exists lessons_module_idx on public.lessons(module_id, sort_order);
create index if not exists enrollments_learner_idx on public.enrollments(learner_id);
create index if not exists submissions_assessment_idx on public.assessment_submissions(assessment_id);

alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_submissions enable row level security;

-- Courses: everyone signed in can browse published courses; admins manage all.
drop policy if exists "Published courses are visible to authenticated users" on public.courses;
create policy "Published courses are visible to authenticated users"
  on public.courses for select to authenticated
  using (is_published or (select public.is_admin()));
drop policy if exists "Admins manage courses" on public.courses;
create policy "Admins manage courses" on public.courses
  for all to authenticated using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Modules and lessons inherit visibility from their parent course.
drop policy if exists "Visible course modules" on public.course_modules;
create policy "Visible course modules" on public.course_modules for select to authenticated
  using (exists (select 1 from public.courses c where c.id = course_id and (c.is_published or (select public.is_admin()))));
drop policy if exists "Admins manage modules" on public.course_modules;
create policy "Admins manage modules" on public.course_modules for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Visible lessons" on public.lessons;
create policy "Visible lessons" on public.lessons for select to authenticated
  using (exists (
    select 1 from public.course_modules m join public.courses c on c.id = m.course_id
    where m.id = module_id and (c.is_published or (select public.is_admin()))
  ));
drop policy if exists "Admins manage lessons" on public.lessons;
create policy "Admins manage lessons" on public.lessons for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Learners can see and create only their own enrollments; admins can manage all.
drop policy if exists "Learners read own enrollments" on public.enrollments;
create policy "Learners read own enrollments" on public.enrollments for select to authenticated
  using (learner_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "Learners enroll in published courses" on public.enrollments;
create policy "Learners enroll in published courses" on public.enrollments for insert to authenticated
  with check (
    learner_id = (select auth.uid()) and exists (
      select 1 from public.courses c where c.id = course_id and c.is_published
    )
  );
drop policy if exists "Admins manage enrollments" on public.enrollments;
create policy "Admins manage enrollments" on public.enrollments for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Lesson completion belongs to the signed-in learner.
drop policy if exists "Learners read own progress" on public.lesson_progress;
create policy "Learners read own progress" on public.lesson_progress for select to authenticated
  using (learner_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "Learners record own progress" on public.lesson_progress;
create policy "Learners record own progress" on public.lesson_progress for insert to authenticated
  with check (learner_id = (select auth.uid()));
drop policy if exists "Learners remove own progress" on public.lesson_progress;
create policy "Learners remove own progress" on public.lesson_progress for delete to authenticated
  using (learner_id = (select auth.uid()));
drop policy if exists "Admins manage progress" on public.lesson_progress;
create policy "Admins manage progress" on public.lesson_progress for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Assessments are visible when published or to admins.
drop policy if exists "Published assessments visible" on public.assessments;
create policy "Published assessments visible" on public.assessments for select to authenticated
  using (is_published or (select public.is_admin()));
drop policy if exists "Admins manage assessments" on public.assessments;
create policy "Admins manage assessments" on public.assessments for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Learners manage their own submissions; admins review and grade all.
drop policy if exists "Learners read own submissions" on public.assessment_submissions;
create policy "Learners read own submissions" on public.assessment_submissions for select to authenticated
  using (learner_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "Learners submit own work" on public.assessment_submissions;
create policy "Learners submit own work" on public.assessment_submissions for insert to authenticated
  with check (
    learner_id = (select auth.uid()) and exists (
      select 1 from public.assessments a where a.id = assessment_id and a.is_published
    )
  );
drop policy if exists "Learners update own ungraded submissions" on public.assessment_submissions;
create policy "Learners update own ungraded submissions" on public.assessment_submissions for update to authenticated
  using (learner_id = (select auth.uid()) and graded_at is null)
  with check (learner_id = (select auth.uid()) and graded_at is null);
drop policy if exists "Admins manage submissions" on public.assessment_submissions;
create policy "Admins manage submissions" on public.assessment_submissions for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Seed the four catalogue courses as unpublished drafts. Existing rows are not overwritten.
insert into public.courses (title, slug, category, description, level, duration, is_published)
values
  ('Excel for Data Analysis', 'excel-for-data-analysis', 'Excel', 'Build practical Excel skills for cleaning, analyzing, visualizing and presenting real-world data.', 'Beginner to Intermediate', '6 weeks', false),
  ('Stata for Data Analysis', 'stata-for-data-analysis', 'Stata', 'Learn data management, descriptive statistics, regression and reporting using Stata.', 'Intermediate', '6 weeks', false),
  ('R Programming for Data Analysis', 'r-programming-for-data-analysis', 'R Programming', 'Learn R from the foundations through data manipulation, visualization and statistical analysis.', 'Beginner to Advanced', '8 weeks', false),
  ('SPSS for Data Analysis', 'spss-for-data-analysis', 'SPSS', 'Develop practical SPSS skills for survey data, descriptive statistics and inferential analysis.', 'Beginner to Intermediate', '6 weeks', false)
on conflict (slug) do nothing;

-- Ensure authenticated users can read the basic profile rows under the existing profile policies.

-- Table privileges are granted to authenticated users; row-level security above
-- remains the authority that determines which rows each user can access.
grant select, insert, update, delete on public.courses to authenticated;
grant select, insert, update, delete on public.course_modules to authenticated;
grant select, insert, update, delete on public.lessons to authenticated;
grant select, insert, update, delete on public.enrollments to authenticated;
grant select, insert, update, delete on public.lesson_progress to authenticated;
grant select, insert, update, delete on public.assessments to authenticated;
grant select, insert, update, delete on public.assessment_submissions to authenticated;

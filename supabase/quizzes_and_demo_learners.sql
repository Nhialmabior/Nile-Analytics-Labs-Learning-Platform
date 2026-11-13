-- Interactive Excel quizzes and secure automatic marking
-- Run once in Supabase SQL Editor after lms_schema.sql and seed_excel_course.sql.

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text not null default '',
  pass_mark numeric(5,2) not null default 60 check (pass_mark between 0 and 100),
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_text text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) >= 2),
  explanation text not null default '',
  sort_order integer not null default 0
);
-- Correct answers are deliberately stored separately and are never selectable by learners.
create table if not exists public.quiz_answer_keys (
  question_id uuid primary key references public.quiz_questions(id) on delete cascade,
  correct_option integer not null check (correct_option >= 0)
);
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  learner_id uuid not null references auth.users(id) on delete cascade,
  score numeric(6,2) not null,
  total_questions integer not null,
  correct_answers integer not null,
  passed boolean not null,
  submitted_at timestamptz not null default now()
);
create table if not exists public.quiz_responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  selected_option integer not null,
  is_correct boolean not null,
  unique(attempt_id, question_id)
);

create index if not exists quizzes_course_order_idx on public.quizzes(course_id, sort_order);
create index if not exists quiz_questions_order_idx on public.quiz_questions(quiz_id, sort_order);
create index if not exists quiz_attempts_learner_idx on public.quiz_attempts(learner_id, submitted_at desc);

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_answer_keys enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_responses enable row level security;

drop policy if exists "Learners view published course quizzes" on public.quizzes;
create policy "Learners view published course quizzes" on public.quizzes for select to authenticated
using (
  (select public.is_admin()) or (
    is_published and exists (
      select 1 from public.courses c where c.id = course_id and c.is_published
    )
  )
);
drop policy if exists "Admins manage quizzes" on public.quizzes;
create policy "Admins manage quizzes" on public.quizzes for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Learners view published quiz questions" on public.quiz_questions;
create policy "Learners view published quiz questions" on public.quiz_questions for select to authenticated
using (
  (select public.is_admin()) or exists (
    select 1 from public.quizzes q join public.courses c on c.id=q.course_id
    where q.id=quiz_id and q.is_published and c.is_published
  )
);
drop policy if exists "Admins manage quiz questions" on public.quiz_questions;
create policy "Admins manage quiz questions" on public.quiz_questions for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Admins manage quiz answer keys" on public.quiz_answer_keys;
create policy "Admins manage quiz answer keys" on public.quiz_answer_keys for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Learners read own quiz attempts" on public.quiz_attempts;
create policy "Learners read own quiz attempts" on public.quiz_attempts for select to authenticated
using (learner_id=(select auth.uid()) or (select public.is_admin()));
drop policy if exists "Learners read own quiz responses" on public.quiz_responses;
create policy "Learners read own quiz responses" on public.quiz_responses for select to authenticated
using (exists (select 1 from public.quiz_attempts a where a.id=attempt_id and (a.learner_id=(select auth.uid()) or (select public.is_admin()))));

grant select, insert, update, delete on public.quizzes, public.quiz_questions, public.quiz_answer_keys, public.quiz_attempts, public.quiz_responses to authenticated;

create or replace function public.submit_quiz_attempt(p_quiz_id uuid, p_answers jsonb)
returns table(attempt_id uuid, score numeric, total_questions integer, correct_answers integer, passed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_course uuid;
  v_total integer;
  v_correct integer;
  v_attempt uuid;
begin
  if v_user is null then raise exception 'You must sign in to submit a quiz.'; end if;
  if jsonb_typeof(p_answers) <> 'array' then raise exception 'Quiz answers must be submitted as a list.'; end if;

  select q.course_id into v_course
  from public.quizzes q join public.courses c on c.id=q.course_id
  where q.id=p_quiz_id and q.is_published and c.is_published;
  if v_course is null then raise exception 'This quiz is not currently available.'; end if;

  if not exists (select 1 from public.enrollments e where e.course_id=v_course and e.learner_id=v_user and e.status='active') then
    raise exception 'You must be enrolled in this course before taking its quizzes.';
  end if;

  select count(*) into v_total from public.quiz_questions qq where qq.quiz_id=p_quiz_id;
  if v_total=0 or jsonb_array_length(p_answers) <> v_total
     or (select count(distinct a->>'question_id') from jsonb_array_elements(p_answers) a) <> v_total then
    raise exception 'Please answer every question once before submitting.';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_answers) a
    where not (a ? 'question_id') or not (a ? 'selected_option')
  ) then raise exception 'One or more answers are incomplete.'; end if;

  if exists (
    select 1 from jsonb_array_elements(p_answers) a
    left join public.quiz_questions qq on qq.id=(a->>'question_id')::uuid and qq.quiz_id=p_quiz_id
    where qq.id is null or (a->>'selected_option') !~ '^[0-9]+$'
      or (a->>'selected_option')::integer < 0
      or (a->>'selected_option')::integer >= jsonb_array_length(qq.options)
  ) then raise exception 'The submitted answers contain an invalid question or option.'; end if;

  select count(*) into v_correct
  from jsonb_array_elements(p_answers) a
  join public.quiz_questions qq on qq.id=(a->>'question_id')::uuid and qq.quiz_id=p_quiz_id
  join public.quiz_answer_keys k on k.question_id=qq.id
  where k.correct_option=(a->>'selected_option')::integer;

  insert into public.quiz_attempts(quiz_id,learner_id,score,total_questions,correct_answers,passed)
  select p_quiz_id,v_user,round((v_correct::numeric / v_total)*100,2),v_total,v_correct,
    round((v_correct::numeric / v_total)*100,2) >= q.pass_mark
  from public.quizzes q where q.id=p_quiz_id
  returning id into v_attempt;

  insert into public.quiz_responses(attempt_id,question_id,selected_option,is_correct)
  select v_attempt,(a->>'question_id')::uuid,(a->>'selected_option')::integer,
    exists(select 1 from public.quiz_answer_keys k where k.question_id=(a->>'question_id')::uuid and k.correct_option=(a->>'selected_option')::integer)
  from jsonb_array_elements(p_answers) a;

  return query select a.id,a.score,a.total_questions,a.correct_answers,a.passed
  from public.quiz_attempts a where a.id=v_attempt;
end;
$$;
revoke all on function public.submit_quiz_attempt(uuid,jsonb) from public;
grant execute on function public.submit_quiz_attempt(uuid,jsonb) to authenticated;

-- Seed three short formative quizzes for the Excel course.
do $$
declare v_course uuid; v_quiz uuid; v_question uuid;
begin
  select id into v_course from public.courses where slug='excel-for-data-analysis';
  if v_course is null then raise exception 'Run lms_schema.sql first.'; end if;

  insert into public.quizzes(course_id,title,description,pass_mark,is_published,sort_order)
  select v_course, x.title, x.description, 60, true, x.sort_order
  from (values
    ('Excel Foundations Checkpoint','Test your understanding of workbooks, worksheets, cells and basic formatting.',1),
    ('Formulas and Functions Checkpoint','Practise choosing formulas and functions for everyday analysis.',2),
    ('Data Quality and Analysis Checkpoint','Check your knowledge of cleaning, sorting, filtering and PivotTables.',3)
  ) x(title,description,sort_order)
  where not exists (select 1 from public.quizzes q where q.course_id=v_course and q.title=x.title);

  for v_quiz in select id from public.quizzes where course_id=v_course and title in (
    'Excel Foundations Checkpoint','Formulas and Functions Checkpoint','Data Quality and Analysis Checkpoint'
  ) loop
    if not exists(select 1 from public.quiz_questions where quiz_id=v_quiz) then
      if (select title from public.quizzes where id=v_quiz)='Excel Foundations Checkpoint' then
        insert into public.quiz_questions(quiz_id,question_text,options,explanation,sort_order) values
        (v_quiz,'What is an Excel workbook?','["A single cell","An Excel file containing one or more worksheets","A formula","A chart only"]','A workbook is the Excel file; it can contain multiple worksheets.',1),
        (v_quiz,'What is the intersection of a row and a column called?','["A cell","A range","A ribbon","A field"]','A cell is identified by its column letter and row number.',2),
        (v_quiz,'Which symbol begins a formula in Excel?','["#","@","=","%"]','Excel formulas begin with an equals sign.',3),
        (v_quiz,'Which format is most suitable for a date value?','["General text","Date","Scientific","Accounting"]','Use a date format so Excel can interpret and display dates consistently.',4),
        (v_quiz,'What does the Name Box commonly display?','["The active cell reference","The workbook password","The file size","The chart title"]','The Name Box shows the active cell address or a named range.',5);
      elsif (select title from public.quizzes where id=v_quiz)='Formulas and Functions Checkpoint' then
        insert into public.quiz_questions(quiz_id,question_text,options,explanation,sort_order) values
        (v_quiz,'Which function adds values in a range?','["COUNT","SUM","MAX","IF"]','SUM adds numeric values.',1),
        (v_quiz,'Which function calculates the arithmetic mean?','["AVERAGE","MIN","COUNTA","ROUND"]','AVERAGE returns the arithmetic mean of numeric values.',2),
        (v_quiz,'What does the IF function do?','["Creates a chart","Tests a condition and returns a result for true or false","Removes duplicates","Sorts a table"]','IF evaluates a logical test and returns one result when true and another when false.',3),
        (v_quiz,'Which reference stays fixed when a formula is copied?','["A1","A$1 only","$A$1","A1:B2"]','An absolute reference such as $A$1 locks both the column and row.',4),
        (v_quiz,'Which function counts non-empty cells?','["COUNTBLANK","COUNTA","SUM","MIN"]','COUNTA counts cells containing any value.',5);
      else
        insert into public.quiz_questions(quiz_id,question_text,options,explanation,sort_order) values
        (v_quiz,'Which tool identifies repeated records in a selected range?','["Remove Duplicates","Goal Seek","Freeze Panes","Flash Fill"]','Remove Duplicates removes repeated rows based on selected columns.',1),
        (v_quiz,'What should you do before cleaning an important dataset?','["Delete the original","Make a backup copy","Sort randomly","Hide all columns"]','Keep an untouched copy so the original data can be recovered and audited.',2),
        (v_quiz,'What is the main purpose of a PivotTable?','["Design a logo","Summarise and analyse data by categories","Encrypt a workbook","Write macros"]','PivotTables group and aggregate data interactively.',3),
        (v_quiz,'Which feature displays only records meeting selected criteria?','["Filter","Merge Cells","Wrap Text","Page Layout"]','Filters temporarily show records that match chosen criteria.',4),
        (v_quiz,'What is a good practice for a reliable dataset?','["Multiple header rows","One record per row and one variable per column","Merged cells throughout","Blank column names"]','A tidy tabular structure supports sorting, filtering and analysis.',5);
      end if;
    end if;
  end loop;

  insert into public.quiz_answer_keys(question_id,correct_option)
  select qq.id, case
    when qq.question_text='What is an Excel workbook?' then 1
    when qq.question_text='What is the intersection of a row and a column called?' then 0
    when qq.question_text='Which symbol begins a formula in Excel?' then 2
    when qq.question_text='Which format is most suitable for a date value?' then 1
    when qq.question_text='What does the Name Box commonly display?' then 0
    when qq.question_text='Which function adds values in a range?' then 1
    when qq.question_text='Which function calculates the arithmetic mean?' then 0
    when qq.question_text='What does the IF function do?' then 1
    when qq.question_text='Which reference stays fixed when a formula is copied?' then 2
    when qq.question_text='Which function counts non-empty cells?' then 1
    when qq.question_text='Which tool identifies repeated records in a selected range?' then 0
    when qq.question_text='What should you do before cleaning an important dataset?' then 1
    when qq.question_text='What is the main purpose of a PivotTable?' then 1
    when qq.question_text='Which feature displays only records meeting selected criteria?' then 0
    when qq.question_text='What is a good practice for a reliable dataset?' then 1
  end
  from public.quiz_questions qq
  where qq.quiz_id in (select id from public.quizzes where course_id=v_course)
  on conflict(question_id) do nothing;
end $$;

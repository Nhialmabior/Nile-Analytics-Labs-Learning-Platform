-- Nile Analytics Labs LMS: verify course seed and publication status
-- Run this in Supabase SQL Editor after applying the course seed scripts.
-- This is read-only: it does not publish, modify or delete any records.

select
  c.title,
  c.slug,
  c.is_published,
  (select count(*) from public.course_modules m where m.course_id=c.id) as module_count,
  (select count(*) from public.lessons l
     join public.course_modules m on m.id=l.module_id
     where m.course_id=c.id) as lesson_count,
  (select count(*) from public.quizzes q where q.course_id=c.id) as quiz_count,
  (select count(*) from public.quiz_questions qq
     join public.quizzes q on q.id=qq.quiz_id
     where q.course_id=c.id) as quiz_question_count,
  (select count(*) from public.assessments a where a.course_id=c.id) as assessment_count,
  (select count(*) from public.assessments a
     where a.course_id=c.id and a.is_published=true) as published_assessment_count
from public.courses c
where c.slug in (
  'excel-for-data-analysis',
  'stata-for-data-analysis',
  'r-programming-for-data-analysis',
  'spss-for-data-analysis'
)
order by case c.slug
  when 'excel-for-data-analysis' then 1
  when 'stata-for-data-analysis' then 2
  when 'r-programming-for-data-analysis' then 3
  when 'spss-for-data-analysis' then 4
  else 5
end;

-- Expected curriculum totals for the four seeded courses:
-- Excel: 8 modules / 32 lessons
-- Stata: 6 modules / 30 lessons
-- R Programming: 8 modules / 40 lessons
-- SPSS: 8 modules / 40 lessons
--
-- Each course seed should create 3 quizzes (15 questions) and 1 capstone
-- assessment. A course's is_published value remains false until an admin
-- deliberately publishes it in the platform.
--
-- If a course is absent, run its seed SQL after the prerequisite scripts.
-- If a course has fewer lessons or quizzes than expected, inspect the
-- corresponding seed script and Supabase SQL Editor error output.

-- Nile Analytics Labs: Excel for Data Analysis pilot curriculum
-- Run after supabase/lms_schema.sql in Supabase SQL Editor.
-- Idempotent: module and lesson order are unique within their parent records.
-- Learners can only read published lessons in published courses. Progress is
-- recorded only for published lessons in a course the learner has joined.
drop policy if exists "Visible lessons" on public.lessons;
create policy "Visible lessons" on public.lessons for select to authenticated
  using (
    (select public.is_admin()) or (
      is_published and exists (
        select 1 from public.course_modules m
        join public.courses c on c.id = m.course_id
        where m.id = module_id and c.is_published
      )
    )
  );
drop policy if exists "Learners record own progress" on public.lesson_progress;
create policy "Learners record own progress" on public.lesson_progress for insert to authenticated
  with check (
    learner_id = (select auth.uid()) and exists (
      select 1 from public.lessons l
      join public.course_modules m on m.id = l.module_id
      join public.enrollments e on e.course_id = m.course_id
      where l.id = lesson_id and l.is_published
        and e.learner_id = (select auth.uid()) and e.status = 'active'
    )
  );

create unique index if not exists course_modules_course_order_uidx
  on public.course_modules(course_id, sort_order);
create unique index if not exists lessons_module_order_uidx
  on public.lessons(module_id, sort_order);

do $$
declare
  v_course_id uuid;
  v_module_id uuid;
  v_module record;
begin
  select id into v_course_id
  from public.courses
  where slug = 'excel-for-data-analysis';

  if v_course_id is null then
    raise exception 'Excel course not found. Run supabase/lms_schema.sql first.';
  end if;

  for v_module in
    select * from (values
      (1, 'Introduction to Excel', 'Understand the spreadsheet environment, workbook structure and the basics of organising information.'),
      (2, 'Data Entry and Organisation', 'Enter, format and structure reliable datasets using Excel tables and data controls.'),
      (3, 'Essential Formulas and Functions', 'Use formulas and common functions to calculate, summarise and interpret data.'),
      (4, 'Data Cleaning and Preparation', 'Identify data quality problems and prepare consistent datasets for analysis.'),
      (5, 'Data Analysis Functions', 'Apply conditional, logical, text, date and lookup functions to answer practical questions.'),
      (6, 'Sorting, Filtering and PivotTables', 'Explore datasets, group records and summarise information with PivotTables.'),
      (7, 'Data Visualisation and Dashboards', 'Choose appropriate charts and build clear, useful analytical dashboards.'),
      (8, 'Final Practical Data Analysis Project', 'Apply the course skills to a synthetic survey dataset and communicate findings.')
    ) as modules(sort_order, title, description)
  loop
    insert into public.course_modules (course_id, title, description, sort_order)
    values (v_course_id, v_module.title, v_module.description, v_module.sort_order)
    on conflict (course_id, sort_order)
    do update set title = excluded.title, description = excluded.description
    returning id into v_module_id;

    -- Lessons are inserted below in one set-based statement after all modules exist.
  end loop;

  insert into public.lessons
    (module_id, title, content, video_url, resource_url, duration_minutes, sort_order, is_published)
  select
    m.id, l.title, l.content, l.video_url, l.resource_url, l.duration_minutes, l.sort_order, true
  from public.course_modules m
  join (
    values
    -- MODULE 1: INTRODUCTION TO EXCEL
    ('Introduction to Excel', 1, 'What is Excel and what is data analysis?', 'Explain how spreadsheets organise information and support basic analysis. Identify common uses of Excel in research, education, NGO programmes and business.', 'https://www.youtube-nocookie.com/embed/QiSCaEHQ7Yo?start=0', 'https://techcommunity.microsoft.com/blog/microsoftmechanicsblog/microsoft-excel-beginners-tutorial-2026/4520866', 15),
    ('Introduction to Excel', 2, 'Navigating the Excel interface', 'Locate the Ribbon, formula bar, Name Box, worksheet tabs, status bar and Quick Access Toolbar. Practise selecting cells, rows, columns and ranges.', 'https://www.youtube-nocookie.com/embed/QiSCaEHQ7Yo?start=131', 'https://support.microsoft.com/en-us/excel', 20),
    ('Introduction to Excel', 3, 'Workbooks, worksheets, cells and ranges', 'Distinguish a workbook from a worksheet. Enter text, numbers and dates, rename sheets, add worksheets and save a workbook using a clear file name.', 'https://www.youtube-nocookie.com/embed/QiSCaEHQ7Yo?start=131', 'https://techcommunity.microsoft.com/blog/microsoftmechanicsblog/microsoft-excel-beginners-tutorial-2026/4520866', 20),
    ('Introduction to Excel', 4, 'Formatting cells and saving files', 'Apply number, date, percentage and currency formats. Adjust column widths, use readable headings and save a workbook in XLSX format.', 'https://www.youtube-nocookie.com/embed/QiSCaEHQ7Yo?start=540', 'https://support.microsoft.com/en-us/excel', 25),

    -- MODULE 2: DATA ENTRY AND ORGANISATION
    ('Data Entry and Organisation', 1, 'Entering and editing data accurately', 'Practise entering text, numeric values and dates. Use AutoFill, copy and paste, undo and redo, and identify common data-entry mistakes.', null, 'https://support.microsoft.com/en-us/excel', 20),
    ('Data Entry and Organisation', 2, 'Formatting data as an Excel table', 'Convert a consistent data range into an Excel table. Give the table a meaningful name and explain why one header row and one record per row are important.', null, 'https://support.microsoft.com/en-us/office/create-and-format-tables-e81aa349-b006-4f8a-9806-5af9df0ac664', 25),
    ('Data Entry and Organisation', 3, 'Sorting and filtering records', 'Sort records alphabetically and numerically, apply single and multiple filters, and display only records that meet specified conditions.', null, 'https://support.microsoft.com/en-us/excel', 25),
    ('Data Entry and Organisation', 4, 'Data validation and controlled entry', 'Create drop-down lists, set number and date restrictions, and use input messages to reduce inconsistent data entry.', null, 'https://support.microsoft.com/en-us/office/apply-data-validation-to-cells-29fecbcc-d1b9-42c1-9d76-eff3ce5f7249', 25),

    -- MODULE 3: ESSENTIAL FORMULAS AND FUNCTIONS
    ('Essential Formulas and Functions', 1, 'Formula basics and cell references', 'Write formulas beginning with an equals sign. Use arithmetic operators and understand relative, absolute and mixed cell references.', null, 'https://support.microsoft.com/en-us/excel', 25),
    ('Essential Formulas and Functions', 2, 'SUM, AVERAGE, MIN and MAX', 'Calculate totals, averages, minimums and maximums. Select ranges correctly and check formula results against the source data.', null, 'https://support.microsoft.com/en-us/excel', 25),
    ('Essential Formulas and Functions', 3, 'COUNT, COUNTA and COUNTBLANK', 'Count numeric cells, non-empty cells and blank cells. Choose the appropriate counting function for a dataset and explain what each result means.', null, 'https://support.microsoft.com/en-us/excel', 20),
    ('Essential Formulas and Functions', 4, 'Using IF for logical decisions', 'Build IF formulas to classify records, test conditions and return different results. Practise with attendance and assessment thresholds.', null, 'https://support.microsoft.com/en-us/office/if-function-69aed7c9-4e8a-4755-a9bc-aa8bbff73be2', 30),

    -- MODULE 4: DATA CLEANING AND PREPARATION
    ('Data Cleaning and Preparation', 1, 'Understanding data quality', 'Recognise missing values, duplicates, inconsistent labels, incorrect data types and invalid entries. Create a simple data-quality checklist before editing a dataset.', null, 'https://support.microsoft.com/en-us/excel', 20),
    ('Data Cleaning and Preparation', 2, 'Finding and removing duplicates', 'Use conditional formatting and Remove Duplicates to identify repeated records. Keep a copy of the original data and confirm the correct fields define a duplicate.', null, 'https://support.microsoft.com/en-us/office/filter-for-unique-values-or-remove-duplicate-values-ccf664b5-3e74-4aee-a3a8-9d8c8626e5b3', 25),
    ('Data Cleaning and Preparation', 3, 'Handling blanks and inconsistent text', 'Find blank cells, standardise spelling and case, and use TRIM, CLEAN, UPPER, LOWER and PROPER where appropriate. Document any assumptions made when correcting data.', null, 'https://support.microsoft.com/en-us/excel', 30),
    ('Data Cleaning and Preparation', 4, 'Splitting, combining and preparing columns', 'Use Text to Columns and text functions to separate or combine fields. Prepare dates and categories consistently for analysis.', null, 'https://support.microsoft.com/en-us/excel', 25),

    -- MODULE 5: DATA ANALYSIS FUNCTIONS
    ('Data Analysis Functions', 1, 'Conditional calculations with SUMIF and COUNTIF', 'Calculate totals and counts for records that meet one condition. Apply the functions to categories such as school, location or programme status.', null, 'https://support.microsoft.com/en-us/excel', 30),
    ('Data Analysis Functions', 2, 'Multiple conditions with SUMIFS and COUNTIFS', 'Summarise records using more than one criterion, such as a location and reporting period. Check criteria ranges and criteria values carefully.', null, 'https://support.microsoft.com/en-us/excel', 30),
    ('Data Analysis Functions', 3, 'Lookup functions with XLOOKUP and VLOOKUP', 'Retrieve matching information from a reference table. Understand lookup values, return ranges, exact matches and what happens when no match is found.', null, 'https://support.microsoft.com/en-us/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929', 35),
    ('Data Analysis Functions', 4, 'Combining functions for useful analysis', 'Combine IF with counting, summing and lookup functions to create useful indicators. Practise interpreting the results rather than reporting numbers without context.', null, 'https://support.microsoft.com/en-us/excel', 30),

    -- MODULE 6: SORTING, FILTERING AND PIVOTTABLES
    ('Sorting, Filtering and PivotTables', 1, 'Preparing a dataset for summarisation', 'Check that the source data has one header row, consistent columns and no merged cells. Convert the range to a table before summarising it.', null, 'https://support.microsoft.com/en-us/office/create-and-format-tables-e81aa349-b006-4f8a-9806-5af9df0ac664', 20),
    ('Sorting, Filtering and PivotTables', 2, 'Creating your first PivotTable', 'Insert a PivotTable and place fields in Rows, Columns, Values and Filters. Summarise a dataset by category and location.', null, 'https://support.microsoft.com/en-us/office/create-a-pivottable-to-analyze-worksheet-data-a9a84538-bfe9-40a9-a8e9-f99134456576', 30),
    ('Sorting, Filtering and PivotTables', 3, 'Grouping, filtering and changing calculations', 'Group dates where appropriate, filter PivotTable results and change value summaries from Sum to Count or Average. Refresh the PivotTable after source changes.', null, 'https://support.microsoft.com/en-us/excel', 30),
    ('Sorting, Filtering and PivotTables', 4, 'PivotCharts and slicers', 'Create a PivotChart, add slicers where supported and use interactive filters to explore patterns in the data.', 'https://www.youtube.com/embed/h_UBLvhszko?start=3823', 'https://its.weill.cornell.edu/guides/microsoft-excel-video-tutorials', 30),

    -- MODULE 7: DATA VISUALISATION AND DASHBOARDS
    ('Data Visualisation and Dashboards', 1, 'Choosing the right chart', 'Match chart types to the question: columns for comparisons, lines for trends and bars for ranked categories. Avoid misleading axes and unnecessary decoration.', null, 'https://support.microsoft.com/en-us/excel', 25),
    ('Data Visualisation and Dashboards', 2, 'Creating and formatting charts', 'Create charts from a clean summary table. Add meaningful titles, axis labels, legends and data labels only when they improve understanding.', null, 'https://support.microsoft.com/en-us/excel', 30),
    ('Data Visualisation and Dashboards', 3, 'Conditional formatting and visual indicators', 'Use data bars, colour scales and icon sets to highlight patterns. Apply visual emphasis consistently and avoid relying on colour alone to communicate meaning.', null, 'https://support.microsoft.com/en-us/excel', 25),
    ('Data Visualisation and Dashboards', 4, 'Building a one-page dashboard', 'Arrange key indicators, charts and filters on one worksheet. Keep the layout readable, include a reporting period and explain the source of the data.', null, 'https://its.weill.cornell.edu/guides/microsoft-excel-video-tutorials', 40),

    -- MODULE 8: FINAL PRACTICAL PROJECT
    ('Final Practical Data Analysis Project', 1, 'Understanding the project dataset and questions', 'Review a synthetic education programme dataset. Identify the unit of analysis, variables, reporting period and questions the analysis should answer.', null, 'https://nhialmabior.github.io/Nile-Analytics-Labs-Learning-Platform/resources/excel/excel_practice_dataset.csv', 25),
    ('Final Practical Data Analysis Project', 2, 'Cleaning and validating the project data', 'Create a working copy, check duplicates and missing values, standardise categories and record the cleaning decisions made.', null, 'https://nhialmabior.github.io/Nile-Analytics-Labs-Learning-Platform/resources/excel/excel_practice_dataset.csv', 35),
    ('Final Practical Data Analysis Project', 3, 'Analysing results and building the dashboard', 'Use formulas, conditional summaries and PivotTables to answer the project questions. Build charts that communicate the most important findings.', null, 'https://nhialmabior.github.io/Nile-Analytics-Labs-Learning-Platform/resources/excel/excel_practice_dataset.csv', 45),
    ('Final Practical Data Analysis Project', 4, 'Presenting findings and submitting your workbook', 'Write a short findings summary with evidence from the analysis. Check formulas, labels and charts, then save and submit the completed workbook.', null, 'https://nhialmabior.github.io/Nile-Analytics-Labs-Learning-Platform/resources/excel/excel_practice_dataset.csv', 35)
  ) as l(module_title, sort_order, title, content, video_url, resource_url, duration_minutes)
    on m.title = l.module_title
  where m.course_id = v_course_id
  on conflict (module_id, sort_order)
  do update set
    title = excluded.title,
    content = excluded.content,
    video_url = excluded.video_url,
    resource_url = excluded.resource_url,
    duration_minutes = excluded.duration_minutes,
    is_published = true;

  raise notice 'Excel pilot curriculum seeded: 8 modules and 32 lessons.';
end $$;


-- Create the Excel capstone assignment as a draft. Administrators publish it
-- from the Assessments section after reviewing the instructions.
do $$
declare
  v_course_id uuid;
begin
  select id into v_course_id from public.courses
  where slug = 'excel-for-data-analysis';

  if v_course_id is not null and not exists (
    select 1 from public.assessments
    where course_id = v_course_id and title = 'Excel Education Data Analysis Project'
  ) then
    insert into public.assessments
      (course_id, title, instructions, total_marks, is_published)
    values (
      v_course_id,
      'Excel Education Data Analysis Project',
      E'## Project scenario\nYou are supporting a fictional education programme and have been given a synthetic dataset of 50 learner records. The data contains missing values and a duplicated record.\n\n## Your tasks\n1. Download the Excel practice CSV from the course lesson resources.\n2. Save an untouched copy, then create a clean working sheet.\n3. Identify and document duplicate records, missing values and inconsistent entries.\n4. Calculate attendance rate for each learner (Attendance_Days / Enrolled_Days).\n5. Calculate the average assessment score and compare results by school and grade.\n6. Create at least one PivotTable and two suitable charts.\n7. Build a one-page dashboard showing key indicators and findings.\n8. Write a 300–500 word summary explaining three findings, one data-quality limitation and one recommendation.\n\n## Submit\nSubmit a short explanation of your process and findings, and provide a shareable link to your completed Excel workbook. Ensure the link permissions allow your instructor to view the file. Do not include personal information; the dataset is entirely fictional.\n\n## Assessment criteria (100 marks)\nData cleaning and documentation: 20; formulas and calculations: 20; PivotTable and analysis: 20; charts and dashboard: 20; interpretation and recommendations: 20.',
      100,
      false
    );
  end if;
end $$;

-- Nile Analytics Labs: Stata for Data Analysis curriculum
-- Run after lms_schema.sql, seed_excel_course.sql and quizzes_and_demo_learners.sql.
-- Safe to rerun: module and lesson rows are upserted by course/order; assessments/quizzes are inserted only once.

create unique index if not exists course_modules_course_order_uidx on public.course_modules(course_id, sort_order);
create unique index if not exists lessons_module_order_uidx on public.lessons(module_id, sort_order);

insert into public.courses(title,slug,category,description,level,duration,is_published)
values ('Stata for Data Analysis','stata-for-data-analysis','Stata','Develop practical Stata skills for importing, managing, cleaning, analysing and reporting research data using reproducible do-files.','Beginner to Intermediate','6 weeks',false)
on conflict(slug) do update set
 title=excluded.title, category=excluded.category, description=excluded.description,
 level=excluded.level, duration=excluded.duration, updated_at=now();

do $$
declare v_course uuid; v_module uuid; v_row record; v_quiz uuid; v_question uuid;
begin
 select id into v_course from public.courses where slug='stata-for-data-analysis';
 for v_row in select * from (values
  (1, 'Stata Foundations and Research Workflow', 'Set up Stata, understand its interface and learn a reproducible command-based workflow.'),
  (2, 'Importing, Inspecting and Managing Data', 'Import datasets, inspect structure, label variables and manage observations and variables.'),
  (3, 'Data Cleaning and Transformation', 'Handle missing values, duplicates, inconsistent categories and create analysis-ready variables.'),
  (4, 'Descriptive Statistics and Data Exploration', 'Summarise variables, explore distributions and compare indicators across groups.'),
  (5, 'Statistical Analysis and Regression', 'Apply common hypothesis tests and interpret linear and logistic regression responsibly.'),
  (6, 'Reproducible Reporting and Applied Project', 'Build do-files, export results and complete an applied education-data analysis.')) as m(sort_order,title,description) loop
  insert into public.course_modules(course_id,title,description,sort_order)
  values(v_course,v_row.title,v_row.description,v_row.sort_order)
  on conflict(course_id,sort_order) do update set title=excluded.title,description=excluded.description
  returning id into v_module;
 end loop;

 insert into public.lessons(module_id,title,content,video_url,resource_url,duration_minutes,sort_order,is_published)
 select m.id,l.title,l.content,null,l.resource_url,l.duration_minutes,l.sort_order,true
 from public.course_modules m
 join (values
 ('Stata Foundations and Research Workflow',1,'What Stata does in applied research','Stata is a statistical software environment used to manage data, conduct statistical analysis and produce reproducible results. In this lesson, distinguish data management, descriptive analysis and inferential analysis. Consider how a programme officer might use learner attendance and assessment records to answer monitoring questions. Write down one research question, the unit of analysis and the variables required to answer it.','https://www.stata.com/links/resources-for-learning-stata/',20),
 ('Stata Foundations and Research Workflow',2,'Installing Stata and understanding editions','Review Stata''s official installation and licensing guidance. Identify the version available to you and understand that Stata/BE, Stata/SE and Stata/MP differ in capacity and performance. Do not use unlicensed copies. Confirm that Stata opens and that you can access the Command, Results, Review and Variables windows.','https://www.stata.com/order/',25),
 ('Stata Foundations and Research Workflow',3,'Navigating the Stata interface','Explore the Command window, Results window, Variables pane, Properties pane and Review history. Practise opening the Data Editor and Variables Manager. Learn where Stata displays errors and how to revisit earlier commands. Keep a short record of commands you run and the output they produce.','https://www.stata.com/manuals/u.pdf',25),
 ('Stata Foundations and Research Workflow',4,'First commands and help system','Run describe, summarize, list and clear on a small practice dataset. Use help summarize and search regress to discover command syntax and options. Read the command syntax, required variables and examples before running unfamiliar procedures. Learn that Stata commands are generally case-insensitive but variable names must match their stored names.','https://www.stata.com/manuals/u.pdf',25),
 ('Stata Foundations and Research Workflow',5,'Do-files and a reproducible workflow','Create a do-file, add a title and comments, set a working directory and run commands from the editor. Separate setup, data preparation, analysis and output sections. Save the do-file alongside the dataset. Your goal is to make it possible for another analyst to rerun the work from the original data.','https://www.stata.com/manuals/gsw.pdf',30),
 ('Importing, Inspecting and Managing Data',1,'Importing CSV and Excel files','Import the supplied synthetic education dataset using import delimited or import excel. Inspect the first rows and verify that column names, numeric values and dates were read correctly. Save a Stata working copy with save. Keep the original CSV unchanged so your workflow can be reproduced.','https://www.stata.com/manuals/dimportdelimited.pdf',20),
 ('Importing, Inspecting and Managing Data',2,'Understanding observations, variables and storage types','Use describe and codebook to inspect variable names, labels, storage types and value ranges. Distinguish string variables from numeric variables and identify variables that represent IDs, categories, counts, scores and proportions. Check whether imported numeric-looking fields were accidentally stored as text.','https://www.stata.com/manuals/d.pdf',25),
 ('Importing, Inspecting and Managing Data',3,'Labels, formats and value labels','Use label variable to document what each variable represents. Apply readable formats to dates and numeric values. Create value labels for coded categories such as gender or programme status, then attach them to the appropriate variable. Good labels make output easier to interpret without changing the underlying values.','https://www.stata.com/manuals/dlabel.pdf',25),
 ('Importing, Inspecting and Managing Data',4,'Selecting observations and variables','Practise keep, drop, keep if and drop if using clear conditions. Use in and if qualifiers with list and summarize. Create a temporary subset for one county or grade, then confirm that your original working file remains intact. Record the number of observations before and after filtering.','https://www.stata.com/manuals/u.pdf',25),
 ('Importing, Inspecting and Managing Data',5,'Appending and merging datasets','Understand when append stacks records and when merge joins datasets using a key. Check that IDs uniquely identify records where required, inspect merge results and investigate unmatched observations. Never assume a merge succeeded simply because Stata produced an output; review the merge indicator and document exclusions.','https://www.stata.com/manuals/dmerge.pdf',30),
 ('Data Cleaning and Transformation',1,'Checking missing values','Use misstable summarize, count if missing(variable) and tabulate with missing options to understand missingness. Distinguish a true missing value from a zero, an empty string or a special code such as 99. Do not replace missing values automatically; first ask why the value is absent and whether it affects the analysis.','https://www.stata.com/manuals/rmisstable.pdf',20),
 ('Data Cleaning and Transformation',2,'Identifying and handling duplicate records','Use duplicates report and duplicates list to identify repeated records using an appropriate key. Decide whether duplicates are exact copies or legitimate repeated observations. Only remove records after verifying the data structure and documenting the decision. Keep a copy of the original file for auditability.','https://www.stata.com/manuals/dduplicates.pdf',25),
 ('Data Cleaning and Transformation',3,'Standardising string categories','Use replace, trim, itrim, lower, upper and subinstr to identify and standardise inconsistent text categories. Compare tabulations before and after cleaning. Create a documented recode rule and preserve the original variable when the transformation could affect interpretation.','https://www.stata.com/manuals/d.pdf',25),
 ('Data Cleaning and Transformation',4,'Generating and recoding variables','Use generate and replace to create derived variables such as attendance rate. Use recode or generate with conditional expressions to group ages or scores. Check that denominators are valid, avoid division by zero and label each derived variable with its definition and units.','https://www.stata.com/manuals/dgenerate.pdf',25),
 ('Data Cleaning and Transformation',5,'Validating a clean analysis dataset','Use assert, summarize, tabulate and list to test expected ranges, missingness and category values. Check unique IDs, plausible ages, attendance not exceeding enrolled days and scores within the expected scale. Save a clean dataset separately and create a short data-cleaning log explaining every important decision.','https://www.stata.com/manuals/u.pdf',30),
 ('Descriptive Statistics and Data Exploration',1,'Measures of centre and spread','Use summarize, detail to examine mean, median, standard deviation, percentiles, minimum and maximum. Explain why a mean can be affected by extreme values and when the median may be more informative. Report the number of non-missing observations alongside key statistics.','https://www.stata.com/manuals/rsummarize.pdf',20),
 ('Descriptive Statistics and Data Exploration',2,'Frequency tables and proportions','Use tabulate for categorical variables and tabulate with row or column options when comparing groups. Calculate and interpret proportions carefully, identifying the denominator used. Avoid presenting percentages without the corresponding group sizes when sample sizes differ substantially.','https://www.stata.com/manuals/rtabulateoneway.pdf',25),
 ('Descriptive Statistics and Data Exploration',3,'Group comparisons with bysort and tabstat','Use bysort and tabstat to compare attendance and assessment scores across schools, grades or programme status. Choose statistics that answer the question, and check group sizes. Explain differences descriptively without claiming that one group caused another group to perform differently.','https://www.stata.com/manuals/rtabstat.pdf',25),
 ('Descriptive Statistics and Data Exploration',4,'Exploring distributions and outliers','Use histogram, graph box and scatter to inspect distributions and unusual observations. Investigate outliers against source records rather than deleting them automatically. Select axes and labels that make the scale clear and avoid misleading visual comparisons.','https://www.stata.com/manuals/g-2graph.pdf',25),
 ('Descriptive Statistics and Data Exploration',5,'Cross-tabulations and chi-square tests','Use tabulate rowvar colvar, row chi2 to examine association between categorical variables. Check expected cell counts and understand that a chi-square test evaluates evidence of association, not causation. Report the test statistic, degrees of freedom, p-value and sample size where appropriate.','https://www.stata.com/manuals/rtabulate.pdf',30),
 ('Statistical Analysis and Regression',1,'Sampling, uncertainty and hypothesis testing','Review population, sample, parameter, estimate, null hypothesis and alternative hypothesis. Understand p-values and confidence intervals as tools for uncertainty, not measures of practical importance. Define the research question and analysis plan before choosing a statistical test.','https://www.stata.com/manuals/rttest.pdf',20),
 ('Statistical Analysis and Regression',2,'Comparing two groups with t-tests','Use ttest to compare a continuous outcome between two groups when the design and assumptions are appropriate. Inspect distributions and group sizes, distinguish paired from independent samples and report the estimated difference with uncertainty. Explain the result in plain language tied to the research question.','https://www.stata.com/manuals/rttest.pdf',25),
 ('Statistical Analysis and Regression',3,'Correlation and association','Use correlate and pwcorr to examine linear associations between numeric variables. Interpret the sign and magnitude, consider missing observations and remember that correlation does not establish causation. Use scatterplots to assess whether a linear summary is reasonable.','https://www.stata.com/manuals/rcorrelate.pdf',25),
 ('Statistical Analysis and Regression',4,'Linear regression and interpretation','Fit a linear model using regress. Interpret coefficients, standard errors, confidence intervals and model fit in the context of the outcome''s units. Check residual patterns and influential observations, distinguish association from causal claims and avoid overfitting with too many predictors.','https://www.stata.com/manuals/rregress.pdf',25),
 ('Statistical Analysis and Regression',5,'Logistic regression and responsible interpretation','Use logit or logistic when the outcome is binary. Explain odds ratios when using logistic output and distinguish odds from probabilities. Check coding of the dependent variable, interpret confidence intervals and discuss limitations such as confounding, missing data and sample size.','https://www.stata.com/manuals/rlogistic.pdf',30),
 ('Reproducible Reporting and Applied Project',1,'Writing a complete do-file','Combine import, data checks, cleaning, descriptive analysis and models into a clearly organised do-file. Use comments, meaningful names and relative paths where practical. Run the do-file from a clean Stata session to confirm that it does not depend on hidden manual steps.','https://www.stata.com/manuals/gsw.pdf',20),
 ('Reproducible Reporting and Applied Project',2,'Exporting tables and graphs','Prepare readable tables and graphs for a report. Explore Stata''s export options for tables and graphs, add titles and notes and ensure that labels and units are clear. Keep exported outputs in a dedicated results folder and retain the commands that generated them.','https://www.stata.com/manuals/',25),
 ('Reproducible Reporting and Applied Project',3,'Interpreting findings for decision-makers','Translate statistical output into concise findings. State the population and period covered, report the size of the sample, explain the direction and magnitude of results and acknowledge limitations. Avoid causal language unless the research design supports causal inference.','https://www.stata.com/links/resources-for-learning-stata/',25),
 ('Reproducible Reporting and Applied Project',4,'Quality assurance and reproducibility checks','Re-run the analysis from the raw data, compare key counts and summaries, verify that all outputs are current and check that the do-file and dataset are included in the project folder. Ask a peer to follow your documented steps and identify unclear assumptions.','https://www.stata.com/manuals/gsw.pdf',25),
 ('Reproducible Reporting and Applied Project',5,'Applied education data analysis project','Use the synthetic learner dataset to describe attendance and assessment performance, compare results by school and grade, and fit one appropriate model if assumptions and data quality permit. Submit the do-file, cleaned dataset, exported tables or graphs and a concise interpretation with limitations and recommendations.','https://nhialmabior.github.io/Nile-Analytics-Labs-Learning-Platform/resources/stata/stata_education_practice.csv',30)) as l(module_title,sort_order,title,content,resource_url,duration_minutes) on m.title=l.module_title
 where m.course_id=v_course
 on conflict(module_id,sort_order) do update set
 title=excluded.title,content=excluded.content,resource_url=excluded.resource_url,
 duration_minutes=excluded.duration_minutes,is_published=true;

 if not exists(select 1 from public.assessments where course_id=v_course and title='Stata Education Data Analysis Project') then
  insert into public.assessments(course_id,title,instructions,total_marks,is_published)
  values(v_course,'Stata Education Data Analysis Project',
  E'## Scenario\nYou are an analyst supporting a fictional education programme. Use the supplied synthetic learner dataset to prepare a reproducible analysis in Stata.\n\n## Tasks\n1. Import the CSV and save a Stata working copy without changing the original.\n2. Inspect variables, storage types, missing values, duplicates and value ranges.\n3. Document and apply defensible cleaning decisions.\n4. Generate an attendance-rate variable and label all derived variables.\n5. Produce descriptive statistics and compare attendance and assessment scores by school and grade.\n6. Create at least two well-labelled graphs.\n7. Fit one appropriate statistical model and explain its assumptions and limitations.\n8. Present three evidence-based findings and two practical recommendations.\n\n## Submit\nProvide your Stata do-file, cleaned dataset, exported tables/graphs and a 500–700 word findings report. Include a shareable link to your files and ensure the instructor can view them. The dataset is fictional; do not add personal information.\n\n## Rubric (100 marks)\nImport, inspection and data quality: 20; cleaning and documentation: 20; descriptive analysis and graphs: 20; appropriate statistical model and interpretation: 20; reproducibility, reporting and recommendations: 20.',
  100,false);
 end if;

 insert into public.quizzes(course_id,title,description,pass_mark,is_published,sort_order)
 select v_course,'Stata Foundations Checkpoint','Check your understanding of the Stata environment and reproducible workflow.',60,true,1
 where not exists(select 1 from public.quizzes q where q.course_id=v_course and q.title='Stata Foundations Checkpoint');
 select id into v_quiz from public.quizzes where course_id=v_course and title='Stata Foundations Checkpoint';
 if not exists(select 1 from public.quiz_questions where quiz_id=v_quiz) then
  insert into public.quiz_questions(quiz_id,question_text,options,sort_order) values
  (v_quiz,'Which Stata file contains a sequence of commands that can be rerun? ','["Log file","Do-file","Graph file","Dataset"]'::jsonb,1),
  (v_quiz,'Which command describes variable names and storage types?','["describe","summarize","list","clear"]'::jsonb,2),
  (v_quiz,'Which command displays summary statistics?','["browse","summarize","rename","label"]'::jsonb,3),
  (v_quiz,'What is the purpose of a working directory?','["Store passwords","Set the folder used for reading and saving project files","Change statistical significance","Delete missing values"]'::jsonb,4),
  (v_quiz,'What should a reproducible analysis preserve?','["Only screenshots","A do-file and documented data preparation steps","Only the final p-value","An edited copy without the original"]'::jsonb,5);
 end if;
 insert into public.quizzes(course_id,title,description,pass_mark,is_published,sort_order)
 select v_course,'Data Management and Cleaning Checkpoint','Practise choosing commands for importing, validating and cleaning data.',60,true,2
 where not exists(select 1 from public.quizzes q where q.course_id=v_course and q.title='Data Management and Cleaning Checkpoint');
 select id into v_quiz from public.quizzes where course_id=v_course and title='Data Management and Cleaning Checkpoint';
 if not exists(select 1 from public.quiz_questions where quiz_id=v_quiz) then
  insert into public.quiz_questions(quiz_id,question_text,options,sort_order) values
  (v_quiz,'Which command imports a delimited CSV file?','["import delimited","import graph","load csv","read data"]'::jsonb,1),
  (v_quiz,'Which command helps identify duplicate observations?','["duplicates report","misstable","describe","reshape"]'::jsonb,2),
  (v_quiz,'What should you do before replacing missing values?','["Replace all with zero","Investigate why values are missing and what they mean","Delete every incomplete row","Convert all variables to strings"]'::jsonb,3),
  (v_quiz,'Which command creates a new variable?','["generate","drop","browse","sort"]'::jsonb,4),
  (v_quiz,'Why inspect the merge indicator after a merge?','["To change variable labels","To identify matched and unmatched records","To calculate averages","To export graphs"]'::jsonb,5);
 end if;
 insert into public.quizzes(course_id,title,description,pass_mark,is_published,sort_order)
 select v_course,'Statistics and Regression Checkpoint','Review descriptive statistics, hypothesis tests and regression interpretation.',60,true,3
 where not exists(select 1 from public.quizzes q where q.course_id=v_course and q.title='Statistics and Regression Checkpoint');
 select id into v_quiz from public.quizzes where course_id=v_course and title='Statistics and Regression Checkpoint';
 if not exists(select 1 from public.quiz_questions where quiz_id=v_quiz) then
  insert into public.quiz_questions(quiz_id,question_text,options,sort_order) values
  (v_quiz,'Which command reports detailed descriptive statistics?','["summarize, detail","duplicates list","import excel","rename"]'::jsonb,1),
  (v_quiz,'What does a correlation coefficient describe?','["A guaranteed causal effect","Direction and strength of linear association","The number of missing records","The model''s sample frame"]'::jsonb,2),
  (v_quiz,'Which command fits a linear regression model?','["regress","logit","tabulate","contract"]'::jsonb,3),
  (v_quiz,'What is an important limitation of a small p-value?','["It proves causation","It does not measure practical importance or prove causation","It confirms there is no bias","It gives the sample size"]'::jsonb,4),
  (v_quiz,'Which model is commonly used for a binary outcome?','["Linear regression only","Logistic regression","Correlation only","One-way tabulation"]'::jsonb,5);
 end if;
 insert into public.quiz_answer_keys(question_id,correct_option)
 select qq.id, case qq.question_text
  when 'Which Stata file contains a sequence of commands that can be rerun? ' then 1
  when 'Which command describes variable names and storage types?' then 0
  when 'Which command displays summary statistics?' then 1
  when 'What is the purpose of a working directory?' then 1
  when 'What should a reproducible analysis preserve?' then 1
  when 'Which command imports a delimited CSV file?' then 0
  when 'Which command helps identify duplicate observations?' then 0
  when 'What should you do before replacing missing values?' then 1
  when 'Which command creates a new variable?' then 0
  when 'Why inspect the merge indicator after a merge?' then 1
  when 'Which command reports detailed descriptive statistics?' then 0
  when 'What does a correlation coefficient describe?' then 1
  when 'Which command fits a linear regression model?' then 0
  when 'What is an important limitation of a small p-value?' then 1
  when 'Which model is commonly used for a binary outcome?' then 1
  else 0 end
 from public.quiz_questions qq
 join public.quizzes q on q.id=qq.quiz_id
 where q.course_id=v_course and q.title in ('Stata Foundations Checkpoint','Data Management and Cleaning Checkpoint','Statistics and Regression Checkpoint')
 on conflict(question_id) do nothing;

 raise notice 'Stata curriculum seeded: 6 modules, 30 lessons, 3 quizzes and one draft assignment.';
end $$;

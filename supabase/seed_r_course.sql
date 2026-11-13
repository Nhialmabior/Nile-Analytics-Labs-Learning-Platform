-- Nile Analytics Labs: R Programming for Data Analysis
-- Run after lms_schema.sql, seed_excel_course.sql and quizzes_and_demo_learners.sql.
-- Safe to rerun: modules and lessons are upserted by course/order; quiz seeds are inserted once.

create unique index if not exists course_modules_course_order_uidx on public.course_modules(course_id, sort_order);
create unique index if not exists lessons_module_order_uidx on public.lessons(module_id, sort_order);

insert into public.courses(title,slug,category,description,level,duration,is_published)
values (
 'R Programming for Data Analysis','r-programming-for-data-analysis','R Programming',
 'Build a reproducible R workflow for importing, cleaning, exploring, visualising and analysing research data.',
 'Beginner to Advanced','8 weeks',false
)
on conflict(slug) do update set
 title=excluded.title,category=excluded.category,description=excluded.description,
 level=excluded.level,duration=excluded.duration,updated_at=now();

do $$
declare v_course uuid; v_module uuid; v_row record; v_quiz uuid;
begin
 select id into v_course from public.courses where slug='r-programming-for-data-analysis';

 for v_row in select * from (values
 (1,'Getting Started with R and RStudio','Install R and RStudio, understand the interface and build a reproducible project workflow.'),
 (2,'R Fundamentals and Programming','Work with objects, vectors, data types, operators, functions, conditions and iteration.'),
 (3,'Importing Data and Working with Data Frames','Import CSV and Excel files, inspect structures and understand data frames and factors.'),
 (4,'Data Wrangling with dplyr and tidyr','Filter, select, arrange, mutate, summarise, group and reshape tidy datasets.'),
 (5,'Data Cleaning and Quality Assurance','Diagnose missingness, duplicates, inconsistent categories and invalid values with documented rules.'),
 (6,'Data Visualisation with ggplot2','Build clear exploratory charts, customise scales and labels and communicate patterns responsibly.'),
 (7,'Descriptive Statistics and Statistical Modelling','Summarise data, compare groups, explore relationships and fit introductory statistical models.'),
 (8,'Reproducible Reporting and Applied Project','Create scripts and Quarto reports, export outputs and complete an applied research project.')
 ) as m(sort_order,title,description) loop
  insert into public.course_modules(course_id,title,description,sort_order)
  values(v_course,v_row.title,v_row.description,v_row.sort_order)
  on conflict(course_id,sort_order) do update set title=excluded.title,description=excluded.description
  returning id into v_module;
 end loop;

 insert into public.lessons(module_id,title,content,video_url,resource_url,duration_minutes,sort_order,is_published)
 select m.id,l.title,l.content,null,l.resource_url,l.duration_minutes,l.sort_order,true
 from public.course_modules m
 join (values
 ('Getting Started with R and RStudio',1,'What is R and why use it?','R is a programming language and environment for statistical computing, data analysis and visualisation. It is widely used in research because analyses can be scripted, reviewed and rerun. Identify a research question, the observations you need and the variables required. Distinguish a statistical tool from a reproducible analytical workflow.','https://cran.r-project.org/manuals.html',20),
 ('Getting Started with R and RStudio',2,'Installing R and RStudio','Install R from CRAN and optionally install RStudio Desktop as an integrated development environment. R is the language runtime; RStudio is an interface for writing and running code. Verify both installations, check the R version and learn how to update packages safely.','https://cran.r-project.org/',25),
 ('Getting Started with R and RStudio',3,'Tour of the RStudio interface','Explore the source editor, console, environment/history, files/plots/packages/help panes. Run a command in the console, then run the same command from a script. Learn the difference between the current working directory and the folder where your project files are stored.','https://docs.posit.co/ide/user/',25),
 ('Getting Started with R and RStudio',4,'Projects, folders and working directories','Create an RStudio Project for your analysis. Organise data, scripts, outputs and documentation into separate folders. Prefer project-relative file paths over machine-specific absolute paths. Save your script and restart R to check that the project opens in a clean state.','https://docs.posit.co/ide/user/',25),
 ('Getting Started with R and RStudio',5,'Packages, help and CRAN','Install packages with install.packages, load them with library and inspect documentation with ?function_name and help.search. Understand that packages extend base R. Record package names and versions used in a project, and install only packages from trusted sources.','https://cran.r-project.org/web/packages/',30),

 ('R Fundamentals and Programming',1,'Objects, assignment and naming','Create objects with <- and =, inspect them with print and str, and remove objects with rm. Use descriptive names that communicate meaning. Practise assigning text, numbers and logical values. Understand that R is case-sensitive and that object names should not contain spaces.','https://cran.r-project.org/doc/manuals/r-release/R-intro.html',20),
 ('R Fundamentals and Programming',2,'Atomic vectors and data types','Create numeric, character, integer and logical vectors with c(). Inspect types with class, typeof and is.* functions. Learn vectorised operations and recycling rules. Check vector lengths before combining values so that unintended recycling does not silently distort results.','https://cran.r-project.org/doc/manuals/r-release/R-intro.html',25),
 ('R Fundamentals and Programming',3,'Matrices, lists and factors','Compare vectors, matrices, lists and factors. Create a matrix with matrix(), a list with list() and a categorical factor with factor(). Use factors for categories with defined levels, and inspect their labels and levels before modelling or plotting.','https://cran.r-project.org/doc/manuals/r-release/R-intro.html',25),
 ('R Fundamentals and Programming',4,'Indexing, operators and logical conditions','Select elements with square brackets, use positive and negative indices and combine conditions with &, | and !. Practise comparison and arithmetic operators. Use which() when you need positions matching a condition and check boundary cases such as empty results.','https://cran.r-project.org/doc/manuals/r-release/R-intro.html',25),
 ('R Fundamentals and Programming',5,'Functions, conditions and iteration','Write a function with function(), return values and arguments. Use if/else for decisions and for loops for repeated tasks. Prefer clear, testable functions over duplicated code. Practise with a function that calculates attendance percentage while safely handling a zero denominator.','https://cran.r-project.org/doc/manuals/r-release/R-intro.html',30),

 ('Importing Data and Working with Data Frames',1,'Importing CSV files','Read a CSV file with read.csv() or readr::read_csv(). Inspect the imported object with head(), names(), dim() and str(). Check that missing values, delimiters, decimal marks and column names were interpreted correctly. Preserve a copy of the original source file.','https://readr.tidyverse.org/reference/read_delim.html',20),
 ('Importing Data and Working with Data Frames',2,'Importing Excel and other formats','Use readxl::read_excel() to import an Excel worksheet. Confirm sheet names and column types rather than relying on guesses. Learn when to use CSV for portable exchange and when an Excel workbook may contain multiple sheets or formatting that needs careful handling.','https://readxl.tidyverse.org/',25),
 ('Importing Data and Working with Data Frames',3,'Understanding data frames and tibbles','Inspect rows, columns and variable types in a data frame. Compare base data.frame objects with tibble objects. Use glimpse(), names(), nrow(), ncol() and summary() to understand structure. Keep one observation per row and one variable per column for tidy analysis.','https://tibble.tidyverse.org/',25),
 ('Importing Data and Working with Data Frames',4,'Variable types, dates and factors','Convert variables deliberately with as.numeric(), as.character(), as.Date() and factor(). Check conversion warnings and missing values introduced by coercion. Parse dates using an explicit format and set factor levels in a meaningful order for reporting.','https://lubridate.tidyverse.org/',25),
 ('Importing Data and Working with Data Frames',5,'Selecting, filtering and ordering records','Use base R indexing and dplyr::select(), filter() and arrange() to choose columns, rows and sort order. Apply multiple conditions and confirm the number of records retained. Save subsets as new objects rather than overwriting raw imported data.','https://dplyr.tidyverse.org/reference/',30),

 ('Data Wrangling with dplyr and tidyr',1,'The pipe and readable workflows','Use the native pipe |> or magrittr pipe %>% to express a sequence of transformations. Read a pipeline from left to right and break long operations into meaningful steps. Keep intermediate outputs when they make the workflow easier to validate and explain.','https://dplyr.tidyverse.org/',20),
 ('Data Wrangling with dplyr and tidyr',2,'Mutating and creating variables','Use mutate() to create or transform variables. Combine arithmetic, conditional logic and functions such as if_else() and case_when(). Name derived variables clearly, document their units and check calculations against a few manually verified records.','https://dplyr.tidyverse.org/reference/mutate.html',25),
 ('Data Wrangling with dplyr and tidyr',3,'Grouping and summarising data','Use group_by() and summarise() to calculate counts, means, medians and totals by school, grade or programme. Use n() and na.rm=TRUE where appropriate. Check group sizes and ensure missing values do not silently change denominators.','https://dplyr.tidyverse.org/reference/summarise.html',25),
 ('Data Wrangling with dplyr and tidyr',4,'Joining datasets safely','Use left_join(), inner_join() and full_join() to combine datasets using a key. Check key uniqueness and inspect unmatched records. Understand how duplicate keys can multiply rows in a join. Keep a record of the join type and the number of rows before and after.','https://dplyr.tidyverse.org/reference/mutate-joins.html',25),
 ('Data Wrangling with dplyr and tidyr',5,'Reshaping data with tidyr','Use pivot_longer() and pivot_wider() to reshape between wide and long formats. Identify the variables that define each observation and ensure that the combination of identifier columns uniquely identifies records when widening.','https://tidyr.tidyverse.org/',30),

 ('Data Cleaning and Quality Assurance',1,'Understanding missing data','Identify missing values with is.na(), sum(is.na()) and tidyr::replace_na() where justified. Distinguish unknown, not applicable and true zero values. Explore missingness by important groups and document why any record or value is excluded or transformed.','https://tidyr.tidyverse.org/reference/replace_na.html',20),
 ('Data Cleaning and Quality Assurance',2,'Detecting and resolving duplicates','Use duplicated(), distinct() and count() to detect repeated rows or keys. Determine whether duplicates are data-entry errors or legitimate repeated observations. Do not remove records solely because all values look similar; establish the correct unit of analysis first.','https://dplyr.tidyverse.org/reference/distinct.html',25),
 ('Data Cleaning and Quality Assurance',3,'Cleaning inconsistent text categories','Standardise whitespace and case with trimws(), stringr::str_trim() and str_to_lower(). Recode inconsistent categories using case_when() or recode(). Compare frequency tables before and after cleaning and preserve original fields when transformations could affect interpretation.','https://stringr.tidyverse.org/',25),
 ('Data Cleaning and Quality Assurance',4,'Outliers, ranges and validation rules','Use summary(), quantile() and boxplots to flag unusual values. Apply domain checks such as attendance days not exceeding enrolled days and scores staying within the assessment scale. Investigate flagged records against source data instead of deleting them automatically.','https://dplyr.tidyverse.org/reference/filter.html',25),
 ('Data Cleaning and Quality Assurance',5,'Building a data quality report','Create a repeatable set of checks for row counts, missing values, unique IDs, valid categories and numeric ranges. Use stopifnot() or assertions for critical rules. Save a cleaned dataset separately and write a short log describing decisions, unresolved issues and limitations.','https://cran.r-project.org/doc/manuals/r-release/R-intro.html',30),

 ('Data Visualisation with ggplot2',1,'Grammar of graphics and first plot','Understand data, aesthetics, geometric layers, scales and coordinate systems. Build a first chart with ggplot(data, aes(...)) + geom_point() or geom_bar(). Match the geometry to the variable types and the question being answered.','https://ggplot2.tidyverse.org/',20),
 ('Data Visualisation with ggplot2',2,'Bar charts and distributions','Use geom_bar() for counts and geom_col() for precomputed values. Explore numeric distributions with geom_histogram() and geom_boxplot(). Label axes with units and choose bin widths that reveal structure without exaggerating noise.','https://ggplot2.tidyverse.org/reference/',25),
 ('Data Visualisation with ggplot2',3,'Scatterplots and relationships','Use geom_point() to explore relationships between numeric variables and geom_smooth() to add a descriptive trend. Check for overplotting, unusual observations and non-linear patterns. Describe association carefully and avoid implying causation from a chart.','https://ggplot2.tidyverse.org/reference/geom_point.html',25),
 ('Data Visualisation with ggplot2',4,'Facets, scales and themes','Use facet_wrap() or facet_grid() to compare subgroups. Apply readable scales, consistent limits and a restrained theme. Avoid inconsistent axis scales that make group comparisons misleading. Use captions to explain data sources and important caveats.','https://ggplot2.tidyverse.org/reference/facet_wrap.html',25),
 ('Data Visualisation with ggplot2',5,'Exporting publication-ready graphics','Use ggsave() to export plots with appropriate dimensions and resolution. Check that labels remain readable and colours are accessible. Save the code that generates each graphic and include a clear filename, date or version in the project output folder.','https://ggplot2.tidyverse.org/reference/ggsave.html',30),

 ('Descriptive Statistics and Statistical Modelling',1,'Descriptive statistics in R','Calculate mean(), median(), sd(), quantile() and summary() for appropriate variables. Use na.rm=TRUE only after understanding missingness. Report sample sizes and units, and choose statistics that match the distribution and research question.','https://stat.ethz.ch/R-manual/R-devel/library/base/html/summary.html',20),
 ('Descriptive Statistics and Statistical Modelling',2,'Frequency tables and group summaries','Use table(), prop.table() and dplyr summaries to describe categorical and grouped data. Make denominators explicit when reporting percentages. Compare groups descriptively and distinguish differences in observed data from evidence of an underlying effect.','https://dplyr.tidyverse.org/reference/summarise.html',25),
 ('Descriptive Statistics and Statistical Modelling',3,'Correlation and hypothesis tests','Use cor() and cor.test() to examine linear association, and t.test() for suitable two-group comparisons. Check assumptions, sample size and missingness. Interpret p-values alongside effect sizes and confidence intervals, not as proof that a hypothesis is true or false.','https://stat.ethz.ch/R-manual/R-devel/library/stats/html/cor.test.html',25),
 ('Descriptive Statistics and Statistical Modelling',4,'Linear regression with lm()','Fit a linear model with lm() and inspect results with summary(). Interpret coefficients in outcome units, review residual diagnostics and consider confounding and model assumptions. Avoid causal claims unless the study design justifies them.','https://stat.ethz.ch/R-manual/R-devel/library/stats/html/lm.html',25),
 ('Descriptive Statistics and Statistical Modelling',5,'Interpreting models responsibly','Compare model estimates, uncertainty and practical significance. Check residuals, influential observations and multicollinearity where relevant. Explain limitations such as selection bias, measurement error, missing data and small samples in plain language for decision-makers.','https://cran.r-project.org/doc/manuals/r-release/R-intro.html',30),

 ('Reproducible Reporting and Applied Project',1,'Writing clean and reusable R scripts','Organise scripts into setup, import, cleaning, analysis and export sections. Use comments, meaningful object names and functions for repeated tasks. Restart R and run the script from the beginning to ensure it does not rely on objects left in the environment.','https://style.tidyverse.org/',20),
 ('Reproducible Reporting and Applied Project',2,'Quarto reports and analytical narratives','Create a Quarto document that combines explanatory text, R code and generated results. Use headings, code chunks, tables and figures to tell a coherent analytical story. Render the report from source files and check that the output can be regenerated.','https://quarto.org/docs/get-started/',25),
 ('Reproducible Reporting and Applied Project',3,'Exporting tables and project outputs','Export cleaned data with write.csv() or readr::write_csv(), save plots with ggsave() and organise report outputs. Use descriptive filenames and preserve scripts, input data and documentation. Never overwrite original source data with derived outputs.','https://readr.tidyverse.org/reference/write_delim.html',25),
 ('Reproducible Reporting and Applied Project',4,'Quality review and communicating findings','Review the analysis question, data provenance, cleaning log, code, charts and conclusions. Check that reported values match the code output. Present findings with context, uncertainty and limitations, and make recommendations proportional to the evidence.','https://quarto.org/docs/',25),
 ('Reproducible Reporting and Applied Project',5,'Capstone: education data analysis in R','Use the synthetic education dataset to import and audit records, clean documented data-quality issues, calculate attendance rates, summarise scores by school and grade, create at least two ggplot2 charts and fit one suitable model if assumptions permit. Submit your R script or Quarto report, cleaned dataset, figures and a concise interpretation with limitations.','https://nhialmabior.github.io/Nile-Analytics-Labs-Learning-Platform/resources/r/r_education_practice.csv',35)
 ) as l(module_title,sort_order,title,content,resource_url,duration_minutes) on m.title=l.module_title
 where m.course_id=v_course
 on conflict(module_id,sort_order) do update set
 title=excluded.title,content=excluded.content,resource_url=excluded.resource_url,
 duration_minutes=excluded.duration_minutes,is_published=true;

 insert into public.assessments(course_id,title,instructions,total_marks,is_published)
 select v_course,'R Education Data Analysis Capstone',
 'Analyse the supplied synthetic education dataset in R. Submit: (1) a reproducible R script or Quarto report; (2) a data-quality and cleaning log; (3) a cleaned dataset; (4) at least two clearly labelled visualisations; (5) descriptive statistics and one appropriate inferential or regression analysis where assumptions permit; and (6) a 700–1,000 word findings report explaining methods, results, limitations and recommendations. Do not claim causation from observational data.',
 100,false
 where not exists(select 1 from public.assessments a where a.course_id=v_course and a.title='R Education Data Analysis Capstone');

 insert into public.quizzes(course_id,title,description,pass_mark,is_published,sort_order)
 select v_course,x.title,x.description,60,true,x.sort_order
 from (values
 ('R Foundations Checkpoint','Test R objects, data types, vectors, functions and project workflows.',1),
 ('Data Wrangling and Cleaning Checkpoint','Check importing, tidy data, joins, missing values and data validation.',2),
 ('Visualisation and Statistics Checkpoint','Review ggplot2, descriptive statistics, hypothesis testing and regression.',3)
 ) x(title,description,sort_order)
 where not exists(select 1 from public.quizzes q where q.course_id=v_course and q.title=x.title);

 for v_quiz in select id from public.quizzes where course_id=v_course and title in (
 'R Foundations Checkpoint','Data Wrangling and Cleaning Checkpoint','Visualisation and Statistics Checkpoint'
 ) loop
  if not exists(select 1 from public.quiz_questions where quiz_id=v_quiz) then
   if (select title from public.quizzes where id=v_quiz)='R Foundations Checkpoint' then
    insert into public.quiz_questions(quiz_id,question_text,options,sort_order) values
    (v_quiz,'Which function combines values into a vector?','["data.frame()","c()","list.files()","library()"]',1),
    (v_quiz,'Which assignment operator is commonly used in R?','["<-","=>","::=","**"]',2),
    (v_quiz,'Which function displays an object structure?','["str()","plot()","mean()","install.packages()"]',3),
    (v_quiz,'What does library(ggplot2) do?','["Deletes a package","Loads an installed package","Installs R itself","Imports a CSV file"]',4),
    (v_quiz,'Why use an RStudio Project?','["To make code reproducible with project-based paths","To hide all variables","To replace R","To automatically clean every dataset"]',5);
   elsif (select title from public.quizzes where id=v_quiz)='Data Wrangling and Cleaning Checkpoint' then
    insert into public.quiz_questions(quiz_id,question_text,options,sort_order) values
    (v_quiz,'Which dplyr function filters rows using conditions?','["select()","filter()","mutate()","arrange()"]',1),
    (v_quiz,'Which function creates or changes columns in dplyr?','["mutate()","summarise()","glimpse()","distinct()"]',2),
    (v_quiz,'What should you establish before removing duplicate records?','["That every repeated value is an error","The correct unit of analysis and key","That the file is large","That rows are sorted alphabetically"]',3),
    (v_quiz,'Which tidyr function converts wide data to long data?','["pivot_wider()","pivot_longer()","separate_rows()","drop_na()"]',4),
    (v_quiz,'What is a responsible approach to missing values?','["Replace all missing values with zero","Delete every row with any missing value","Investigate why values are missing before deciding","Ignore missingness in every analysis"]',5);
   else
    insert into public.quiz_questions(quiz_id,question_text,options,sort_order) values
    (v_quiz,'Which ggplot2 layer is commonly used for a scatterplot?','["geom_point()","geom_bar()","geom_histogram()","geom_tile()"]',1),
    (v_quiz,'Which function fits a linear model in base R?','["glmnet()","lm()","t.test()","cor()"]',2),
    (v_quiz,'What does a p-value NOT establish by itself?','["Evidence relative to a null model","The probability the null hypothesis is true","A result under stated assumptions","A measure used in hypothesis testing"]',3),
    (v_quiz,'Which function exports a ggplot graphic?','["ggsave()","read_csv()","mutate()","summary()"]',4),
    (v_quiz,'What is the correct interpretation of correlation?','["It proves one variable causes another","It measures association, not causation","It always implies a linear model is valid","It removes confounding automatically"]',5);
   end if;
  end if;
 end loop;

 insert into public.quiz_answer_keys(question_id,correct_option)
 select qq.id,case qq.question_text
  when 'Which function combines values into a vector?' then 1
  when 'Which assignment operator is commonly used in R?' then 0
  when 'Which function displays an object structure?' then 0
  when 'What does library(ggplot2) do?' then 1
  when 'Why use an RStudio Project?' then 0
  when 'Which dplyr function filters rows using conditions?' then 1
  when 'Which function creates or changes columns in dplyr?' then 0
  when 'What should you establish before removing duplicate records?' then 1
  when 'Which tidyr function converts wide data to long data?' then 1
  when 'What is a responsible approach to missing values?' then 2
  when 'Which ggplot2 layer is commonly used for a scatterplot?' then 0
  when 'Which function fits a linear model in base R?' then 1
  when 'What does a p-value NOT establish by itself?' then 1
  when 'Which function exports a ggplot graphic?' then 0
  when 'What is the correct interpretation of correlation?' then 1
 end
 from public.quiz_questions qq
 where qq.quiz_id in(select id from public.quizzes where course_id=v_course)
 on conflict(question_id) do nothing;
end $$;

-- Keep R unpublished until an administrator reviews the course and publishes it.

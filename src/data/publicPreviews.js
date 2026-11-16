export const publicPreviews = {
  'excel-for-data-analysis': {
    module: 'Data Cleaning and Preparation',
    title: 'A First Look at Cleaning Data in Excel',
    duration: '12 minutes',
    introduction: 'Data analysis begins with trustworthy data. Before calculating totals or building charts, inspect the worksheet for missing values, inconsistent labels, duplicate records and formatting problems.',
    objectives: ['Identify common data-quality problems in a worksheet', 'Use TRIM to remove unwanted spaces from text', 'Use Remove Duplicates carefully and verify the result'],
    sections: [
      { heading: '1. Inspect the dataset', body: 'Imagine a small survey table with columns for Respondent, County and Age. Scan each column for blank cells, unexpected spellings such as “Nairobi ” with a trailing space, and repeated respondent IDs. Keep an unchanged copy of the original data before making corrections.' },
      { heading: '2. Remove extra spaces', body: 'Excel’s TRIM function removes leading and trailing spaces and reduces repeated spaces between words. If a county name is in cell B2, enter =TRIM(B2) in a helper column, fill the formula down, then copy the cleaned results and use Paste Special → Values if you need to replace the original values.' },
      { heading: '3. Check duplicate records', body: 'Select the dataset and choose Data → Remove Duplicates. Select the columns that define a duplicate record. Do not remove rows based on a name alone if two different respondents can share that name. Review the duplicate count and keep a backup.' }
    ],
    takeaway: 'A clean dataset is not simply one with fewer rows. Every change should be explainable, repeatable and checked against the original data.',
    practice: 'Create a small table with five survey records. Add one trailing space to a county name and duplicate one respondent ID. Use TRIM and Remove Duplicates, then write down what changed.'
  },
  'stata-for-data-analysis': {
    module: 'Stata Foundations and Research Workflow',
    title: 'Your First Data Inspection in Stata',
    duration: '12 minutes',
    introduction: 'Stata supports a reproducible research workflow: import a dataset, inspect its structure, check data quality and document the commands used.',
    objectives: ['Open a dataset and inspect its structure', 'Distinguish variables from observations', 'Use basic commands to understand a dataset'],
    sections: [
      { heading: '1. Load a dataset', body: 'For a Stata-format dataset, use use "survey_data.dta", clear. The clear option tells Stata to replace data currently held in memory. Save important work before clearing it. For a CSV file, use import delimited "survey_data.csv", clear.' },
      { heading: '2. Inspect rows and columns', body: 'Run describe to view variable names, storage types and labels. Run count to see the number of observations. Run list in 1/10 to inspect the first ten rows. These checks help you understand what was imported before analysis.' },
      { heading: '3. Summarise numeric variables', body: 'Use summarize age income to obtain the number of non-missing observations, mean, standard deviation, minimum and maximum for the selected variables. Use tabulate county to examine the frequency of categories.' }
    ],
    takeaway: 'Start every analysis by checking what is in the data. A few inspection commands can reveal import problems before they affect your results.',
    practice: 'Open a practice dataset and run describe, count, list in 1/10 and summarize. Record the number of observations and identify one variable that needs further checking.'
  },
  'r-programming-for-data-analysis': {
    module: 'R Fundamentals and Programming',
    title: 'Working with Your First Data Frame in R',
    duration: '12 minutes',
    introduction: 'A data frame is one of the most common structures used in R for data analysis. It stores observations in rows and variables in columns.',
    objectives: ['Create a simple data frame', 'Inspect rows, columns and variable types', 'Calculate a basic summary'],
    sections: [
      { heading: '1. Create a data frame', body: 'You can create a small dataset directly in R: survey <- data.frame(respondent = c(1, 2, 3), county = c("Nairobi", "Turkana", "Juba"), age = c(24, 31, 28)). Each vector becomes a column and each position becomes an observation.' },
      { heading: '2. Inspect the structure', body: 'Run head(survey) to preview rows, names(survey) to list column names, and str(survey) to inspect the structure and data types. Use nrow(survey) and ncol(survey) to count observations and variables.' },
      { heading: '3. Summarise a variable', body: 'Run summary(survey$age) to see minimum, first quartile, median, mean, third quartile and maximum. For a quick average, use mean(survey$age). If values may be missing, use mean(survey$age, na.rm = TRUE).' }
    ],
    takeaway: 'Inspect the structure before analysing. Knowing whether a column is numeric, text or a factor helps you choose appropriate operations.',
    practice: 'Create a data frame with at least five respondents, their county and age. Use str(), head() and summary() to inspect it.'
  },
  'spss-for-data-analysis': {
    module: 'SPSS Foundations and Research Workflow',
    title: 'Understanding Variables in SPSS',
    duration: '12 minutes',
    introduction: 'Before running statistics in SPSS, define what each variable represents and how its values should be interpreted. Good variable setup makes later analysis more reliable.',
    objectives: ['Understand the Data View and Variable View', 'Set variable names, labels and measurement levels', 'Run a simple frequency table'],
    sections: [
      { heading: '1. Data View and Variable View', body: 'Data View displays the dataset as a spreadsheet: rows represent cases and columns represent variables. Variable View describes each column, including its name, type, label, value labels, missing-value settings and measurement level.' },
      { heading: '2. Define variables clearly', body: 'Use short, meaningful variable names such as age or county. Add a descriptive label such as “Age of respondent in completed years”. For a coded gender variable, value labels can explain what each numeric code represents. Set the measurement level to Nominal, Ordinal or Scale according to the variable.' },
      { heading: '3. Produce a frequency table', body: 'Choose Analyze → Descriptive Statistics → Frequencies. Move a categorical variable such as county into the Variables box and select OK. Review the frequency and valid-percent columns, and check whether missing values are reported.' }
    ],
    takeaway: 'Clear variable definitions reduce confusion and make output easier for another researcher to understand and reproduce.',
    practice: 'Create variables for respondent ID, county and age. Add clear labels, set suitable measurement levels, enter five cases and generate a frequency table for county.'
  }
}

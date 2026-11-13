# Stata education practice dataset

This is a **synthetic teaching dataset** created for the Nile Analytics Labs Stata for Data Analysis course. It contains no real learner or household records.

## Download

[Download the CSV dataset](./stata_education_practice.csv)

Live URL after GitHub Pages deployment:

https://nhialmabior.github.io/Nile-Analytics-Labs-Learning-Platform/resources/stata/stata_education_practice.csv

## Variables

| Variable | Description |
|---|---|
| Student_ID | Fictional learner identifier |
| School | Fictional school name |
| County | Administrative location |
| Gender | Fictional learner category |
| Age | Age in years |
| Grade | Grade level |
| Attendance_Days | Days attended during the reporting period |
| Enrolled_Days | Days the learner was expected to attend |
| Assessment_Score | Score on a 0–100 scale |
| Programme_Status | Fictional programme participation category |
| Household_Income_KES | Synthetic household income amount in Kenyan shillings |

## Intentional data-quality issues

The file contains 60 unique synthetic learner identifiers plus one duplicated record. Some values are blank by design, including attendance, assessment score, gender and programme status. These issues are intended for cleaning exercises. Do not assume every blank should be replaced with zero.

## Suggested Stata exercises

```stata
import delimited "stata_education_practice.csv", clear
describe
codebook
summarize
misstable summarize
duplicates report Student_ID
tabulate School
generate attendance_rate = Attendance_Days / Enrolled_Days
summarize attendance_rate Assessment_Score, detail
bysort School: summarize Assessment_Score
histogram Assessment_Score
graph box Assessment_Score, over(Grade)
save "stata_education_cleaning_practice.dta", replace
```

Check the variable storage types after import. Some versions or settings may import numeric-looking fields as strings if the source contains missing or inconsistent values; inspect and convert only after checking the data. Document every cleaning decision and preserve an untouched copy of the original CSV.

# SPSS Education Survey Practice Dataset

This is a fully synthetic practice dataset for the Nile Analytics Labs SPSS course. It contains 80 fictional learner records plus one deliberately duplicated row (81 data rows total). No real learner or household information is included.

## Columns
- `Learner_ID`: fictional record identifier
- `School`, `County`: school and county categories
- `Gender`: category; some values are intentionally blank
- `Age`, `Grade`: learner age and grade
- `Attendance_Days`, `Enrolled_Days`: attendance counts; some values are intentionally blank
- `Assessment_Score`: score from 0 to 100; some values are intentionally blank
- `Programme_Status`: Active, Completed or At risk
- `Household_Income_KES`: fictional household income band proxy in KES

## Practice tasks
1. Import the CSV and define variable labels and measurement levels in Variable View.
2. Identify missing values, duplicate IDs and invalid ranges.
3. Produce frequency tables for categorical variables and descriptive statistics for scale variables.
4. Create crosstabs and visualisations to explore patterns by school, county and grade.
5. Choose an appropriate inferential test, check assumptions and explain limitations.
6. Save a cleaned .sav file and an SPSS syntax file so the workflow can be reproduced.

The duplicate and missing values are intentional teaching examples. Do not remove or impute values without documenting and justifying the decision.
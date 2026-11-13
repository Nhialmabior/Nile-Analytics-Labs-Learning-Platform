# R Programming Practice Dataset

This synthetic dataset is designed for the Nile Analytics Labs R Programming for Data Analysis course.

- 80 fictional learner records plus one deliberately duplicated record
- No real people or personal records are represented
- Missing values are intentionally included in selected fields
- File: `r_education_practice.csv`

## Variables

| Variable | Description |
|---|---|
| Learner_ID | Synthetic learner identifier |
| School | Fictional school name |
| County | Fictional study county |
| Gender | Gender category; some values are missing |
| Age | Learner age in years |
| Grade | School grade |
| Attendance_Days | Days attended; selected values are missing |
| Enrolled_Days | Days enrolled |
| Assessment_Score | Score on a 0–100 scale; selected values are missing |
| Programme_Status | Programme participation status |
| Household_Income_KES | Synthetic household income amount in KES |

## Suggested R workflow

```r
library(readr)
library(dplyr)
library(ggplot2)

data <- read_csv("r_education_practice.csv")
glimpse(data)
summary(data)

# Audit missing values and duplicate identifiers
colSums(is.na(data))
data |> count(Learner_ID) |> filter(n > 1)

# Create an attendance rate only where the denominator is valid
clean_data <- data |>
  distinct(Learner_ID, .keep_all = TRUE) |>
  mutate(
    Attendance_Rate = if_else(
      !is.na(Attendance_Days) & Enrolled_Days > 0,
      Attendance_Days / Enrolled_Days * 100,
      NA_real_
    )
  )

# Summarise assessment scores by school
clean_data |>
  group_by(School) |>
  summarise(
    Learners = n(),
    Mean_Score = mean(Assessment_Score, na.rm = TRUE),
    .groups = "drop"
  )

# Visualise scores
ggplot(clean_data, aes(x = School, y = Assessment_Score)) +
  geom_boxplot() +
  coord_flip() +
  labs(title = "Assessment scores by school",
       x = "School", y = "Assessment score")
```

## Data quality tasks

1. Identify the duplicate learner identifier and explain how you handled it.
2. Report missing values by variable and discuss their possible implications.
3. Check that attendance does not exceed enrolled days.
4. Explain how missing assessment scores affect group summaries.
5. Preserve the raw CSV and save a separate cleaned dataset.

Use the data for learning and demonstration only. Do not interpret synthetic patterns as evidence about real schools or communities.

export const courses = [
  {
    id: 1,
    slug: 'excel-for-data-analysis',
    title: 'Excel for Data Analysis',
    category: 'Excel',
    level: 'Beginner to Intermediate',
    duration: '6 weeks',
    lessons: 32,
    students: 128,
    rating: 4.9,
    accent: 'excel',
    icon: '▦',
    description: 'Build practical Excel skills for cleaning, analyzing, visualizing and presenting real-world data.',
    modules: [
      { title: 'Introduction to Excel', lessons: 4 },
      { title: 'Data Entry and Organisation', lessons: 4 },
      { title: 'Essential Formulas and Functions', lessons: 4 },
      { title: 'Data Cleaning and Preparation', lessons: 4 },
      { title: 'Data Analysis Functions', lessons: 4 },
      { title: 'Sorting, Filtering and PivotTables', lessons: 4 },
      { title: 'Data Visualisation and Dashboards', lessons: 4 },
      { title: 'Final Practical Data Analysis Project', lessons: 4 }
    ]
  },
  {
    id: 2,
    slug: 'stata-for-data-analysis',
    title: 'Stata for Data Analysis',
    category: 'Stata',
    level: 'Intermediate',
    duration: '6 weeks',
    lessons: 30,
    students: 96,
    rating: 4.8,
    accent: 'stata',
    icon: '∑',
    description: 'Learn data management, descriptive statistics, regression and reporting using Stata.',
    modules: [
      { title: 'Stata Foundations and Research Workflow', lessons: 5 },
      { title: 'Importing, Inspecting and Managing Data', lessons: 5 },
      { title: 'Data Cleaning and Transformation', lessons: 5 },
      { title: 'Descriptive Statistics and Data Exploration', lessons: 5 },
      { title: 'Statistical Analysis and Regression', lessons: 5 },
      { title: 'Reproducible Reporting and Applied Project', lessons: 5 }
    ]
  },
  {
    id: 3,
    slug: 'r-programming-for-data-analysis',
    title: 'R Programming for Data Analysis',
    category: 'R Programming',
    level: 'Beginner to Advanced',
    duration: '8 weeks',
    lessons: 40,
    students: 142,
    rating: 4.9,
    accent: 'r',
    icon: 'R',
    description: 'Learn R from the foundations through data manipulation, visualization and statistical analysis.',
    modules: [
      { title: 'Getting Started with R and RStudio', lessons: 5 },
      { title: 'R Fundamentals and Programming', lessons: 5 },
      { title: 'Importing Data and Working with Data Frames', lessons: 5 },
      { title: 'Data Wrangling with dplyr and tidyr', lessons: 5 },
      { title: 'Data Cleaning and Quality Assurance', lessons: 5 },
      { title: 'Data Visualisation with ggplot2', lessons: 5 },
      { title: 'Descriptive Statistics and Statistical Modelling', lessons: 5 },
      { title: 'Reproducible Reporting and Applied Project', lessons: 5 }
    ]
  },
  {
    id: 4,
    slug: 'spss-for-data-analysis',
    title: 'SPSS for Data Analysis',
    category: 'SPSS',
    level: 'Beginner to Intermediate',
    duration: '8 weeks',
    lessons: 40,
    students: 114,
    rating: 4.8,
    accent: 'spss',
    icon: 'S',
    description: 'Develop practical SPSS skills for survey data, descriptive statistics and inferential analysis.',
    modules: [
      { title: 'SPSS Foundations and Research Workflow', lessons: 5 },
      { title: 'Data Entry, Importing and Variable Setup', lessons: 5 },
      { title: 'Data Cleaning and Data Quality', lessons: 5 },
      { title: 'Descriptive Statistics and Data Exploration', lessons: 5 },
      { title: 'Data Transformation and Management', lessons: 5 },
      { title: 'Inferential Statistics and Hypothesis Testing', lessons: 5 },
      { title: 'Regression and Advanced Analysis', lessons: 5 },
      { title: 'Research Reporting and Applied SPSS Project', lessons: 5 }
    ]
  }
]

export const featuredCourses = courses.slice(0, 4)
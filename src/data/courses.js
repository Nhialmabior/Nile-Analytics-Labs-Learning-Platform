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
      { title: 'Getting Started with Excel', lessons: 5 },
      { title: 'Data Cleaning & Preparation', lessons: 7 },
      { title: 'Formulas & Functions', lessons: 8 },
      { title: 'PivotTables & Charts', lessons: 7 },
      { title: 'Dashboard Project', lessons: 5 }
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
      { title: 'Stata Interface & Commands', lessons: 5 },
      { title: 'Data Management', lessons: 7 },
      { title: 'Descriptive Statistics', lessons: 6 },
      { title: 'Regression Analysis', lessons: 7 },
      { title: 'Applied Research Project', lessons: 5 }
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
      { title: 'R Fundamentals', lessons: 7 },
      { title: 'Data Frames & Tidy Data', lessons: 8 },
      { title: 'Data Cleaning with R', lessons: 8 },
      { title: 'Data Visualization', lessons: 9 },
      { title: 'Statistics & Final Project', lessons: 8 }
    ]
  },
  {
    id: 4,
    slug: 'spss-for-data-analysis',
    title: 'SPSS for Data Analysis',
    category: 'SPSS',
    level: 'Beginner to Intermediate',
    duration: '6 weeks',
    lessons: 34,
    students: 114,
    rating: 4.8,
    accent: 'spss',
    icon: 'S',
    description: 'Develop practical SPSS skills for survey data, descriptive statistics and inferential analysis.',
    modules: [
      { title: 'SPSS Fundamentals', lessons: 6 },
      { title: 'Data Entry & Cleaning', lessons: 7 },
      { title: 'Descriptive Analysis', lessons: 7 },
      { title: 'Inferential Statistics', lessons: 8 },
      { title: 'Research Analysis Project', lessons: 6 }
    ]
  }
]

export const featuredCourses = courses.slice(0, 4)
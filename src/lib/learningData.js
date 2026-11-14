import { supabase } from './supabase'

const courseVisuals = {
  Excel: { accent: 'excel', icon: '▦' },
  Stata: { accent: 'stata', icon: '∑' },
  'R Programming': { accent: 'r', icon: 'R' },
  SPSS: { accent: 'spss', icon: 'S' }
}

// Returns only the signed-in learner's real enrollments and lesson activity.
// No demo course list or hard-coded progress values are used here.
export async function loadLearnerCourses(learnerId) {
  if (!learnerId) return []

  const { data: enrollmentRows, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id, course_id, status, enrolled_at, courses(id, title, slug, category, level, duration)')
    .eq('learner_id', learnerId)
    .in('status', ['active', 'completed'])
    .order('enrolled_at', { ascending: false })

  if (enrollmentError) throw enrollmentError

  const enrollments = (enrollmentRows || []).filter(row => row.courses)
  if (!enrollments.length) return []

  const courseIds = [...new Set(enrollments.map(row => row.course_id))]
  const { data: moduleRows, error: moduleError } = await supabase
    .from('course_modules')
    .select('id, course_id, sort_order, lessons(id, title, sort_order, is_published)')
    .in('course_id', courseIds)
    .order('sort_order', { ascending: true })

  if (moduleError) throw moduleError

  const lessonsByCourse = new Map(courseIds.map(id => [id, []]))
  for (const module of moduleRows || []) {
    const lessons = (module.lessons || [])
      .filter(lesson => lesson.is_published)
      .sort((a, b) => a.sort_order - b.sort_order)
    lessonsByCourse.get(module.course_id)?.push(...lessons)
  }

  const allLessonIds = [...new Set(
    [...lessonsByCourse.values()].flat().map(lesson => lesson.id)
  )]

  let completedIds = new Set()
  if (allLessonIds.length) {
    const { data: progressRows, error: progressError } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('learner_id', learnerId)
      .in('lesson_id', allLessonIds)

    if (progressError) throw progressError
    completedIds = new Set((progressRows || []).map(row => row.lesson_id))
  }

  return enrollments.map(enrollment => {
    const course = enrollment.courses
    const lessons = lessonsByCourse.get(enrollment.course_id) || []
    const completedLessons = lessons.filter(lesson => completedIds.has(lesson.id)).length
    const progress = lessons.length
      ? Math.round((completedLessons / lessons.length) * 100)
      : 0
    const nextLesson = lessons.find(lesson => !completedIds.has(lesson.id))
    const visual = courseVisuals[course.category] || { accent: '', icon: '▤' }

    return {
      ...course,
      ...visual,
      enrollmentId: enrollment.id,
      enrolledAt: enrollment.enrolled_at,
      status: enrollment.status,
      lessonCount: lessons.length,
      completedLessons,
      progress,
      nextLesson: nextLesson?.title || null
    }
  })
}

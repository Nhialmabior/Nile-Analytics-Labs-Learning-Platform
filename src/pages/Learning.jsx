import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3, ExternalLink,
  FileText, LoaderCircle, PlayCircle, RefreshCw
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function getVideoEmbedUrl(value) {
  if (!value) return ''
  try {
    const url = new URL(value)
    if (url.hostname.includes('youtube-nocookie.com') && url.pathname.includes('/embed/')) return value
    if (url.hostname.includes('youtube.com') && url.pathname.includes('/embed/')) return value
    if (url.hostname.includes('youtube.com') && url.searchParams.get('v')) {
      return `https://www.youtube-nocookie.com/embed/${url.searchParams.get('v')}`
    }
    if (url.hostname === 'youtu.be') {
      return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`
    }
  } catch {
    return ''
  }
  return ''
}

export default function Learning() {
  const { slug } = useParams()
  const { user } = useAuth()
  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [lessons, setLessons] = useState([])
  const [completed, setCompleted] = useState([])\n  const [assessments, setAssessments] = useState([])\n  const [submissions, setSubmissions] = useState([])\n  const [submissionText, setSubmissionText] = useState('')\n  const [submissionUrl, setSubmissionUrl] = useState('')\n  const [submitting, setSubmitting] = useState(false)
  const [currentLessonId, setCurrentLessonId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadCourse = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError('')

    const { data: courseRow, error: courseError } = await supabase
      .from('courses')
      .select('id, title, slug, description, level, duration, is_published')
      .eq('slug', slug)
      .maybeSingle()

    if (courseError || !courseRow) {
      setError(courseError?.message || 'This course is not published yet. Please check back later.')
      setLoading(false)
      return
    }

    const { data: moduleRows, error: moduleError } = await supabase
      .from('course_modules')
      .select('id, title, description, sort_order')
      .eq('course_id', courseRow.id)
      .order('sort_order', { ascending: true })

    if (moduleError) {
      setError(moduleError.message)
      setLoading(false)
      return
    }

    const moduleIds = (moduleRows || []).map(item => item.id)
    let lessonRows = []
    if (moduleIds.length) {
      const { data, error: lessonError } = await supabase
        .from('lessons')
        .select('id, module_id, title, content, video_url, resource_url, duration_minutes, sort_order')
        .in('module_id', moduleIds)
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
      if (lessonError) {
        setError(lessonError.message)
        setLoading(false)
        return
      }
      lessonRows = data || []
    }

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', courseRow.id)
      .eq('learner_id', user.id)
      .maybeSingle()

    if (enrollmentError) {
      setError(enrollmentError.message)
      setLoading(false)
      return
    }

    if (!enrollment) {
      const { error: joinError } = await supabase.from('enrollments').insert({
        course_id: courseRow.id,
        learner_id: user.id
      })
      if (joinError && !joinError.message.toLowerCase().includes('duplicate')) {
        setError(joinError.message)
        setLoading(false)
        return
      }
    }

    const lessonIds = lessonRows.map(item => item.id)
    let completedIds = []
    if (lessonIds.length) {
      const { data: progressRows, error: progressError } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('learner_id', user.id)
        .in('lesson_id', lessonIds)
      if (progressError) {
        setError(progressError.message)
        setLoading(false)
        return
      }
      completedIds = (progressRows || []).map(item => item.lesson_id)
    }

    setCourse(courseRow)
    setModules(moduleRows || [])
    setLessons(lessonRows)
    setCompleted(completedIds)
    setCurrentLessonId(current => lessonRows.some(item => item.id === current)
      ? current
      : lessonRows.find(item => !completedIds.includes(item.id))?.id || lessonRows[0]?.id || '')
    setLoading(false)
  }, [slug, user?.id])

  useEffect(() => { loadCourse() }, [loadCourse])

  const currentLesson = lessons.find(item => item.id === currentLessonId)
  const currentModule = modules.find(item => item.id === currentLesson?.module_id)
  const progressPercent = lessons.length ? Math.round((completed.length / lessons.length) * 100) : 0
  const embedUrl = useMemo(() => getVideoEmbedUrl(currentLesson?.video_url), [currentLesson?.video_url])

  async function markComplete() {
    if (!currentLesson || completed.includes(currentLesson.id)) return
    setSaving(true)
    setError('')
    const { error: saveError } = await supabase.from('lesson_progress').insert({
      learner_id: user.id,
      lesson_id: currentLesson.id
    })
    if (saveError && !saveError.message.toLowerCase().includes('duplicate')) {
      setError(saveError.message)
    } else {
      setCompleted(previous => [...previous, currentLesson.id])
      const next = lessons.find(item => !completed.includes(item.id) && item.id !== currentLesson.id)
      if (next) setCurrentLessonId(next.id)
    }
    setSaving(false)
  }

  async function submitAssessment(assessment) {
    const existing = submissions.find(item => item.assessment_id === assessment.id)
    if (existing?.graded_at) return
    if (!submissionText.trim() && !submissionUrl.trim()) {
      setError('Add a short response or a link to your completed workbook before submitting.')
      return
    }
    setSubmitting(true)
    setError('')
    const payload = {
      learner_id: user.id,
      assessment_id: assessment.id,
      submission_text: submissionText.trim(),
      resource_url: submissionUrl.trim() || null
    }
    const result = existing
      ? await supabase.from('assessment_submissions').update(payload).eq('id', existing.id)
      : await supabase.from('assessment_submissions').insert(payload)
    if (result.error) {
      setError(result.error.message)
    } else {
      const { data } = await supabase.from('assessment_submissions')
        .select('id, assessment_id, submission_text, resource_url, score, feedback, graded_at, submitted_at')
        .eq('learner_id', user.id).eq('assessment_id', assessment.id).maybeSingle()
      if (data) setSubmissions(previous => [...previous.filter(item => item.assessment_id !== assessment.id), data])
      setError('')
    }
    setSubmitting(false)
  }

  function moveLesson(direction) {
    const index = lessons.findIndex(item => item.id === currentLessonId)
    const next = lessons[index + direction]
    if (next) setCurrentLessonId(next.id)
  }

  if (loading) {
    return <div className="learning-state"><LoaderCircle className="learning-spinner" size={28}/><strong>Preparing your learning space…</strong><span>Loading course modules and lessons.</span></div>
  }

  if (error && !course) {
    return <div className="learning-state"><BookOpen size={30}/><strong>Course unavailable</strong><p>{error}</p><Link className="btn btn-primary" to="/courses">Browse courses</Link></div>
  }

  if (!lessons.length) {
    return <div className="learning-state"><BookOpen size={30}/><strong>Course content is being prepared</strong><p>This course has been published, but its lessons have not been added yet.</p><Link className="btn btn-outline" to="/courses">Back to courses</Link></div>
  }

  return (
    <div className="learning-page">
      <header className="learning-header">
        <Link to="/courses"><ArrowLeft size={18}/> Course catalogue</Link>
        <div><strong>{course?.title}</strong><span>{course?.level} · {course?.duration}</span></div>
        <div className="learning-header-progress"><span>{completed.length} of {lessons.length} lessons complete</span><div><i style={{ width: `${progressPercent}%` }}/></div></div>
      </header>

      <div className="learning-layout">
        <aside className="lesson-sidebar">
          <div className="lesson-side-head"><span>COURSE CONTENT</span><strong>{modules.length} modules · {lessons.length} lessons</strong></div>
          {modules.map((module, index) => {
            const moduleLessons = lessons.filter(item => item.module_id === module.id)
            const doneCount = moduleLessons.filter(item => completed.includes(item.id)).length
            return (
              <section className="lesson-module-group" key={module.id}>
                <div className="lesson-module-title"><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{module.title}</strong><small>{doneCount}/{moduleLessons.length} complete</small></div></div>
                {moduleLessons.map((lesson, lessonIndex) => (
                  <button
                    type="button"
                    key={lesson.id}
                    className={currentLessonId === lesson.id ? 'lesson-nav active' : 'lesson-nav'}
                    aria-current={currentLessonId === lesson.id ? 'step' : undefined}
                    onClick={() => setCurrentLessonId(lesson.id)}
                  >
                    {completed.includes(lesson.id) ? <CheckCircle2 className="done"/> : <span className="lesson-number">{lessonIndex + 1}</span>}
                    <span>{lesson.title}<small><Clock3 size={11}/> {lesson.duration_minutes || 0} min</small></span>
                  </button>
                ))}
              </section>
            )
          })}
        </aside>

        <main className="lesson-main">
          {currentLesson && <>
            <div className="lesson-main-top"><span>{currentModule?.title}</span><span>Lesson {lessons.findIndex(item => item.id === currentLesson.id) + 1} of {lessons.length}</span></div>
            {embedUrl ? (
              <div className="lesson-video-frame"><iframe src={embedUrl} title={currentLesson.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/></div>
            ) : (
              <div className="lesson-video-empty"><PlayCircle size={46}/><strong>Lesson video and learning resources</strong><span>Use the resource link below to open the recommended tutorial or reference.</span></div>
            )}
            <article className="lesson-content">
              <span className="section-kicker">NILE ANALYTICS LABS · EXCEL LEARNING PATH</span>
              <h1>{currentLesson.title}</h1>
              <p>{currentLesson.content}</p>
              {currentLesson.resource_url && <a className="lesson-resource-link" href={currentLesson.resource_url} target="_blank" rel="noreferrer"><FileText size={17}/> Open recommended learning resource <ExternalLink size={15}/></a>}
              {currentLesson.video_url && <a className="lesson-resource-link" href={currentLesson.video_url} target="_blank" rel="noreferrer"><PlayCircle size={17}/> Open video on its original platform <ExternalLink size={15}/></a>}
              {error && <div className="lesson-inline-error">{error}</div>}
              <div className="lesson-completion-row">
                {completed.includes(currentLesson.id)
                  ? <span className="lesson-complete-label"><CheckCircle2 size={17}/> Lesson completed</span>
                  : <button className="btn btn-primary" type="button" onClick={markComplete} disabled={saving}>{saving ? <RefreshCw className="learning-spinner" size={16}/> : <CheckCircle2 size={17}/>} Mark lesson complete</button>}
                <div className="lesson-step-actions"><button type="button" onClick={() => moveLesson(-1)} disabled={lessons.findIndex(item => item.id === currentLesson.id) === 0}><ArrowLeft size={16}/> Previous</button><button type="button" onClick={() => moveLesson(1)} disabled={lessons.findIndex(item => item.id === currentLesson.id) === lessons.length - 1}>Next lesson <ArrowRight size={16}/></button></div>
              </div>
            </article>
          </>}
          {assessments.length > 0 && <section className="course-assignment-panel">
            <div className="assignment-heading"><span className="section-kicker">COURSEWORK</span><h2>Practical assignment</h2><p>Complete the task and submit your findings or a shareable link to your workbook.</p></div>
            {assessments.map(assessment => {
              const submission = submissions.find(item => item.assessment_id === assessment.id)
              const locked = Boolean(submission?.graded_at)
              return <article className="assignment-card" key={assessment.id}>
                <div className="assignment-card-top"><div><h3>{assessment.title}</h3><span>{assessment.total_marks} marks</span></div><span className={locked ? 'assignment-status graded' : submission ? 'assignment-status submitted' : 'assignment-status pending'}>{locked ? 'Graded' : submission ? 'Submitted' : 'Not submitted'}</span></div>
                <p>{assessment.instructions}</p>
                {submission?.graded_at && <div className="assignment-feedback"><strong>Instructor feedback</strong><p>{submission.feedback || 'Your submission has been reviewed.'}</p><b>Score: {submission.score ?? 'Not recorded'} / {assessment.total_marks}</b></div>}
                {!locked && <>
                  <label className="assignment-field">Your response<textarea rows="4" value={submissionText || submission?.submission_text || ''} onChange={event => setSubmissionText(event.target.value)} placeholder="Summarise your approach, key findings and conclusions."/></label>
                  <label className="assignment-field">Workbook or file link (optional)<input type="url" value={submissionUrl || submission?.resource_url || ''} onChange={event => setSubmissionUrl(event.target.value)} placeholder="https://..."/></label>
                  <button type="button" className="btn btn-primary" disabled={submitting} onClick={() => submitAssessment(assessment)}>{submitting ? 'Submitting…' : submission ? 'Update submission' : 'Submit assignment'}</button>
                </>}
                {submission && <small className="assignment-submitted-at">Last submitted: {new Date(submission.submitted_at).toLocaleString()}</small>}
              </article>
            })}
          </section>}
        </main>
      </div>
    </div>
  )
}

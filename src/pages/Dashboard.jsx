import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Award, BarChart3, BookOpen, BookOpenCheck, CheckCircle2,
  Clock3, FileText, GraduationCap, Target, TrendingUp, Trophy
} from 'lucide-react'
import ProgressBar from '../components/ProgressBar'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { loadLearnerCourses } from '../lib/learningData'

function formatDate(value) {
  if (!value) return 'Date unavailable'
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

function getAssessmentName(submission) {
  return submission.assessments?.title || 'Assessment'
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [learning, setLearning] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [assessmentError, setAssessmentError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')
      setAssessmentError('')

      const [courseResult, assessmentResult] = await Promise.allSettled([
        loadLearnerCourses(user?.id),
        user?.id
          ? supabase
              .from('assessment_submissions')
              .select('id, score, feedback, submitted_at, graded_at, assessments(title, total_marks, courses(title))')
              .eq('learner_id', user.id)
              .order('submitted_at', { ascending: false })
              .limit(8)
          : Promise.resolve({ data: [], error: null })
      ])

      if (!active) return

      if (courseResult.status === 'fulfilled') {
        setLearning(courseResult.value)
      } else {
        setError(courseResult.reason?.message || 'Your learning overview could not be loaded.')
      }

      if (assessmentResult.status === 'fulfilled') {
        const response = assessmentResult.value
        if (response.error) {
          setAssessmentError(response.error.message || 'Assessment results could not be loaded.')
        } else {
          setSubmissions(response.data || [])
        }
      } else {
        setAssessmentError(assessmentResult.reason?.message || 'Assessment results could not be loaded.')
      }

      setLoading(false)
    }

    load()
    return () => { active = false }
  }, [user?.id])

  const fullName = profile?.full_name?.trim() || user?.user_metadata?.full_name?.trim() || 'Learner'
  const firstName = fullName.split(/\s+/)[0]

  const metrics = useMemo(() => {
    const totalLessons = learning.reduce((sum, course) => sum + course.completedLessons, 0)
    const averageProgress = learning.length
      ? Math.round(learning.reduce((sum, course) => sum + course.progress, 0) / learning.length)
      : 0
    const completedCourses = learning.filter(course => course.progress === 100 && course.lessonCount > 0).length
    return { enrolled: learning.length, totalLessons, averageProgress, completedCourses }
  }, [learning])

  const assessmentMetrics = useMemo(() => {
    const graded = submissions.filter(item => item.graded_at && item.score !== null && item.score !== undefined)
    const pending = submissions.filter(item => !item.graded_at)
    const percentages = graded
      .map(item => {
        const total = Number(item.assessments?.total_marks)
        const score = Number(item.score)
        return total > 0 && Number.isFinite(score) ? (score / total) * 100 : null
      })
      .filter(value => value !== null && Number.isFinite(value))
    const average = percentages.length
      ? Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length)
      : null
    return { graded: graded.length, pending: pending.length, average }
  }, [submissions])

  const latestSubmissions = submissions.slice(0, 4)

  return <div className="learner-dashboard">
    <section className="dashboard-welcome">
      <div>
        <span className="section-kicker">YOUR LEARNING SPACE</span>
        <h1>Welcome back, {firstName} <span aria-hidden="true">👋</span></h1>
        <p>Keep building your data skills. Here is your learning progress at a glance.</p>
      </div>
      <Link className="btn btn-primary" to="/courses">Explore courses <ArrowRight size={17}/></Link>
    </section>

    <section className="dashboard-metrics" aria-label="Learning summary">
      <article className="dashboard-metric-card">
        <span className="dashboard-metric-icon blue"><BookOpen size={19}/></span>
        <div><span>Enrolled courses</span><strong>{loading ? '—' : metrics.enrolled}</strong><small>Courses in your learning plan</small></div>
      </article>
      <article className="dashboard-metric-card">
        <span className="dashboard-metric-icon green"><BookOpenCheck size={19}/></span>
        <div><span>Lessons completed</span><strong>{loading ? '—' : metrics.totalLessons}</strong><small>Published lessons finished</small></div>
      </article>
      <article className="dashboard-metric-card">
        <span className="dashboard-metric-icon violet"><TrendingUp size={19}/></span>
        <div><span>Average progress</span><strong>{loading ? '—' : `${metrics.averageProgress}%`}</strong><small>Across your enrolled courses</small></div>
      </article>
      <article className="dashboard-metric-card">
        <span className="dashboard-metric-icon amber"><Trophy size={19}/></span>
        <div><span>Graded assessments</span><strong>{loading ? '—' : assessmentMetrics.graded}</strong><small>{assessmentMetrics.pending} awaiting feedback</small></div>
      </article>
    </section>

    {error && <div className="admin-alert error" role="alert">{error}</div>}

    <section className="dashboard-overview-grid">
      <div className="dashboard-panel courses-overview-panel">
        <div className="dashboard-panel-heading">
          <div><span className="section-kicker">YOUR CLASSROOM</span><h2>Continue learning</h2><p>Pick up where you left off.</p></div>
          <Link to="/my-courses" className="dashboard-panel-link">All courses <ArrowRight size={15}/></Link>
        </div>

        {loading ? <div className="dashboard-loading" role="status">Loading your courses…</div>
          : learning.length ? <div className="dashboard-course-list">
            {learning.slice(0, 4).map(course => <article className="dashboard-course-row" key={course.enrollmentId}>
              <div className={`dashboard-course-mark ${course.accent}`}>{course.icon}</div>
              <div className="dashboard-course-details">
                <div className="dashboard-course-title"><div><strong>{course.title}</strong><span>{course.completedLessons} of {course.lessonCount} lessons</span></div><b>{course.progress}%</b></div>
                <ProgressBar value={course.progress}/>
                <small>{course.nextLesson ? `Next lesson: ${course.nextLesson}` : course.lessonCount ? 'All published lessons completed' : 'Course lessons will appear here soon'}</small>
              </div>
              <Link className="dashboard-course-action" aria-label={`Continue ${course.title}`} to={`/learning/${course.slug}`}><ArrowRight size={17}/></Link>
            </article>)}
          </div> : !error && <div className="dashboard-empty">
            <span><GraduationCap size={26}/></span><h3>Your learning journey starts here</h3>
            <p>Enrol in a course to see your lessons, progress and learning activity on this dashboard.</p>
            <Link className="btn btn-primary btn-sm" to="/courses">Browse courses <ArrowRight size={15}/></Link>
          </div>}
      </div>

      <aside className="dashboard-insights-column">
        <section className="dashboard-progress-card">
          <div className="dashboard-progress-card-top"><span><Target size={17}/></span><small>OVERALL PROGRESS</small></div>
          <strong>{loading ? '—' : `${metrics.averageProgress}%`}</strong>
          <p>Your average completion across all enrolled courses.</p>
          <div className="dashboard-progress-track"><span style={{ width: `${loading ? 0 : metrics.averageProgress}%` }}/></div>
          <div className="dashboard-progress-foot"><span>{metrics.completedCourses} course{metrics.completedCourses === 1 ? '' : 's'} completed</span><Link to="/my-courses">View details</Link></div>
        </section>

        <section className="dashboard-certificate-card">
          <span className="dashboard-certificate-icon"><Award size={20}/></span>
          <div><h3>Certificates</h3><p>Completed-course certificates will be listed here once they are issued.</p></div>
          <Link to="/certificates" aria-label="View certificates"><ArrowRight size={17}/></Link>
        </section>
      </aside>
    </section>

    <section className="dashboard-panel dashboard-assessments-panel">
      <div className="dashboard-panel-heading">
        <div><span className="section-kicker">CHECK YOUR RESULTS</span><h2>Assessment performance</h2><p>Marks and feedback shared by your course administrator.</p></div>
        <div className="dashboard-assessment-summary">
          <span><CheckCircle2 size={15}/> {assessmentMetrics.graded} graded</span>
          <span><Clock3 size={15}/> {assessmentMetrics.pending} pending</span>
        </div>
      </div>

      {assessmentError ? <div className="dashboard-inline-error" role="alert">{assessmentError}</div>
        : loading ? <div className="dashboard-loading" role="status">Loading your assessment results…</div>
        : latestSubmissions.length ? <div className="dashboard-results-list">
          {latestSubmissions.map(item => {
            const assessment = item.assessments || {}
            const total = Number(assessment.total_marks)
            const isGraded = Boolean(item.graded_at && item.score !== null && item.score !== undefined)
            const percent = isGraded && total > 0 ? Math.round((Number(item.score) / total) * 100) : null
            return <article className="dashboard-result-row" key={item.id}>
              <span className={`dashboard-result-icon ${isGraded ? 'graded' : 'pending'}`}>{isGraded ? <FileText size={18}/> : <Clock3 size={18}/>}</span>
              <div className="dashboard-result-main">
                <strong>{getAssessmentName(item)}</strong>
                <span>{assessment.courses?.title || 'Course'} · Submitted {formatDate(item.submitted_at)}</span>
                {isGraded && item.feedback && <p className="dashboard-feedback-preview">“{item.feedback}”</p>}
              </div>
              <div className="dashboard-result-score">
                {isGraded ? <><strong>{item.score} <small>/ {total || '—'}</small></strong><span>{percent === null ? 'Graded' : `${percent}%`}</span></> : <span className="dashboard-pending-label">Awaiting marking</span>}
              </div>
            </article>
          })}
          {submissions.length > 4 && <div className="dashboard-results-foot"><span>Showing your latest 4 submissions</span><span>Results update when work is graded</span></div>}
        </div> : <div className="dashboard-empty dashboard-empty-compact">
          <span><BarChart3 size={25}/></span><h3>No assessment results yet</h3>
          <p>Once you submit an assessment, its marking status, score and feedback will appear here.</p>
          <Link to="/my-courses" className="dashboard-panel-link">Go to my courses <ArrowRight size={15}/></Link>
        </div>}
    </section>

    <div className="dashboard-footnote"><GraduationCap size={15}/> Your dashboard displays activity from your signed-in learner account. Results are personal and are not shared with other learners.</div>
  </div>
}

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, CheckCircle2, TrendingUp, Trophy } from 'lucide-react'
import ProgressBar from '../components/ProgressBar'
import { useAuth } from '../context/AuthContext'
import { loadLearnerCourses } from '../lib/learningData'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [learning, setLearning] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const rows = await loadLearnerCourses(user?.id)
        if (active) setLearning(rows)
      } catch (loadError) {
        if (active) setError(loadError.message || 'Your learning overview could not be loaded.')
      } finally {
        if (active) setLoading(false)
      }
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

  return <div>
    <div className="dash-heading"><div><span className="section-kicker">STUDENT DASHBOARD</span><h1>Welcome back, {firstName} 👋</h1><p>Your learning activity and course progress, updated from your account.</p></div><Link className="btn btn-primary" to="/courses">Explore Courses <ArrowRight size={17}/></Link></div>

    <div className="metric-grid">
      <div className="metric"><span className="metric-icon"><BookOpen/></span><div><strong>{loading ? '—' : metrics.enrolled}</strong><span>Enrolled courses</span></div></div>
      <div className="metric"><span className="metric-icon"><CheckCircle2/></span><div><strong>{loading ? '—' : metrics.totalLessons}</strong><span>Lessons completed</span></div></div>
      <div className="metric"><span className="metric-icon"><TrendingUp/></span><div><strong>{loading ? '—' : `${metrics.averageProgress}%`}</strong><span>Average progress</span></div></div>
      <div className="metric"><span className="metric-icon"><Trophy/></span><div><strong>{loading ? '—' : metrics.completedCourses}</strong><span>Courses completed</span></div></div>
    </div>

    {error && <div className="admin-alert error" role="alert">{error}</div>}
    <div className="dash-content">
      <section>
        <div className="dash-section-title"><h2>Continue learning</h2><Link to="/my-courses">View all</Link></div>
        {loading ? <div className="empty-certificate" role="status"><p>Loading your enrolled courses…</p></div>
          : learning.length ? <div className="learning-list">{learning.slice(0, 4).map(course => <div className="learning-item" key={course.enrollmentId}>
            <div className={`mini-cover ${course.accent}`}>{course.icon}</div>
            <div className="learning-info">
              <div className="learning-top"><strong>{course.title}</strong><span>{course.progress}%</span></div>
              <ProgressBar value={course.progress}/>
              <small>{course.nextLesson ? `Next: ${course.nextLesson}` : course.lessonCount ? 'All published lessons completed' : 'Lessons are not available yet'}</small>
            </div>
            <Link className="continue-btn" aria-label={`Continue ${course.title}`} to={`/learning/${course.slug}`}><ArrowRight/></Link>
          </div>)}</div>
          : !error && <div className="empty-certificate"><BookOpen size={32}/><h3>No enrolled courses yet</h3><p>When you enrol in a course, your learning progress will appear here.</p><Link className="btn btn-primary" to="/courses">Browse courses</Link></div>}
      </section>
      <aside className="dashboard-side-card"><span className="side-card-icon"><Trophy/></span><h3>Keep your momentum</h3><p>Complete lessons regularly to build consistent learning progress. Your dashboard updates as you learn.</p><Link to="/courses" className="text-link">Find a course <ArrowRight size={16}/></Link></aside>
    </div>
  </div>
}

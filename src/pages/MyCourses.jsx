import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProgressBar from '../components/ProgressBar'
import { ArrowRight, BookOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { loadLearnerCourses } from '../lib/learningData'

export default function MyCourses() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const rows = await loadLearnerCourses(user?.id)
        if (active) setCourses(rows)
      } catch (loadError) {
        if (active) setError(loadError.message || 'Your courses could not be loaded.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [user?.id])

  return <div>
    <div className="dash-heading"><div><span className="section-kicker">MY LEARNING</span><h1>My Courses</h1><p>Track your enrolled courses and continue where you left off.</p></div><Link className="btn btn-primary" to="/courses">Browse Courses</Link></div>
    {error && <div className="admin-alert error" role="alert">{error}</div>}
    {loading ? <div className="empty-certificate" role="status"><p>Loading your courses…</p></div>
      : courses.length ? <div className="enrolled-grid">{courses.map(course => <div className="enrolled-card" key={course.enrollmentId}>
        <div className={`enrolled-cover ${course.accent}`}><span>{course.icon}</span><small>{course.category}</small></div>
        <div className="enrolled-body">
          <h3>{course.title}</h3>
          <p><BookOpen size={15}/> {course.completedLessons} of {course.lessonCount} lessons completed</p>
          <div className="learning-top"><span>Progress</span><strong>{course.progress}%</strong></div>
          <ProgressBar value={course.progress}/>
          <Link className="course-link" to={`/learning/${course.slug}`}>{course.nextLesson ? 'Continue learning' : course.lessonCount ? 'Review course' : 'Open course'} <ArrowRight size={16}/></Link>
        </div>
      </div>)}</div>
      : !error && <div className="empty-certificate"><BookOpen size={32}/><h3>You have not enrolled in any courses yet</h3><p>Browse the catalogue and enrol in a course to see it here.</p><Link className="btn btn-primary" to="/courses">Explore courses</Link></div>}
  </div>
}

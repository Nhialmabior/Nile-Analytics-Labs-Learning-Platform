import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle, ArrowRight, Award, BookOpen, BookOpenCheck,
  CheckCircle2, Clock3, LoaderCircle, ShieldCheck
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { loadLearnerCourses } from '../lib/learningData'

function CourseProgressCard({ course }) {
  const lessonsComplete = course.lessonCount > 0 && course.completedLessons === course.lessonCount
  const hasLessons = course.lessonCount > 0

  return (
    <article className="certificate-progress-card">
      <div className={`certificate-course-mark ${course.accent || ''}`} aria-hidden="true">
        {course.icon || <BookOpen size={22}/>}
      </div>
      <div className="certificate-course-main">
        <div className="certificate-course-heading">
          <div>
            <span className="section-kicker">{course.category || 'COURSE'}</span>
            <h3>{course.title}</h3>
            <p>{course.level || 'Self-paced'} · {course.duration || 'Course programme'}</p>
          </div>
          <span className={`certificate-status ${lessonsComplete ? 'complete' : 'progress'}`}>
            {lessonsComplete ? <><CheckCircle2 size={14}/> Lessons complete</> : <><Clock3 size={14}/> {hasLessons ? 'In progress' : 'Content pending'}</>}
          </span>
        </div>
        <div className="certificate-progress-meta">
          <span>{course.completedLessons} of {course.lessonCount} published lessons completed</span>
          <strong>{course.progress}%</strong>
        </div>
        <div className="certificate-progress-track" role="progressbar" aria-label={`${course.title} lesson progress`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={course.progress}>
          <span style={{ width: `${course.progress}%` }}/>
        </div>
        <div className="certificate-course-footer">
          <span>{lessonsComplete
            ? 'Final course requirements still need administrator verification.'
            : hasLessons ? `Next lesson: ${course.nextLesson || 'Continue your course'}` : 'Published lessons will appear here when available.'}</span>
          <Link to={`/learning/${course.slug}`}>{lessonsComplete ? 'Review course' : 'Continue learning'} <ArrowRight size={15}/></Link>
        </div>
      </div>
    </article>
  )
}

export default function Certificates() {
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
        if (active) setError(loadError?.message || 'Your course progress could not be loaded.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [user?.id])

  const completedCourses = courses.filter(course => course.lessonCount > 0 && course.progress === 100).length
  const inProgressCourses = courses.filter(course => course.lessonCount > 0 && course.progress < 100).length

  return (
    <div className="certificate-centre">
      <div className="dash-heading">
        <div>
          <span className="section-kicker">ACHIEVEMENTS</span>
          <h1>Certificate Centre</h1>
          <p>Track your course progress and see where you are in the certificate process.</p>
        </div>
      </div>

      <section className="certificate-centre-banner">
        <div className="certificate-centre-banner-icon"><Award size={30}/></div>
        <div>
          <span>YOUR LEARNING ACHIEVEMENTS</span>
          <h2>Every completed lesson brings you closer.</h2>
          <p>Your course activity is shown below. Official certificates will only appear here after the platform's completion requirements have been verified and a certificate has been issued.</p>
        </div>
        <div className="certificate-centre-shield"><ShieldCheck size={34}/></div>
      </section>

      <section className="certificate-summary-grid" aria-label="Course completion summary">
        <article><span><BookOpen size={18}/></span><div><strong>{loading ? '—' : courses.length}</strong><small>Enrolled courses</small></div></article>
        <article><span><BookOpenCheck size={18}/></span><div><strong>{loading ? '—' : completedCourses}</strong><small>All lessons completed</small></div></article>
        <article><span><Clock3 size={18}/></span><div><strong>{loading ? '—' : inProgressCourses}</strong><small>Courses in progress</small></div></article>
      </section>

      <div className="certificate-list-heading">
        <div><span className="section-kicker">YOUR COURSE RECORD</span><h2>Course completion progress</h2></div>
        <span>{loading ? 'Loading…' : `${courses.length} course${courses.length === 1 ? '' : 's'}`}</span>
      </div>

      {error && <div className="certificate-message error" role="alert"><AlertCircle size={18}/>{error}</div>}
      {loading ? (
        <div className="certificate-empty-state"><LoaderCircle className="certificate-loading" size={28}/><strong>Loading your course records…</strong><p>Retrieving your enrolled courses and saved lesson progress.</p></div>
      ) : !error && courses.length === 0 ? (
        <div className="certificate-empty-state"><Award size={34}/><strong>No enrolled courses yet</strong><p>Once you enrol in a course, your lesson progress and certificate status will be displayed here.</p><Link className="btn btn-primary" to="/courses">Explore courses <ArrowRight size={16}/></Link></div>
      ) : !error ? (
        <div className="certificate-progress-list">{courses.map(course => <CourseProgressCard key={course.enrollmentId} course={course}/>)}</div>
      ) : null}

      <div className="certificate-policy-note">
        <ShieldCheck size={19}/>
        <div><strong>About certificate verification</strong><p>Completing all published lessons is a progress milestone, not an issued certificate. Assessment requirements, any required passing score, administrator approval, certificate numbering and verification are not yet connected to this page. No downloadable credential is created or implied.</p></div>
      </div>
    </div>
  )
}

import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3, LockKeyhole } from 'lucide-react'
import { courses } from '../data/courses'
import { publicPreviews } from '../data/publicPreviews'
import './PublicLessonPreview.css'

export default function PublicLessonPreview() {
  const { slug } = useParams()
  const course = courses.find(item => item.slug === slug)
  const preview = publicPreviews[slug]

  if (!course || !preview) {
    return <section className="section container"><span className="section-kicker">LESSON PREVIEW</span><h1>Preview not available</h1><p>This sample lesson is not available. Browse the course catalogue to explore other learning paths.</p><Link className="btn btn-primary" to="/courses">Browse courses</Link></section>
  }

  return (
    <div className="public-preview-page">
      <section className={`public-preview-hero ${course.accent}`}>
        <div className="container">
          <Link className="back-link" to={`/courses/${course.slug}`}><ArrowLeft size={16}/> Back to course</Link>
          <span className="detail-tag">FREE SAMPLE LESSON · {course.category}</span>
          <h1>{preview.title}</h1>
          <p>{course.title} · {preview.module}</p>
          <div className="public-preview-meta"><span><Clock3 size={16}/> {preview.duration}</span><span><BookOpen size={16}/> Sample learning material</span></div>
        </div>
      </section>

      <section className="section">
        <div className="container public-preview-grid">
          <article className="public-preview-content">
            <span className="section-kicker">WELCOME TO NILE ANALYTICS LABS</span>
            <h2>Lesson overview</h2>
            <p className="preview-intro">{preview.introduction}</p>
            <div className="preview-objectives">
              <h3>By the end of this lesson, you should be able to:</h3>
              <ul>{preview.objectives.map(item => <li key={item}><CheckCircle2 size={17}/>{item}</li>)}</ul>
            </div>
            {preview.sections.map((section, index) => (
              <section className="preview-topic" key={section.heading}>
                <h3>{section.heading}</h3>
                <p>{section.body}</p>
              </section>
            ))}
            <div className="preview-takeaway"><strong>Key takeaway</strong><p>{preview.takeaway}</p></div>
            <div className="preview-practice"><strong>Try it yourself</strong><p>{preview.practice}</p></div>
            <div className="preview-end-cta">
              <div><h3>Ready to continue learning?</h3><p>Register or sign in to enrol and access the full course experience.</p></div>
              <Link className="btn btn-primary" to={`/courses/${course.slug}`}>Explore this course <ArrowRight size={16}/></Link>
            </div>
          </article>
          <aside className="public-preview-aside">
            <div className="preview-lock-icon"><LockKeyhole size={21}/></div>
            <h3>Continue with a learner account</h3>
            <p>This is a public sample lesson. Full lessons, quizzes, assignments, progress tracking and learner feedback are available to enrolled learners.</p>
            <Link className="btn btn-primary full" to="/register">Create learner account</Link>
            <Link className="preview-login-link" to="/login">Already registered? Sign in</Link>
            <div className="preview-aside-divider"/>
            <strong>Course at a glance</strong>
            <span>{course.level}</span>
            <span>{course.duration}</span>
            <span>{course.lessons} planned lessons</span>
          </aside>
        </div>
      </section>
    </div>
  )
}

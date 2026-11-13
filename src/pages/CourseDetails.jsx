import { Link, useParams } from 'react-router-dom'
import { courses } from '../data/courses'
import { BookOpen, Clock3, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react'

export default function CourseDetails() {
  const { slug } = useParams()
  const course = courses.find(c => c.slug === slug)
  if (!course) return <div className="section container"><h1>Course not found</h1><p>This course is not in the current catalogue.</p><Link className="btn btn-primary" to="/courses">Browse courses</Link></div>
  return <div className="page"><section className={`course-detail-hero ${course.accent}`}><div className="container detail-grid"><div><Link className="back-link" to="/courses"><ArrowLeft size={16}/> All courses</Link><span className="detail-tag">{course.category}</span><h1>{course.title}</h1><p>{course.description}</p><div className="detail-stats"><span><BookOpen size={17}/> {course.level}</span><span><Clock3 size={17}/> {course.duration}</span><span><BookOpen size={17}/> {course.lessons} planned lessons</span></div></div><div className="enroll-card"><div className="enroll-icon">{course.icon}</div><h3>Explore this course</h3><p>Open the sample lesson interface to preview the planned learning experience.</p><Link className="btn btn-primary full" to={`/learning/${course.slug}`}>Preview lessons <ArrowRight size={18}/></Link><small>Sample preview only · Enrolment is not enabled</small></div></div></section>
    <section className="section"><div className="container curriculum"><div><span className="section-kicker">PLANNED CURRICULUM</span><h2>What you'll learn</h2><div className="module-list">{course.modules.map((m,i)=><div className="module" key={m.title}><div className="module-num">{String(i+1).padStart(2,'0')}</div><div><strong>{m.title}</strong><span>{m.lessons} planned lessons</span></div><BookOpen size={18}/></div>)}</div></div><aside className="learn-box"><h3>Course approach</h3><ul><li><CheckCircle2/> Practical exercises planned</li><li><CheckCircle2/> Step-by-step instruction</li><li><CheckCircle2/> Applied project outline</li><li><CheckCircle2/> Certificate service planned, not yet available</li></ul></aside></div></section>
  </div>
}
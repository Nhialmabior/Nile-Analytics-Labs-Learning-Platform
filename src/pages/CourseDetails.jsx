import { Link, useParams } from 'react-router-dom'
import { courses } from '../data/courses'
import { BookOpen, Clock3, Users, Star, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react'

export default function CourseDetails() {
  const { slug } = useParams()
  const course = courses.find(c => c.slug === slug) || courses[0]
  return <div className="page"><section className={`course-detail-hero ${course.accent}`}><div className="container detail-grid"><div><Link className="back-link" to="/courses"><ArrowLeft size={16}/> All courses</Link><span className="detail-tag">{course.category}</span><h1>{course.title}</h1><p>{course.description}</p><div className="detail-stats"><span><Star size={17}/> {course.rating} rating</span><span><Users size={17}/> {course.students} learners</span><span><Clock3 size={17}/> {course.duration}</span></div></div><div className="enroll-card"><div className="enroll-icon">{course.icon}</div><h3>Start learning</h3><p>Access the full course curriculum and practical lessons.</p><Link className="btn btn-primary full" to="/register">Enroll Now <ArrowRight size={18}/></Link><small>Free demo enrollment · Backend coming next</small></div></div></section>
    <section className="section"><div className="container curriculum"><div><span className="section-kicker">CURRICULUM</span><h2>What you'll learn</h2><div className="module-list">{course.modules.map((m,i)=><div className="module" key={m.title}><div className="module-num">{String(i+1).padStart(2,'0')}</div><div><strong>{m.title}</strong><span>{m.lessons} lessons</span></div><BookOpen size={18}/></div>)}</div></div><aside className="learn-box"><h3>Course highlights</h3><ul><li><CheckCircle2/> Practical exercises</li><li><CheckCircle2/> Step-by-step instruction</li><li><CheckCircle2/> Applied project</li><li><CheckCircle2/> Completion certificate</li></ul></aside></div></section>
  </div>
}
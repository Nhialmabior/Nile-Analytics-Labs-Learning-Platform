import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Clock3, Trophy, TrendingUp } from 'lucide-react'
import ProgressBar from '../components/ProgressBar'
import { courses } from '../data/courses'

export default function Dashboard() {
  const learning = [
    {course:courses[0], progress:82, lesson:'PivotTables & Charts'},
    {course:courses[2], progress:48, lesson:'Data Frames & Tidy Data'},
    {course:courses[3], progress:24, lesson:'Descriptive Analysis'}
  ]
  return <div><div className="dash-heading"><div><span className="section-kicker">STUDENT DASHBOARD</span><h1>Welcome back, Student 👋</h1><p>Keep learning and keep building your data skills.</p></div><Link className="btn btn-primary" to="/courses">Explore Courses <ArrowRight size={17}/></Link></div>
    <div className="metric-grid"><div className="metric"><span className="metric-icon"><BookOpen/></span><div><strong>3</strong><span>Active courses</span></div></div><div className="metric"><span className="metric-icon"><Clock3/></span><div><strong>14.5h</strong><span>Learning time</span></div></div><div className="metric"><span className="metric-icon"><TrendingUp/></span><div><strong>51%</strong><span>Average progress</span></div></div><div className="metric"><span className="metric-icon"><Trophy/></span><div><strong>1</strong><span>Certificate</span></div></div></div>
    <div className="dash-content"><section><div className="dash-section-title"><h2>Continue learning</h2><Link to="/my-courses">View all</Link></div><div className="learning-list">{learning.map(x=><div className="learning-item" key={x.course.id}><div className={`mini-cover ${x.course.accent}`}>{x.course.icon}</div><div className="learning-info"><div className="learning-top"><strong>{x.course.title}</strong><span>{x.progress}%</span></div><ProgressBar value={x.progress}/><small>Next: {x.lesson}</small></div><Link className="continue-btn" to={`/learning/${x.course.slug}`}><ArrowRight/></Link></div>)}</div></section>
      <aside className="dashboard-side-card"><span className="side-card-icon"><Trophy/></span><h3>Keep your momentum</h3><p>Complete lessons regularly to build consistent learning progress.</p><Link to="/courses" className="text-link">Find a course <ArrowRight size={16}/></Link></aside></div>
  </div>
}
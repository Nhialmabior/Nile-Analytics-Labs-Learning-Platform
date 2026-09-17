import { Link } from 'react-router-dom'
import { courses } from '../data/courses'
import ProgressBar from '../components/ProgressBar'
import { ArrowRight, BookOpen } from 'lucide-react'

export default function MyCourses() {
  const progress=[82,48,24]
  return <div><div className="dash-heading"><div><span className="section-kicker">MY LEARNING</span><h1>My Courses</h1><p>Track your enrolled courses and continue where you left off.</p></div><Link className="btn btn-primary" to="/courses">Browse Courses</Link></div><div className="enrolled-grid">{courses.slice(0,3).map((c,i)=><div className="enrolled-card" key={c.id}><div className={`enrolled-cover ${c.accent}`}><span>{c.icon}</span><small>{c.category}</small></div><div className="enrolled-body"><h3>{c.title}</h3><p><BookOpen size={15}/> {c.lessons} lessons</p><div className="learning-top"><span>Progress</span><strong>{progress[i]}%</strong></div><ProgressBar value={progress[i]}/><Link className="course-link" to={`/learning/${c.slug}`}>Continue learning <ArrowRight size={16}/></Link></div></div>)}</div></div>
}
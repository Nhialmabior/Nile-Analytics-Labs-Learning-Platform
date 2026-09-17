import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { courses } from '../data/courses'
import { ArrowLeft, ArrowRight, CheckCircle2, PlayCircle, FileText, Menu } from 'lucide-react'

export default function Learning() {
  const {slug}=useParams()
  const course=courses.find(c=>c.slug===slug)||courses[0]
  const lessons=['Introduction','Getting Started','Working with Data','Practical Exercise','Checkpoint Quiz']
  const [current,setCurrent]=useState(2)
  return <div className="learning-page"><div className="learning-header"><Link to="/my-courses"><ArrowLeft size={18}/> My Courses</Link><div><strong>{course.title}</strong><span>48% complete</span></div></div><div className="learning-layout"><aside className="lesson-sidebar"><div className="lesson-side-head"><span>COURSE CONTENT</span><strong>{course.lessons} lessons</strong></div>{lessons.map((l,i)=><button key={l} className={current===i?'lesson-nav active':'lesson-nav'} onClick={()=>setCurrent(i)}>{i<current?<CheckCircle2 className="done"/>:<span className="lesson-number">{i+1}</span>}<span>{l}<small>{i===4?'Quiz':'Lesson'}</small></span></button>)}</aside><main className="lesson-main"><div className="video-placeholder"><PlayCircle size={62}/><span>Lesson video placeholder</span><small>Video content will be connected through the backend later.</small></div><div className="lesson-content"><span className="section-kicker">LESSON {current+1}</span><h1>{lessons[current]}</h1><p>Welcome to this practical learning lesson. This area will contain lesson text, examples, downloadable materials and exercises once the backend and content management system are connected.</p><div className="lesson-note"><FileText/><div><strong>Practical activity</strong><p>Work through the example and apply the technique to a small dataset.</p></div></div><div className="lesson-actions"><button disabled={current===0} onClick={()=>setCurrent(current-1)}><ArrowLeft/> Previous</button><button onClick={()=>setCurrent(Math.min(lessons.length-1,current+1))}>Next lesson <ArrowRight/></button></div></div></main></div></div>
}
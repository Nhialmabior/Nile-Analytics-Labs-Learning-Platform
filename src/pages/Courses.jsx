import { useState } from 'react'
import CourseCard from '../components/CourseCard'
import { courses } from '../data/courses'
import { Search } from 'lucide-react'

export default function Courses() {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('All')
  const categories = ['All', 'Excel', 'Stata', 'R Programming', 'SPSS']
  const filtered = courses.filter(c => (category === 'All' || c.category === category) && c.title.toLowerCase().includes(q.toLowerCase()))
  return <div className="page"><section className="inner-hero"><div className="container"><span className="section-kicker">COURSE CATALOGUE</span><h1>Learn the tools behind better analysis.</h1><p>Choose a learning path and develop practical skills in the tools used for data analysis and research.</p></div></section>
    <section className="section"><div className="container"><div className="catalog-tools"><div className="search-box"><Search size={19}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search courses..." /></div><div className="filters">{categories.map(c=><button key={c} className={category===c?'filter active':'filter'} onClick={()=>setCategory(c)}>{c}</button>)}</div></div><div className="course-grid">{filtered.map(c=><CourseCard key={c.id} course={c}/>)}</div></div></section>
  </div>
}
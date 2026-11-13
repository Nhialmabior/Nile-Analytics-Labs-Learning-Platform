import { useState } from 'react'
import CourseCard from '../components/CourseCard'
import { courses } from '../data/courses'
import { Search } from 'lucide-react'

export default function Courses() {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('All')
  const categories = ['All', 'Excel', 'Stata', 'R Programming', 'SPSS']
  const filtered = courses.filter(c => (category === 'All' || c.category === category) && c.title.toLowerCase().includes(q.trim().toLowerCase()))
  return <div className="page"><section className="inner-hero"><div className="container"><span className="section-kicker">COURSE CATALOGUE</span><h1>Learn the tools behind better analysis.</h1><p>Choose a learning path and develop practical skills in the tools used for data analysis and research.</p></div></section>
    <section className="section"><div className="container"><div className="catalog-tools"><div className="search-box"><Search size={19}/><input aria-label="Search courses" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search courses..." /></div><div className="filters" aria-label="Filter courses by subject">{categories.map(c=><button type="button" key={c} aria-pressed={category===c} className={category===c?'filter active':'filter'} onClick={()=>setCategory(c)}>{c}</button>)}</div></div>
      {filtered.length ? <div className="course-grid">{filtered.map(c=><CourseCard key={c.id} course={c}/>)}</div> : <div className="empty-certificate" role="status"><h3>No courses found</h3><p>Try another search term or choose a different subject.</p><button className="btn btn-outline" type="button" onClick={()=>{setQ('');setCategory('All')}}>Clear filters</button></div>}
    </div></section>
  </div>
}
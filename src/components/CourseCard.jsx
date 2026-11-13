import { Link } from 'react-router-dom'
import { Clock3, BookOpen, ArrowUpRight } from 'lucide-react'

export default function CourseCard({ course }) {
  return (
    <article className="course-card">
      <div className={`course-cover ${course.accent}`}>
        <span className="cover-icon">{course.icon}</span>
        <span className="cover-label">{course.category}</span>
      </div>
      <div className="course-body">
        <h3>{course.title}</h3>
        <p>{course.description}</p>
        <div className="course-meta">
          <span><Clock3 size={15} /> {course.duration}</span>
          <span><BookOpen size={15} /> {course.lessons} lessons</span>
        </div>
        <Link className="course-link" to={`/courses/${course.slug}`}>
          View course <ArrowUpRight size={17} />
        </Link>
      </div>
    </article>
  )
}

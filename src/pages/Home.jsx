import { Link } from 'react-router-dom'
import { ArrowRight, PlayCircle, BarChart3, Users, Award, CheckCircle2 } from 'lucide-react'
import CourseCard from '../components/CourseCard'
import { featuredCourses } from '../data/courses'

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span /> University of Juba · South Sudan</div>
            <h1>Learn to <em>analyze</em>. Learn to solve.</h1>
            <p>Master practical data analysis and statistical computing skills with courses designed for students, researchers and professionals.</p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/courses">Explore Courses <ArrowRight size={18} /></Link>
              <Link className="btn btn-ghost" to="/about"><PlayCircle size={19} /> Discover Nile Analytics</Link>
            </div>
            <div className="hero-proof">
              <div><strong>4+</strong><span>Core courses</span></div>
              <div><strong>100%</strong><span>Practical focus</span></div>
              <div><strong>South Sudan</strong><span>Based in Juba</span></div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="chart-card">
              <div className="chart-head"><span>Data Skills Progress</span><span className="mini-pill">Learning</span></div>
              <div className="bars">
                <i style={{height:'45%'}} /><i style={{height:'68%'}} /><i style={{height:'55%'}} /><i style={{height:'84%'}} /><i style={{height:'72%'}} /><i style={{height:'93%'}} />
              </div>
              <div className="chart-foot"><span>Excel</span><span>Stata</span><span>R</span><span>SPSS</span></div>
            </div>
            <div className="float-card float-one"><BarChart3 size={20}/><span><strong>Practical</strong><small>Data skills</small></span></div>
            <div className="float-card float-two"><Award size={20}/><span><strong>Certificates</strong><small>On completion</small></span></div>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="container stats">
          <div><BarChart3/><strong>Data-focused</strong><span>Learn by doing</span></div>
          <div><Users/><strong>Student-centered</strong><span>Built for learners</span></div>
          <div><Award/><strong>Career-ready</strong><span>Useful skills</span></div>
          <div><CheckCircle2/><strong>Practical projects</strong><span>Apply your knowledge</span></div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div><span className="section-kicker">LEARNING PATHWAYS</span><h2>Build your data analysis skills.</h2></div>
            <Link className="text-link" to="/courses">View all courses <ArrowRight size={17}/></Link>
          </div>
          <div className="course-grid">{featuredCourses.map(c => <CourseCard key={c.id} course={c}/>)}</div>
        </div>
      </section>

      <section className="section light-section">
        <div className="container feature-grid">
          <div className="feature-panel">
            <span className="section-kicker">WHY NILE ANALYTICS LABS</span>
            <h2>From raw data to meaningful decisions.</h2>
            <p>Our learning experience focuses on the tools and workflows used in real research and data analysis.</p>
            <ul>
              <li><CheckCircle2/> Step-by-step lessons</li>
              <li><CheckCircle2/> Practical exercises and projects</li>
              <li><CheckCircle2/> Learn at your own pace</li>
              <li><CheckCircle2/> Build skills you can demonstrate</li>
            </ul>
            <Link className="btn btn-primary" to="/register">Start Learning <ArrowRight size={18}/></Link>
          </div>
          <div className="data-art">
            <div className="data-window">
              <div className="window-top"><span/><span/><span/></div>
              <div className="code-lines"><b>01</b> data &lt;- read.csv("survey.csv")</div>
              <div className="code-lines"><b>02</b> summary(data)</div>
              <div className="code-lines"><b>03</b> model &lt;- lm(y ~ x, data=data)</div>
              <div className="code-lines"><b>04</b> plot(model)</div>
              <div className="result-box">Analysis complete ✓</div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container cta">
          <span className="section-kicker">ANALYZE TODAY, SOLVE TOMORROW.</span>
          <h2>Ready to turn data into insight?</h2>
          <p>Start building practical data analysis skills with Nile Analytics Labs.</p>
          <Link className="btn btn-light" to="/courses">Explore Learning <ArrowRight size={18}/></Link>
        </div>
      </section>
    </>
  )
}
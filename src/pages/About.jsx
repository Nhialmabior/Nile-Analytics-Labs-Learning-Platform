import { BarChart3, Target, Users, Lightbulb } from 'lucide-react'

export default function About() {
  return (
    <div className="page">
      <section className="inner-hero"><div className="container"><span className="section-kicker">ABOUT US</span><h1>Making data analysis easier to learn.</h1><p>Nile Analytics Labs is a data analysis and statistical computing learning initiative based at the University of Juba in Juba, South Sudan.</p></div></section>
      <section className="section"><div className="container about-grid"><div><span className="section-kicker">OUR STORY</span><h2>Practical skills for a data-driven world.</h2><p>We focus on helping learners develop confidence with the tools used to organize, analyze, visualize and communicate data.</p><p>Our courses are designed around practical exercises so learners can move from concepts to applied analysis.</p></div><div className="mission-card"><BarChart3 size={34}/><h3>Analyze today, solve tomorrow.</h3><p>Our motto reflects a simple belief: better analysis helps people understand problems and make informed decisions.</p></div></div></section>
      <section className="section light-section"><div className="container"><div className="section-head"><div><span className="section-kicker">WHAT WE VALUE</span><h2>Learning with purpose.</h2></div></div><div className="value-grid"><div><Target/><h3>Practical learning</h3><p>Lessons connect concepts to real analysis tasks.</p></div><div><Users/><h3>Learner focused</h3><p>Content is structured to support different starting levels.</p></div><div><Lightbulb/><h3>Problem solving</h3><p>Use data skills to understand and address real questions.</p></div></div></div></section>
    </div>
  )
}
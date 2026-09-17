import { Link } from 'react-router-dom'
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p className="footer-about">Practical data analysis and statistical computing education for students, researchers and professionals.</p>
          <div className="socials">
            <a href="#" aria-label="Facebook"><Facebook size={17} /></a>
            <a href="#" aria-label="Instagram"><Instagram size={17} /></a>
            <a href="#" aria-label="LinkedIn"><Linkedin size={17} /></a>
          </div>
        </div>
        <div>
          <h4>Learn</h4>
          <Link to="/courses">All Courses</Link>
          <Link to="/courses/excel-for-data-analysis">Excel</Link>
          <Link to="/courses/stata-for-data-analysis">Stata</Link>
          <Link to="/courses/r-programming-for-data-analysis">R Programming</Link>
          <Link to="/courses/spss-for-data-analysis">SPSS</Link>
        </div>
        <div>
          <h4>Company</h4>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/login">Student Login</Link>
          <Link to="/register">Register</Link>
        </div>
        <div>
          <h4>Contact</h4>
          <p><MapPin size={16} /> University of Juba, Juba, South Sudan</p>
          <p><Mail size={16} /> info@nileanalyticslabs.org</p>
          <p><Phone size={16} /> +211 000 000 000</p>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">© 2026 Nile Analytics Labs. All rights reserved. <span>Analyze today, solve tomorrow.</span></div>
      </div>
    </footer>
  )
}
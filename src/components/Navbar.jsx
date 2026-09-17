import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, ArrowRight } from 'lucide-react'
import Logo from './Logo'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const nav = [
    ['/', 'Home'],
    ['/about', 'About'],
    ['/courses', 'Courses'],
    ['/contact', 'Contact']
  ]
  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Logo />
        <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
        <nav className={open ? 'main-nav open' : 'main-nav'}>
          {nav.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>
              {label}
            </NavLink>
          ))}
          <Link className="nav-login" to="/login" onClick={() => setOpen(false)}>Log in</Link>
          <Link className="btn btn-primary btn-sm" to="/register" onClick={() => setOpen(false)}>
            Get Started <ArrowRight size={16} />
          </Link>
        </nav>
      </div>
    </header>
  )
}
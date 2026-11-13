import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, ArrowRight, LogOut } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const nav = [
    ['/', 'Home'],
    ['/about', 'About'],
    ['/courses', 'Courses'],
    ['/contact', 'Contact']
  ]

  async function handleSignOut() {
    await signOut()
    setOpen(false)
    navigate('/login', { replace: true })
  }

  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Logo />
        <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </button>
        <nav className={open ? 'main-nav open' : 'main-nav'}>
          {nav.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>
              {label}
            </NavLink>
          ))}
          {!loading && (user ? (
            <>
              <Link className="nav-login" to="/dashboard" onClick={() => setOpen(false)}>My Dashboard</Link>
              <button type="button" className="nav-login" onClick={handleSignOut}>
                <LogOut size={16} /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link className="nav-login" to="/login" onClick={() => setOpen(false)}>Log in</Link>
              <Link className="btn btn-primary btn-sm" to="/register" onClick={() => setOpen(false)}>
                Get Started <ArrowRight size={16} />
              </Link>
            </>
          ))}
        </nav>
      </div>
    </header>
  )
}

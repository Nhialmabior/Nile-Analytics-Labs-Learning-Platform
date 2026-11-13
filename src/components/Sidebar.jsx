import { NavLink, Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Award, UserRound, LogOut, Home } from 'lucide-react'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'

export default function Sidebar({ mobileOpen = false, onNavigate }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const items = [
    ['/dashboard', 'Dashboard', LayoutDashboard],
    ['/my-courses', 'My Courses', BookOpen],
    ['/certificates', 'Certificates', Award],
    ['/profile', 'My Profile', UserRound]
  ]

  async function handleSignOut() {
    await signOut()
    onNavigate?.()
    navigate('/login', { replace: true })
  }

  return (
    <aside className={mobileOpen ? 'sidebar mobile-open' : 'sidebar'}>
      <div className="side-logo"><Logo /></div>
      <nav>
        <p className="side-label">LEARNING</p>
        {items.map(([to, label, Icon]) => (
          <NavLink key={to} to={to} onClick={onNavigate} className={({isActive}) => isActive ? 'side-link active' : 'side-link'}>
            <Icon size={19} /> {label}
          </NavLink>
        ))}
        <p className="side-label">PLATFORM</p>
        <NavLink to="/" onClick={onNavigate} className="side-link"><Home size={19} /> Visit Website</NavLink>
      </nav>
      <div className="side-bottom">
        <button type="button" onClick={handleSignOut} className="side-link"><LogOut size={19} /> Sign out</button>
      </div>
    </aside>
  )
}
import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Bell, Search, Menu, X } from 'lucide-react'
import Sidebar from '../components/Sidebar'

export default function DashboardLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  function closeMenu() { setMenuOpen(false) }

  return (
    <div className="app-shell">
      {menuOpen && <button className="sidebar-backdrop" type="button" aria-label="Close navigation menu" onClick={closeMenu} />}
      <Sidebar mobileOpen={menuOpen} onNavigate={closeMenu} />
      <div className="dashboard-area">
        <header className="dashboard-topbar">
          <button className="mobile-dash-menu" type="button" aria-label={menuOpen ? 'Close dashboard menu' : 'Open dashboard menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}>
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
          <Link className="dash-search" to="/courses" aria-label="Browse the course catalogue">
            <Search size={18} /><span>Browse courses and lessons</span>
          </Link>
          <div className="top-actions">
            <span className="icon-btn" aria-label="Notifications are not enabled in preview"><Bell size={19} /></span>
            <div className="avatar">NM</div>
            <div className="top-user"><strong>Student</strong><span>Preview account</span></div>
          </div>
        </header>
        <div className="demo-banner" role="status">
          <strong>Preview mode:</strong> This site currently uses sample learner data. Sign-in, enrolments, saved progress, profile updates and certificates are not connected to a live backend yet.
        </div>
        <main className="dashboard-main" key={location.pathname}><Outlet /></main>
      </div>
    </div>
  )
}
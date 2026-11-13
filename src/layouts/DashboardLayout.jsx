import { Outlet } from 'react-router-dom'
import { Bell, Search, Menu } from 'lucide-react'
import Sidebar from '../components/Sidebar'

export default function DashboardLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="dashboard-area">
        <header className="dashboard-topbar">
          <button className="mobile-dash-menu" type="button" aria-label="Open dashboard menu"><Menu size={21} /></button>
          <div className="dash-search"><Search size={18} /><span>Learning workspace preview</span></div>
          <div className="top-actions">
            <span className="icon-btn" aria-label="Notifications are not enabled in preview"><Bell size={19} /></span>
            <div className="avatar">NM</div>
            <div className="top-user"><strong>Student</strong><span>Preview account</span></div>
          </div>
        </header>
        <div className="demo-banner" role="status">
          <strong>Preview mode:</strong> This site currently uses sample learner data. Sign-in, enrolments, saved progress, profile updates and certificates are not connected to a live backend yet.
        </div>
        <main className="dashboard-main"><Outlet /></main>
      </div>
    </div>
  )
}

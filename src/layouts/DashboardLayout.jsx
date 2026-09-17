import { Outlet } from 'react-router-dom'
import { Bell, Search, Menu } from 'lucide-react'
import Sidebar from '../components/Sidebar'

export default function DashboardLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="dashboard-area">
        <header className="dashboard-topbar">
          <button className="mobile-dash-menu"><Menu size={21} /></button>
          <div className="dash-search"><Search size={18} /><input placeholder="Search courses, lessons..." /></div>
          <div className="top-actions">
            <button className="icon-btn"><Bell size={19} /><span className="notif-dot" /></button>
            <div className="avatar">NM</div>
            <div className="top-user"><strong>Student</strong><span>Learner</span></div>
          </div>
        </header>
        <main className="dashboard-main"><Outlet /></main>
      </div>
    </div>
  )
}
import { UserRound, Mail, ShieldCheck, CalendarDays } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, profile } = useAuth()
  const fullName = profile?.full_name?.trim() || user?.user_metadata?.full_name?.trim() || 'Learner'
  const initials = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'L'
  const registeredAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Not available'

  return (
    <div>
      <div className="dash-heading">
        <div><span className="section-kicker">ACCOUNT</span><h1>My Profile</h1><p>Your registered learner information.</p></div>
      </div>
      <div className="profile-grid">
        <div className="profile-card">
          <div className="large-avatar">{initials}</div>
          <h2>{fullName}</h2>
          <p>Learner at Nile Analytics Labs</p>
          <span className="profile-badge"><ShieldCheck size={15} /> Learner account</span>
        </div>
        <div className="profile-form">
          <h3>Personal information</h3>
          <label>Full name<div className="input-icon"><UserRound /><input value={fullName} readOnly /></div></label>
          <label>Email address<div className="input-icon"><Mail /><input value={user?.email || ''} readOnly /></div></label>
          <label>Account created<div className="input-icon"><CalendarDays /><input value={registeredAt} readOnly /></div></label>
          <p className="admin-muted">Your name and email are taken from the details used when you registered.</p>
        </div>
      </div>
    </div>
  )
}

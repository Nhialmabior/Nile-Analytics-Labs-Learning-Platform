import { UserRound, Mail, MapPin, ShieldCheck } from 'lucide-react'

export default function Profile() {
  return (
    <div>
      <div className="dash-heading">
        <div><span className="section-kicker">ACCOUNT</span><h1>My Profile</h1><p>Manage your learner information.</p></div>
      </div>
      <div className="profile-grid">
        <div className="profile-card">
          <div className="large-avatar">NM</div>
          <h2>Student</h2>
          <p>Learner at Nile Analytics Labs</p>
          <span className="profile-badge"><ShieldCheck size={15} /> Preview profile</span>
        </div>
        <form className="profile-form" onSubmit={event => event.preventDefault()}>
          <h3>Personal information</h3>
          <label>Full name<div className="input-icon"><UserRound /><input defaultValue="Student" disabled /></div></label>
          <label>Email address<div className="input-icon"><Mail /><input defaultValue="student@example.com" disabled /></div></label>
          <label>Location<div className="input-icon"><MapPin /><input defaultValue="Juba, South Sudan" disabled /></div></label>
          <button className="btn btn-primary" type="button" disabled>Profile editing coming soon</button>
        </form>
      </div>
    </div>
  )
}

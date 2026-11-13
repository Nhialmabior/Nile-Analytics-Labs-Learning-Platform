import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminDashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="section container">
      <span className="section-kicker">NILE ANALYTICS LABS · ADMINISTRATION</span>
      <h1 style={{ margin: '12px 0' }}>Administrator workspace</h1>
      <p>Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}. You are signed in with administrator access.</p>
      <div className="demo-note">Your administrator account is authenticated. Course management, learner management, enrolments and reporting are the next development stage.</div>
      <p><strong>Account:</strong> {user?.email}</p>
      <button className="btn btn-primary" type="button" onClick={handleSignOut}>Sign out</button>
    </div>
  )
}

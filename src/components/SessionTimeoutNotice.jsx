import { Clock3, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './SessionTimeoutNotice.css'

export default function SessionTimeoutNotice() {
  const { user, idleWarning, idleRemaining, staySignedIn, signOut } = useAuth()
  if (!user || !idleWarning) return null

  const totalSeconds = Math.ceil(idleRemaining / 1000)
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')

  async function handleSignOut() {
    await signOut()
  }

  return (
    <div className="session-timeout-backdrop" role="presentation">
      <section className="session-timeout-dialog" role="alertdialog" aria-modal="true" aria-labelledby="session-timeout-title" aria-describedby="session-timeout-description">
        <span className="session-timeout-icon"><Clock3 size={24}/></span>
        <span className="section-kicker">SESSION SECURITY</span>
        <h2 id="session-timeout-title">Are you still there?</h2>
        <p id="session-timeout-description">For your account security, we'll sign you out after 30 minutes of inactivity. Your session is about to expire.</p>
        <div className="session-timeout-countdown" aria-live="polite">{minutes}:{seconds}</div>
        <div className="session-timeout-actions">
          <button type="button" className="btn btn-primary" onClick={staySignedIn}>Stay signed in</button>
          <button type="button" className="btn btn-outline" onClick={handleSignOut}><LogOut size={16}/> Sign out now</button>
        </div>
      </section>
    </div>
  )
}

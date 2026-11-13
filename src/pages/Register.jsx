import { Link } from 'react-router-dom'
import { UserRound, Mail, LockKeyhole, ArrowRight } from 'lucide-react'

export default function Register() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">NILE <span>ANALYTICS LABS</span></div>
        <h1>Create your account.</h1>
        <p>Join Nile Analytics Labs and start building practical data skills.</p>
        <div className="demo-note">Preview only — account registration will be enabled when the backend is connected. This form does not create or store an account.</div>
        <form onSubmit={event => event.preventDefault()}>
          <label>Full name<div className="input-icon"><UserRound /><input autoComplete="name" placeholder="Your full name" /></div></label>
          <label>Email address<div className="input-icon"><Mail /><input type="email" autoComplete="email" placeholder="you@example.com" /></div></label>
          <label>Password<div className="input-icon"><LockKeyhole /><input type="password" autoComplete="new-password" placeholder="Password field preview" /></div></label>
          <button className="btn btn-primary full" type="button" disabled>Create Account <ArrowRight size={18} /></button>
        </form>
        <p className="auth-bottom">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  )
}

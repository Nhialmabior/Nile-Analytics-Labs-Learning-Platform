import { Link } from 'react-router-dom'
import { LockKeyhole, Mail, ArrowRight } from 'lucide-react'

export default function Login() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">NILE <span>ANALYTICS LABS</span></div>
        <h1>Welcome back.</h1>
        <p>Sign in to continue your learning journey.</p>
        <div className="demo-note">Preview only — account sign-in will be enabled when the backend is connected. Do not enter a real password here.</div>
        <form onSubmit={event => event.preventDefault()}>
          <label>Email address<div className="input-icon"><Mail /><input type="email" autoComplete="email" placeholder="you@example.com" /></div></label>
          <label>Password<div className="input-icon"><LockKeyhole /><input type="password" autoComplete="current-password" placeholder="Password field preview" /></div></label>
          <div className="form-row"><label className="check"><input type="checkbox" /> Remember me</label><span>Coming soon</span></div>
          <button className="btn btn-primary full" type="button" disabled>Sign In <ArrowRight size={18} /></button>
        </form>
        <p className="auth-bottom">Don't have an account? <Link to="/register">Create one</Link></p>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LockKeyhole, Mail, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { user, role, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!loading && user && role) return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (signInError) {
      setError(signInError.message)
      setSubmitting(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('role').eq('id', data.user.id).single()

    setSubmitting(false)
    if (profileError) {
      setError('Your account is signed in, but its profile is not available. Please run supabase/setup.sql in your project SQL Editor.')
      return
    }
    if (profile.role === 'admin') navigate('/admin', { replace: true })
    else navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">NILE <span>ANALYTICS LABS</span></div>
        <h1>Welcome back.</h1>
        <p>Sign in to continue your learning journey.</p>
        {error && <div className="auth-message auth-error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Email address<div className="input-icon"><Mail /><input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} required /></div></label>
          <label>Password<div className="input-icon"><LockKeyhole /><input type="password" autoComplete="current-password" placeholder="Your password" value={password} onChange={event => setPassword(event.target.value)} required /></div></label>
          <button className="btn btn-primary full" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign In'} <ArrowRight size={18} /></button>
        </form>
        <p className="auth-bottom">Don't have an account? <Link to="/register">Create a learner account</Link></p>
      </div>
    </div>
  )
}

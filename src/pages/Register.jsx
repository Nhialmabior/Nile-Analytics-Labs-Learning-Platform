import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { UserRound, Mail, LockKeyhole, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  if (!loading && user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (password.length < 8) {
      setError('Use a password with at least 8 characters.')
      return
    }
    setSubmitting(true)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } }
    })
    setSubmitting(false)
    if (signUpError) {
      setError(signUpError.message)
      return
    }
    if (data.session) navigate('/dashboard', { replace: true })
    else setMessage('Your learner account has been created. Check your email for the confirmation link, then sign in.')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">NILE <span>ANALYTICS LABS</span></div>
        <h1>Create your account.</h1>
        <p>Join Nile Analytics Labs and start building practical data skills.</p>
        <div className="demo-note">Learner registration is open. Administrator accounts are created separately by the platform owner.</div>
        {error && <div className="auth-message auth-error" role="alert">{error}</div>}
        {message && <div className="auth-message" role="status">{message}</div>}
        <form onSubmit={handleSubmit}>
          <label>Full name<div className="input-icon"><UserRound /><input autoComplete="name" placeholder="Your full name" value={fullName} onChange={event => setFullName(event.target.value)} required /></div></label>
          <label>Email address<div className="input-icon"><Mail /><input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} required /></div></label>
          <label>Password<div className="input-icon"><LockKeyhole /><input type="password" autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={event => setPassword(event.target.value)} minLength={8} required /></div></label>
          <button className="btn btn-primary full" type="submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Create Learner Account'} <ArrowRight size={18} /></button>
        </form>
        <p className="auth-bottom">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LockKeyhole, UserRound, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { learnerLoginEmail } from '../lib/learnerIdentity'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { user, role, profile, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!loading && user && role && profile?.access_enabled) {
    return <Navigate to={location.state?.from?.pathname || (role === 'admin' ? '/admin' : '/dashboard')} state={location.state?.from?.state} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: learnerLoginEmail(loginId),
      password
    })
    if (signInError) {
      setError('The Login ID/email or password is incorrect.')
      setSubmitting(false)
      return
    }

    const { data: account, error: profileError } = await supabase
      .from('profiles').select('role, access_enabled').eq('id', data.user.id).single()

    if (profileError || !account?.access_enabled) {
      await supabase.auth.signOut()
      setError('This account is not authorised to access the LMS. Learners must activate an administrator-issued voucher first.')
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    if (account.role === 'admin') navigate('/admin', { replace: true })
    else navigate(location.state?.from?.pathname || '/dashboard', { replace: true, state: location.state?.from?.state })
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">NILE <span>ANALYTICS LABS</span></div>
        <h1>Welcome back.</h1>
        <p>Sign in with your administrator-issued Login ID and password.</p>
        {location.state?.accessDenied && <div className="auth-message auth-error" role="alert">This account does not currently have LMS access.</div>}
        {error && <div className="auth-message auth-error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Login ID or administrator email<div className="input-icon"><UserRound /><input type="text" autoComplete="username" placeholder="NAL-XXXXXXXXXX" value={loginId} onChange={event => setLoginId(event.target.value)} required /></div></label>
          <label>Password<div className="input-icon"><LockKeyhole /><input type="password" autoComplete="current-password" placeholder="Your password" value={password} onChange={event => setPassword(event.target.value)} required /></div></label>
          <button className="btn btn-primary full" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign In'} <ArrowRight size={18} /></button>
        </form>
        <p className="auth-bottom">Have an administrator-issued voucher? <Link to="/register">Activate your account</Link></p>
      </div>
    </div>
  )
}

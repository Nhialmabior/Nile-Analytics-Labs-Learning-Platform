import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LockKeyhole, UserRound, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { learnerLoginEmail } from '../lib/learnerIdentity'
import { useAuth } from '../context/AuthContext'

const REMEMBERED_LOGIN_KEY = 'nile-lms:remembered-login-id'

function getRememberedLogin() {
  try {
    return localStorage.getItem(REMEMBERED_LOGIN_KEY) || ''
  } catch {
    return ''
  }
}

export default function Login() {
  const [loginId, setLoginId] = useState(getRememberedLogin)
  const [rememberMe, setRememberMe] = useState(() => Boolean(getRememberedLogin()))
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { user, role, profile, loading, sessionExpired } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!loading && user && role && profile?.access_enabled) {
    return <Navigate to={location.state?.from?.pathname || (role === 'admin' ? '/admin' : '/dashboard')} state={location.state?.from?.state} replace />
  }

  function updateRememberMe(checked) {
    setRememberMe(checked)
    if (!checked) {
      try {
        localStorage.removeItem(REMEMBERED_LOGIN_KEY)
      } catch {
        // Remember-me remains disabled for this page session.
      }
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: learnerLoginEmail(loginId.trim()),
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
      try {
        localStorage.removeItem(REMEMBERED_LOGIN_KEY)
      } catch {
        // Ignore storage restrictions.
      }
      setError('This account is not authorised to access the LMS. Learners must activate an administrator-issued voucher first.')
      setSubmitting(false)
      return
    }

    try {
      if (rememberMe) localStorage.setItem(REMEMBERED_LOGIN_KEY, loginId.trim())
      else localStorage.removeItem(REMEMBERED_LOGIN_KEY)
    } catch {
      // Sign-in remains available even when browser storage is restricted.
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
        {sessionExpired && <div className="auth-message auth-error" role="status">You were signed out automatically after 30 minutes of inactivity. Please sign in again.</div>}
        {location.state?.accessDenied && <div className="auth-message auth-error" role="alert">This account does not currently have LMS access.</div>}
        {error && <div className="auth-message auth-error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit} autoComplete="off">
          <label>Login ID or administrator email<div className="input-icon"><UserRound /><input type="text" name="lms-login-id" autoComplete="off" placeholder="NAL-XXXXXXXXXX" value={loginId} onChange={event => setLoginId(event.target.value)} required /></div></label>
          <label>Password<div className="input-icon password-input-wrap"><LockKeyhole /><input type={showPassword ? 'text' : 'password'} name="lms-password" autoComplete="off" placeholder="Your password" value={password} onChange={event => setPassword(event.target.value)} required /><button className="password-visibility-btn" type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
          <div className="login-options">
            <label className="remember-me-option"><input type="checkbox" checked={rememberMe} onChange={event => updateRememberMe(event.target.checked)} /> <span>Remember me</span></label>
            <span className="remember-me-hint">Remembers your Login ID on this device only.</span>
          </div>
          <button className="btn btn-primary full" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign In'} <ArrowRight size={18} /></button>
        </form>
        <p className="auth-bottom">Have an administrator-issued voucher? <Link to="/register">Activate your account</Link></p>
      </div>
    </div>
  )
}

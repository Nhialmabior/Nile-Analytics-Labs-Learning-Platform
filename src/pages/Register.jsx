import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { UserRound, Ticket, LockKeyhole, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { learnerLoginEmail } from '../lib/learnerIdentity'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [loginId, setLoginId] = useState('')
  const [voucher, setVoucher] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()

  if (!loading && user && profile?.access_enabled) return <Navigate to="/dashboard" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (password.length < 10) {
      setError('Your password must contain at least 10 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    setSubmitting(true)
    const { data, error: activationError } = await supabase.functions.invoke('redeem-learner-voucher', {
      body: { loginId: loginId.trim().toUpperCase(), voucher: voucher.trim().toUpperCase(), password }
    })
    if (activationError || data?.error || !data?.success) {
      setError(data?.error || activationError?.message || 'Account activation failed. Check your details and try again.')
      setSubmitting(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: learnerLoginEmail(loginId),
      password
    })
    setSubmitting(false)
    if (signInError) {
      setError('Your account was activated. Please return to Sign In and use your Login ID and new password.')
      return
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">NILE <span>ANALYTICS LABS</span></div>
        <h1>Activate your account.</h1>
        <p>Enter the Login ID and one-time voucher supplied by the administrator, then create your private password.</p>
        <div className="demo-note">Vouchers are valid for 30 days and can only be redeemed once. Keep your password private.</div>
        {error && <div className="auth-message auth-error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Administrator-issued Login ID<div className="input-icon"><UserRound /><input autoComplete="username" placeholder="NAL-XXXXXXXXXX" value={loginId} onChange={event => setLoginId(event.target.value.toUpperCase())} required /></div></label>
          <label>One-time voucher<div className="input-icon"><Ticket /><input autoComplete="off" placeholder="Enter your voucher code" value={voucher} onChange={event => setVoucher(event.target.value.toUpperCase())} required /></div></label>
          <label>Create password<div className="input-icon"><LockKeyhole /><input type="password" autoComplete="new-password" placeholder="At least 10 characters" value={password} onChange={event => setPassword(event.target.value)} minLength={10} required /></div></label>
          <label>Confirm password<div className="input-icon"><LockKeyhole /><input type="password" autoComplete="new-password" placeholder="Re-enter your password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} minLength={10} required /></div></label>
          <button className="btn btn-primary full" type="submit" disabled={submitting}>{submitting ? 'Activating account…' : 'Activate learner account'} <ArrowRight size={18} /></button>
        </form>
        <p className="auth-bottom">Already activated? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  )
}
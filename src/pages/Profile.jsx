import { useEffect, useState } from 'react'
import { UserRound, Mail, ShieldCheck, CalendarDays, Phone, MapPin, Building2, FileText, Save, LoaderCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const emptyForm = { full_name: '', phone: '', location: '', institution: '', bio: '' }

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setForm({
      full_name: profile?.full_name || user?.user_metadata?.full_name || '',
      phone: profile?.phone || '',
      location: profile?.location || '',
      institution: profile?.institution || '',
      bio: profile?.bio || ''
    })
  }, [profile, user])

  const fullName = form.full_name.trim() || 'Learner'
  const initials = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'L'
  const registeredAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Not available'

  const updateField = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }))

  const handleSave = async event => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    const updates = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]))
    if (!updates.full_name) {
      setError('Please enter your full name.')
      setSaving(false)
      return
    }
    const { error: saveError } = await supabase.from('profiles').update(updates).eq('id', user.id)
    if (saveError) {
      setError(saveError.message || 'Your profile could not be updated.')
    } else {
      const { error: refreshError } = await refreshProfile()
      if (refreshError) setError('Your changes were saved, but the profile could not be refreshed. Please reload the page.')
      else setMessage('Your profile has been updated successfully.')
    }
    setSaving(false)
  }

  return (
    <div>
      <div className="dash-heading"><div><span className="section-kicker">ACCOUNT</span><h1>My Profile</h1><p>View and update your learner information.</p></div></div>
      <div className="profile-grid">
        <div className="profile-card">
          <div className="large-avatar">{initials}</div><h2>{fullName}</h2>
          <p>Learner at Nile Analytics Labs</p>
          <span className="profile-badge"><ShieldCheck size={15} /> Learner account</span>
        </div>
        <form className="profile-form" onSubmit={handleSave}>
          <h3>Edit personal information</h3>
          {message && <div className="admin-alert success" role="status">{message}</div>}
          {error && <div className="admin-alert error" role="alert">{error}</div>}
          <label>Full name<div className="input-icon"><UserRound /><input name="full_name" value={form.full_name} onChange={updateField} required maxLength={120} autoComplete="name" /></div></label>
          <label>Email address<div className="input-icon"><Mail /><input value={user?.email || ''} readOnly /></div><span className="profile-field-hint">Email changes require a separate verification process.</span></label>
          <label>Phone number<div className="input-icon"><Phone /><input name="phone" type="tel" value={form.phone} onChange={updateField} maxLength={30} autoComplete="tel" placeholder="e.g. +254..." /></div></label>
          <label>Location<div className="input-icon"><MapPin /><input name="location" value={form.location} onChange={updateField} maxLength={120} autoComplete="address-level2" placeholder="City, county or country" /></div></label>
          <label>Institution / Organisation<div className="input-icon"><Building2 /><input name="institution" value={form.institution} onChange={updateField} maxLength={160} placeholder="Your school, university or organisation" /></div></label>
          <label>About me<div className="input-icon profile-textarea-icon"><FileText /><textarea name="bio" value={form.bio} onChange={updateField} rows={4} maxLength={500} placeholder="Share a short introduction about yourself and your learning goals." /></div></label>
          <div className="profile-save-row"><span className="profile-field-hint">Account role and registration date cannot be edited.</span><button className="btn btn-primary" type="submit" disabled={saving || !user}>{saving ? <><LoaderCircle size={16} className="admin-spin" /> Saving...</> : <><Save size={16} /> Save changes</>}</button></div>
          <div className="profile-account-meta"><CalendarDays size={15} /> Account created {registeredAt}</div>
        </form>
      </div>
    </div>
  )
}

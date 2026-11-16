import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)
const IDLE_TIMEOUT_MS = 30 * 60 * 1000
const IDLE_WARNING_MS = 2 * 60 * 1000
const ACTIVITY_STORAGE_KEY = 'nile-lms:last-activity'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [idleWarning, setIdleWarning] = useState(false)
  const [idleRemaining, setIdleRemaining] = useState(IDLE_WARNING_MS)
  const [sessionExpired, setSessionExpired] = useState(false)
  const lastActivityRef = useRef(Date.now())

  useEffect(() => {
    let active = true
    let profileRequest = 0

    async function loadProfile(user) {
      const requestId = ++profileRequest

      if (!user) {
        if (active && requestId === profileRequest) {
          setProfile(null)
          setLoading(false)
        }
        return
      }

      if (active) setLoading(true)

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, phone, location, institution, bio, access_enabled')
        .eq('id', user.id)
        .maybeSingle()

      if (active && requestId === profileRequest) {
        setProfile(error ? null : data)
        setLoading(false)
      }
    }

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!active) return
      setSession(currentSession)
      await loadProfile(currentSession?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setLoading(true)
      if (event === 'SIGNED_IN') setSessionExpired(false)
      // Defer the Supabase query until after the auth callback completes.
      setTimeout(() => {
        if (active) loadProfile(nextSession?.user ?? null)
      }, 0)
    })

    return () => {
      active = false
      profileRequest += 1
      subscription.unsubscribe()
    }
  }, [])

  // End inactive sessions locally after 30 minutes. Activity is shared between
  // tabs so using another LMS tab keeps the current browser session alive.
  useEffect(() => {
    if (!session?.user?.id) {
      setIdleWarning(false)
      setIdleRemaining(IDLE_WARNING_MS)
      return undefined
    }

    lastActivityRef.current = Date.now()
    try {
      localStorage.setItem(ACTIVITY_STORAGE_KEY, String(lastActivityRef.current))
    } catch {
      // The timeout still works in browsers where storage is unavailable.
    }

    let signingOut = false
    let lastStoredActivity = lastActivityRef.current

    function recordActivity() {
      const now = Date.now()
      if (now - lastStoredActivity < 4000) return
      lastStoredActivity = now
      lastActivityRef.current = now
      setIdleWarning(false)
      setIdleRemaining(IDLE_WARNING_MS)
      try {
        localStorage.setItem(ACTIVITY_STORAGE_KEY, String(now))
      } catch {
        // Ignore storage restrictions; local activity still resets this tab.
      }
    }

    function handleStorage(event) {
      if (event.key !== ACTIVITY_STORAGE_KEY) return
      const timestamp = Number(event.newValue)
      if (Number.isFinite(timestamp) && timestamp > lastActivityRef.current) {
        lastActivityRef.current = timestamp
        lastStoredActivity = timestamp
        setIdleWarning(false)
      }
    }

    const activityEvents = ['pointerdown', 'keydown', 'touchstart', 'scroll', 'click']
    activityEvents.forEach(name => window.addEventListener(name, recordActivity, { passive: true }))
    window.addEventListener('storage', handleStorage)

    const interval = window.setInterval(async () => {
      const elapsed = Date.now() - lastActivityRef.current
      const remaining = IDLE_TIMEOUT_MS - elapsed

      if (remaining <= 0 && !signingOut) {
        signingOut = true
        window.clearInterval(interval)
        setIdleWarning(false)
        setSessionExpired(true)
        await supabase.auth.signOut({ scope: 'local' })
        return
      }

      if (remaining <= IDLE_WARNING_MS) {
        setIdleWarning(true)
        setIdleRemaining(Math.max(0, remaining))
      } else if (idleWarning) {
        setIdleWarning(false)
      }
    }, 1000)

    return () => {
      window.clearInterval(interval)
      activityEvents.forEach(name => window.removeEventListener(name, recordActivity))
      window.removeEventListener('storage', handleStorage)
    }
  }, [session?.user?.id])

  const refreshProfile = async () => {
    const currentUser = session?.user
    if (!currentUser) return { error: new Error('You must be signed in.') }
    const { data, error } = await supabase.from('profiles')
      .select('id, full_name, role, phone, location, institution, bio, access_enabled')
      .eq('id', currentUser.id).maybeSingle()
    if (!error) setProfile(data)
    return { data, error }
  }

  const staySignedIn = () => {
    const now = Date.now()
    lastActivityRef.current = now
    try {
      localStorage.setItem(ACTIVITY_STORAGE_KEY, String(now))
    } catch {
      // The in-memory timer is still reset.
    }
    setIdleWarning(false)
    setIdleRemaining(IDLE_WARNING_MS)
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    loading,
    idleWarning,
    idleRemaining,
    sessionExpired,
    staySignedIn,
    refreshProfile,
    signOut: () => supabase.auth.signOut({ scope: 'local' })
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

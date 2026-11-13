import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

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
        .select('id, full_name, role, phone, location, institution, bio')
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setLoading(true)
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

  const refreshProfile = async () => {
    const currentUser = session?.user
    if (!currentUser) return { error: new Error('You must be signed in.') }
    const { data, error } = await supabase.from('profiles')
      .select('id, full_name, role, phone, location, institution, bio')
      .eq('id', currentUser.id).maybeSingle()
    if (!error) setProfile(data)
    return { data, error }
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    loading,
    refreshProfile,
    signOut: () => supabase.auth.signOut()
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

import { createClient } from '@supabase/supabase-js'

// Public browser credentials. Database access is protected by Supabase RLS.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://seonmdfmdajmktsfvvvt.supabase.co'
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_V1g3cpM1_3yZhrq7lTuTkg_f8GSpK9b'

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
})

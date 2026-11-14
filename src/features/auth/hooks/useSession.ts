'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/shared/lib/supabase'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'demo'

/** Sesión de Supabase Auth. En modo demo no hay login. */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured ? 'loading' : 'demo')

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setStatus(data.session ? 'authenticated' : 'anonymous')
    })
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setStatus(newSession ? 'authenticated' : 'anonymous')
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return { session, status, email: session?.user.email ?? null }
}

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('Supabase no está configurado')
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    throw new Error(
      error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : error.message
    )
  }
}

export async function signOut() {
  await supabase?.auth.signOut()
}

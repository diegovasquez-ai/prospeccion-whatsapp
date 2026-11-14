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

/** true si el CRM aún no tiene cuenta (se muestra el formulario de registro) */
export async function needsFirstAccount(): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase.rpc('crm_tiene_usuario')
  if (error) return false
  return data === false
}

/** Crea la única cuenta del CRM y entra directamente */
export async function signUpFirstAccount(email: string, password: string) {
  if (!supabase) throw new Error('Supabase no está configurado')
  if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres')
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) {
    throw new Error(
      /registrad|Database error/i.test(error.message)
        ? 'Este CRM ya tiene una cuenta. Inicia sesión.'
        : error.message
    )
  }
  await signIn(email, password)
}

export async function signOut() {
  await supabase?.auth.signOut()
}

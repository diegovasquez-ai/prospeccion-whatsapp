'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { Button, buttonClasses } from '@/shared/components/ui/Button'
import { Field, Input } from '@/shared/components/ui/Form'
import { isSupabaseConfigured } from '@/shared/lib/supabase'
import { signIn, useSession } from '@/features/auth/hooks/useSession'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next')?.startsWith('/') ? params.get('next')! : '/dashboard'
  const { status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') router.replace(next)
  }, [status, router, next])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signIn(email.trim(), password)
      router.replace(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-text-secondary">
          Supabase no está configurado. El CRM funciona en <strong className="text-text-primary">modo demo</strong> sin necesidad de iniciar sesión.
        </p>
        <Link href="/dashboard" className={buttonClasses('primary', 'md', 'w-full justify-center')}>
          Entrar en modo demo
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Email" htmlFor="email">
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Contraseña" htmlFor="password">
        <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" loading={loading} className="w-full justify-center">
        Iniciar sesión
      </Button>
      <p className="text-xs text-text-tertiary text-center">
        Los usuarios se crean en Supabase → Authentication → Users.
      </p>
    </form>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border-primary bg-background-card p-6 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-vivid-green/15 text-vivid-green">
            <MessageCircle size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">CRM WhatsApp</h1>
            <p className="text-xs text-text-secondary">Prospección comercial</p>
          </div>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}

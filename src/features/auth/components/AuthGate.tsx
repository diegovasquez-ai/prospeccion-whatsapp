'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LoadingState } from '@/shared/components/ui/Layout'
import { useSession } from '../hooks/useSession'

/** Exige iniciar sesión cuando Supabase está configurado */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'anonymous') router.replace(`/login?next=${encodeURIComponent(pathname)}`)
  }, [status, router, pathname])

  if (status === 'loading' || status === 'anonymous') {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState label="Verificando sesión…" />
      </div>
    )
  }
  return <>{children}</>
}

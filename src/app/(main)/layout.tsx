'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  CalendarClock,
  FileText,
  History,
  KanbanSquare,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  Users,
  X,
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import { isSupabaseConfigured } from '@/shared/lib/supabase'
import { AuthGate } from '@/features/auth/components/AuthGate'
import { signOut, useSession } from '@/features/auth/hooks/useSession'
import { GlobalDialogs } from '@/shared/components/GlobalDialogs'
import { useSeguimientos } from '@/features/seguimientos/hooks/useSeguimientos'
import { estadoSeguimiento } from '@/features/seguimientos/utils/estado'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { href: '/contactos', label: 'Contactos', icon: Users },
  { href: '/seguimientos', label: 'Seguimientos', icon: CalendarClock },
  { href: '/historial', label: 'Historial', icon: History },
  { href: '/plantillas', label: 'Plantillas', icon: FileText },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
]

function useVencidos() {
  const { data = [] } = useSeguimientos()
  return data.filter((s) => estadoSeguimiento(s) === 'vencido').length
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const vencidos = useVencidos()
  const { email } = useSession()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border-primary">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-vivid-green/15 text-vivid-green">
          <MessageCircle size={20} />
        </div>
        <div>
          <p className="font-bold text-text-primary leading-tight">CRM WhatsApp</p>
          <p className="text-xs text-text-tertiary">Prospección comercial</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Navegación principal">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-vivid-cyan/10 text-vivid-cyan' : 'text-text-secondary hover:bg-background-card hover:text-text-primary'
              )}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {href === '/seguimientos' && vencidos > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">{vencidos}</span>
              )}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-border-primary px-4 py-3 text-xs">
        {isSupabaseConfigured ? (
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-text-secondary" title={email ?? ''}>{email}</span>
            <button onClick={signOut} className="flex items-center gap-1 text-text-tertiary hover:text-text-primary" title="Cerrar sesión">
              <LogOut size={14} /> Salir
            </button>
          </div>
        ) : (
          <Link href="/configuracion" onClick={onNavigate} className="flex items-center gap-2 text-vivid-yellow">
            <span className="h-2 w-2 rounded-full bg-vivid-yellow" /> Modo demo · conectar Supabase
          </Link>
        )}
      </div>
    </div>
  )
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <AuthGate>
      <div className="flex h-screen bg-background">
        <aside className="hidden lg:block w-60 shrink-0 border-r border-border-primary bg-background-elevated">
          <Sidebar />
        </aside>

        {menuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-64 bg-background-elevated border-r border-border-primary">
              <button onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" className="absolute right-3 top-5 text-text-tertiary">
                <X size={20} />
              </button>
              <Sidebar onNavigate={() => setMenuOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex flex-1 flex-col min-w-0">
          <header className="lg:hidden flex items-center gap-3 border-b border-border-primary bg-background-elevated px-4 py-3">
            <button onClick={() => setMenuOpen(true)} aria-label="Abrir menú" className="text-text-secondary">
              <Menu size={22} />
            </button>
            <span className="font-semibold text-text-primary">CRM WhatsApp</span>
          </header>
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
      <GlobalDialogs />
    </AuthGate>
  )
}

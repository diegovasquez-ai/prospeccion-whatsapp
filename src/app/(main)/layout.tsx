'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Trello, Calendar, BarChart3 } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

const NAV_ITEMS = [
  {
    href: '/pipeline',
    label: 'Pipeline',
    icon: Trello,
  },
  {
    href: '/hoy',
    label: 'HOY',
    icon: Calendar,
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: BarChart3,
  },
]

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border-primary flex flex-col bg-background-elevated">
        {/* Logo / Header */}
        <div className="px-6 py-6 border-b border-border-primary">
          <h1 className="text-xl font-bold bg-gradient-vivid bg-clip-text text-transparent">
            CRM WhatsApp
          </h1>
          <p className="text-sm text-text-secondary mt-1">Prospección B2B</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium group',
                      isActive
                        ? 'bg-vivid-cyan/10 text-vivid-cyan border border-vivid-cyan/30'
                        : 'text-text-secondary hover:bg-background-card hover:text-text-primary border border-transparent'
                    )}
                  >
                    <Icon
                      size={20}
                      className={cn(
                        isActive && 'drop-shadow-[0_0_8px_rgba(0,217,255,0.5)]'
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-primary">
          <p className="text-xs text-text-tertiary">v1.0.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden bg-background">{children}</main>
    </div>
  )
}

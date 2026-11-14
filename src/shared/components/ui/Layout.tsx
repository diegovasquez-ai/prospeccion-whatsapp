import { AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">{title}</h1>
        {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 py-6', className)}>{children}</div>
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border-primary bg-background-card', className)}>{children}</div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-4">
      {icon && <div className="mb-3 text-text-tertiary">{icon}</div>}
      <p className="font-medium text-text-primary">{title}</p>
      {description && <p className="text-sm text-text-secondary mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-text-secondary text-sm">
      <Loader2 size={18} className="animate-spin" /> {label}
    </div>
  )
}

export function ErrorState({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : 'Error desconocido'
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm">
      <AlertTriangle className="text-red-400 shrink-0" size={18} />
      <div>
        <p className="font-medium text-red-300">No se pudieron cargar los datos</p>
        <p className="text-text-secondary mt-0.5">{message}</p>
        <p className="text-text-tertiary mt-1">
          Revisa la conexión en <a href="/configuracion" className="underline">Configuración</a>.
        </p>
      </div>
    </div>
  )
}

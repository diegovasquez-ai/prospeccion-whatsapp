'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarCheck2, CalendarClock, CalendarDays, CalendarPlus, CheckCircle2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Card, EmptyState, ErrorState, LoadingState, Page, PageHeader } from '@/shared/components/ui/Layout'
import { useCrmUi } from '@/shared/stores/crm-ui-store'
import { cn } from '@/shared/utils/cn'
import { useLeads } from '@/features/leads/hooks/useLeads'
import { SeguimientoItem } from '@/features/seguimientos/components/SeguimientoItem'
import { useSeguimientos } from '@/features/seguimientos/hooks/useSeguimientos'
import type { EstadoSeguimiento, Seguimiento } from '@/features/seguimientos/types'
import { agruparSeguimientos } from '@/features/seguimientos/utils/estado'

const TABS: { key: EstadoSeguimiento; label: string; icon: React.ReactNode }[] = [
  { key: 'vencido', label: 'Vencidos', icon: <AlertTriangle size={16} /> },
  { key: 'hoy', label: 'Hoy', icon: <CalendarClock size={16} /> },
  { key: 'proximo', label: 'Próximos', icon: <CalendarDays size={16} /> },
  { key: 'completado', label: 'Completados', icon: <CalendarCheck2 size={16} /> },
]

const VACIO: Record<EstadoSeguimiento, string> = {
  vencido: '¡Al día! No tienes seguimientos vencidos.',
  hoy: 'No hay seguimientos programados para hoy.',
  proximo: 'No hay seguimientos futuros programados.',
  completado: 'Aún no has completado seguimientos.',
}

export default function SeguimientosPage() {
  const { openSeguimientoForm } = useCrmUi()
  const { data: seguimientos = [], isLoading, error } = useSeguimientos()
  const { all: leads } = useLeads()
  const grupos = useMemo(() => agruparSeguimientos(seguimientos), [seguimientos])
  const [tab, setTab] = useState<EstadoSeguimiento | null>(null)
  const activo = tab ?? (grupos.vencido.length > 0 ? 'vencido' : 'hoy')
  const leadsById = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads])
  const sinSeguimiento = leads.filter(
    (l) => !l.proxima_fecha_seguimiento && !['cliente', 'cerrado'].includes(l.etapa)
  ).length

  const lista: Seguimiento[] = grupos[activo]

  return (
    <Page className="max-w-4xl">
      <PageHeader
        title="Seguimientos"
        description="Tareas pendientes y vencidas con tus prospectos"
        actions={<Button onClick={() => openSeguimientoForm()}><CalendarPlus size={16} /> Programar seguimiento</Button>}
      />

      <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={activo === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors',
              activo === t.key ? 'border-vivid-cyan/60 bg-vivid-cyan/10 text-text-primary' : 'border-border-primary bg-background-card text-text-secondary hover:text-text-primary'
            )}
          >
            <span className={cn('flex items-center gap-2', t.key === 'vencido' && grupos.vencido.length > 0 && 'text-red-400')}>
              {t.icon} {t.label}
            </span>
            <span className="font-semibold tabular-nums">{grupos[t.key].length}</span>
          </button>
        ))}
      </div>

      {sinSeguimiento > 0 && (
        <p className="mb-4 rounded-lg border border-vivid-yellow/30 bg-vivid-yellow/5 px-3 py-2 text-xs text-vivid-yellow">
          {sinSeguimiento} oportunidades abiertas no tienen un próximo seguimiento programado.
        </p>
      )}

      {isLoading ? <LoadingState /> : error ? <ErrorState error={error} /> : lista.length === 0 ? (
        <Card><EmptyState icon={<CheckCircle2 size={32} />} title={VACIO[activo]} /></Card>
      ) : (
        <ul className="space-y-2">
          {lista.map((s) => <SeguimientoItem key={s.id} seguimiento={s} lead={leadsById.get(s.lead_id)} />)}
        </ul>
      )}
    </Page>
  )
}

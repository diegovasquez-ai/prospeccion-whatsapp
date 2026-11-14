'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Input, Select, toOptions } from '@/shared/components/ui/Form'
import { ErrorState, LoadingState } from '@/shared/components/ui/Layout'
import { useCrmUi } from '@/shared/stores/crm-ui-store'
import { formatMoney } from '@/shared/utils/dates'
import { KanbanBoard } from '@/features/leads/components/KanbanBoard'
import { useLeads } from '@/features/leads/hooks/useLeads'
import { PRIORIDAD_LABELS, type LeadFilters, type Prioridad } from '@/features/leads/types'

export default function PipelinePage() {
  const router = useRouter()
  const openLeadForm = useCrmUi((s) => s.openLeadForm)
  const [search, setSearch] = useState('')
  const [prioridad, setPrioridad] = useState<Prioridad | ''>('')
  const [calificado, setCalificado] = useState('')

  const filters = useMemo<LeadFilters>(
    () => ({ search, prioridad, es_calificado: calificado === '' ? null : calificado === 'si' }),
    [search, prioridad, calificado]
  )
  const { data: leads, isLoading, error } = useLeads(filters)
  const abiertos = leads.filter((l) => !['cliente', 'cerrado'].includes(l.etapa))
  const valor = abiertos.reduce((acc, l) => acc + (l.valor_estimado ?? 0), 0)

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border-primary bg-background-elevated px-4 sm:px-6 py-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Pipeline de prospección</h1>
            <p className="text-xs text-text-secondary mt-0.5">
              {abiertos.length} oportunidades abiertas · {formatMoney(valor)} en juego · arrastra las tarjetas para cambiar de etapa
            </p>
          </div>
          <Button onClick={() => openLeadForm()}>
            <Plus size={16} /> Nuevo contacto
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <Input aria-label="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, teléfono, ciudad…" className="pl-9" />
          </div>
          <Select aria-label="Prioridad" value={prioridad} onChange={(e) => setPrioridad(e.target.value as Prioridad | '')} placeholder="Todas las prioridades" options={toOptions(PRIORIDAD_LABELS)} className="sm:w-48" />
          <Select aria-label="Calificación" value={calificado} onChange={(e) => setCalificado(e.target.value)} placeholder="Calificados y no calificados" options={[{ value: 'si', label: 'Solo calificados' }, { value: 'no', label: 'No calificados' }]} className="sm:w-56" />
        </div>
      </header>
      <div className="flex-1 overflow-auto px-4 sm:px-6 py-4">
        {isLoading ? (
          <LoadingState label="Cargando pipeline…" />
        ) : error ? (
          <ErrorState error={error} />
        ) : (
          <KanbanBoard leads={leads} onLeadClick={(lead) => router.push(`/contactos/${lead.id}`)} />
        )}
      </div>
    </div>
  )
}

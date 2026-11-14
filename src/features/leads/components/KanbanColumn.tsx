'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/shared/utils/cn'
import { formatMoney } from '@/shared/utils/dates'
import { SortableLeadCard } from './SortableLeadCard'
import { ETAPA_COLORS, ETAPA_LABELS, type EtapaLeadType, type Lead } from '../types'

interface KanbanColumnProps {
  etapa: EtapaLeadType
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
}

export function KanbanColumn({ etapa, leads, onLeadClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa })
  const color = ETAPA_COLORS[etapa]
  const valor = leads.reduce((acc, l) => acc + (l.valor_estimado ?? 0), 0)

  return (
    <section className="flex w-72 shrink-0 flex-col" aria-label={ETAPA_LABELS[etapa]}>
      <header className="mb-2 px-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <span className={cn('h-2 w-2 rounded-full', color.bg)} />
            {ETAPA_LABELS[etapa]}
          </h2>
          <span className="rounded-full bg-background-card px-2 py-0.5 text-xs text-text-secondary">{leads.length}</span>
        </div>
        {valor > 0 && <p className="mt-0.5 pl-4 text-[11px] text-text-tertiary">{formatMoney(valor)}</p>}
      </header>
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-2 rounded-xl border p-2 transition-colors min-h-[200px]',
          isOver ? cn('bg-background-card/80', color.border) : 'border-border-primary bg-background-elevated/60'
        )}
      >
        {leads.map((lead) => (
          <SortableLeadCard key={lead.id} lead={lead} onClick={() => onLeadClick(lead)} />
        ))}
        {leads.length === 0 && (
          <p className="py-6 text-center text-xs text-text-tertiary">Arrastra contactos aquí</p>
        )}
      </div>
    </section>
  )
}

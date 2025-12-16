import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableLeadCard } from './SortableLeadCard'
import type { Lead, EtapaLeadType } from '../types'
import { cn } from '@/shared/utils/cn'

interface KanbanColumnProps {
  etapa: EtapaLeadType
  title: string
  leads: Lead[]
  onLeadClick?: (lead: Lead) => void
}

export function KanbanColumn({
  etapa,
  title,
  leads,
  onLeadClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: etapa,
  })

  const leadIds = leads.map((lead) => lead.id!)

  return (
    <div className="flex-shrink-0 w-80 flex flex-col">
      {/* Header de columna */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-text-primary">{title}</h3>
        <span className="text-sm text-text-primary bg-vivid-cyan/20 px-2 py-0.5 rounded-full border border-vivid-cyan/30">
          {leads.length}
        </span>
      </div>

      {/* Zona de drop */}
      <div
        ref={setNodeRef}
        className={cn(
          'min-h-[500px] rounded-lg p-3 transition-all duration-200 flex-1',
          isOver
            ? 'bg-vivid-cyan/10 border-2 border-vivid-cyan shadow-lg shadow-vivid-cyan/20'
            : 'bg-background-elevated border-2 border-border-primary'
        )}
      >
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {leads.map((lead) => (
              <SortableLeadCard
                key={lead.id}
                lead={lead}
                onClick={() => onLeadClick?.(lead)}
              />
            ))}

            {leads.length === 0 && (
              <p className="text-center text-text-tertiary text-sm py-8">
                No hay leads en esta etapa
              </p>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}

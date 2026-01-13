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
  colorStyles: {
    borderColor: string
    badgeBg: string
    badgeText: string
    glow: string
  }
}

export function KanbanColumn({
  etapa,
  title,
  leads,
  onLeadClick,
  colorStyles,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: etapa,
  })

  const leadIds = leads.map((lead) => lead.id!)

  return (
    <div className="flex-shrink-0 w-80 flex flex-col">
      {/* Header de columna */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className={cn('font-semibold', colorStyles.badgeText)}>
          {title}
        </h3>
        <span
          className={cn(
            'text-sm px-2 py-0.5 rounded-full border border-current font-medium',
            colorStyles.badgeBg,
            colorStyles.badgeText
          )}
        >
          {leads.length}
        </span>
      </div>

      {/* Zona de drop */}
      <div
        ref={setNodeRef}
        className={cn(
          'min-h-[500px] rounded-lg p-3 transition-all duration-200 flex-1 border-2',
          isOver
            ? cn('bg-background-elevated shadow-lg', colorStyles.borderColor, colorStyles.glow)
            : cn('bg-background-elevated/50 border-border-primary hover:border-opacity-100', `hover:${colorStyles.borderColor}`)
        )}
        style={{
          borderTopColor: !isOver ? 'var(--column-color)' : undefined,
        }}
      >
        <div
          className={cn('h-1 w-full rounded-full mb-3', colorStyles.badgeBg)}
        />

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

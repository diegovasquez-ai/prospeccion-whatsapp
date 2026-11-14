'use client'

import { useDraggable } from '@dnd-kit/core'
import { cn } from '@/shared/utils/cn'
import { LeadCard } from './LeadCard'
import type { Lead } from '../types'

interface SortableLeadCardProps {
  lead: Lead
  onClick?: () => void
}

/**
 * Tarjeta arrastrable entre columnas del Kanban. La tarjeta interna es el
 * único elemento enfocable; con teclado la etapa se cambia en la ficha.
 */
export function SortableLeadCard({ lead, onClick }: SortableLeadCardProps) {
  const { listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      data-lead-id={lead.id}
      className={cn('cursor-grab active:cursor-grabbing touch-none select-none', isDragging && 'opacity-30')}
    >
      <LeadCard lead={lead} onClick={onClick} />
    </div>
  )
}

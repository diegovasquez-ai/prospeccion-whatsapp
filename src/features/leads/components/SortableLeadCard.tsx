import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { LeadCard } from './LeadCard'
import type { Lead } from '../types'
import { cn } from '@/shared/utils/cn'

interface SortableLeadCardProps {
  lead: Lead
  onClick?: () => void
}

export function SortableLeadCard({ lead, onClick }: SortableLeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id! })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn("cursor-grab active:cursor-grabbing", isDragging && "opacity-50")}
    >
      <LeadCard lead={lead} onClick={onClick} />
    </div>
  )
}

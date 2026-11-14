import { cn } from '@/shared/utils/cn'
import { ETAPA_COLORS, ETAPA_LABELS, type EtapaLeadType } from '../types'

export function EtapaBadge({ etapa, className }: { etapa: EtapaLeadType; className?: string }) {
  const color = ETAPA_COLORS[etapa]
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap text-xs', color.text, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', color.bg)} />
      {ETAPA_LABELS[etapa]}
    </span>
  )
}

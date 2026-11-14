'use client'

import { CalendarClock, MapPin } from 'lucide-react'
import { WhatsAppButton } from '@/shared/components/ui/WhatsAppButton'
import { formatMoney, formatRelativeDay, timeAgo } from '@/shared/utils/dates'
import { cn } from '@/shared/utils/cn'
import type { Lead } from '../types'

const PRIORIDAD_DOT = { alta: 'bg-red-400', media: 'bg-vivid-yellow', baja: 'bg-text-tertiary' }

interface LeadCardProps {
  lead: Lead
  onClick?: () => void
  className?: string
}

export function LeadCard({ lead, onClick, className }: LeadCardProps) {
  const seguimiento = lead.proxima_fecha_seguimiento
  const vencido = seguimiento ? new Date(seguimiento) < new Date() : false

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={cn(
        'group rounded-lg border border-border-primary bg-background-card p-3 text-left',
        'hover:border-border-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-vivid-cyan',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', PRIORIDAD_DOT[lead.prioridad])} title={`Prioridad ${lead.prioridad}`} />
            <h3 className="truncate text-sm font-medium text-text-primary">{lead.nombre_negocio}</h3>
          </div>
          {lead.nombre_contacto && <p className="truncate text-xs text-text-secondary mt-0.5">{lead.nombre_contacto}</p>}
        </div>
        <WhatsAppButton leadId={lead.id} variant="icon" />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-tertiary">
        {lead.ciudad && (
          <span className="inline-flex items-center gap-1"><MapPin size={11} />{lead.ciudad}</span>
        )}
        {lead.valor_estimado != null && <span className="text-text-secondary">{formatMoney(lead.valor_estimado)}</span>}
        <span>Últ. contacto: {timeAgo(lead.fecha_ultimo_contacto)}</span>
      </div>

      {seguimiento && (
        <div className={cn('mt-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px]', vencido ? 'bg-red-500/10 text-red-400' : 'bg-vivid-cyan/10 text-vivid-cyan')}>
          <CalendarClock size={11} />
          {vencido ? 'Vencido · ' : ''}
          {formatRelativeDay(seguimiento)}
        </div>
      )}
    </div>
  )
}

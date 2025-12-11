'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Trash2 } from 'lucide-react'
import { WhatsAppButton } from '@/shared/components/ui/WhatsAppButton'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { useDeleteLead } from '../hooks/useLeads'
import { useActividadesByLead } from '@/features/actividades/hooks/useActividades'
import { TIPO_ACTIVIDAD_LABELS } from '@/features/actividades/types'
import type { Lead } from '../types'
import { cn } from '@/shared/utils/cn'

interface LeadCardProps {
  lead: Lead
  onClick?: () => void
  className?: string
}

export function LeadCard({ lead, onClick, className }: LeadCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const { mutate: deleteLead, isPending } = useDeleteLead()
  const { data: actividades = [] } = useActividadesByLead(lead.id!)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteLead(lead.id!, {
      onSuccess: () => setShowConfirm(false),
    })
  }

  const handleShowConfirm = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowConfirm(true)
  }

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowConfirm(false)
  }

  return (
    <div
      className={cn(
        'group bg-background-card rounded-lg border border-border-secondary p-4 hover:shadow-lg hover:shadow-vivid-cyan/10 hover:border-vivid-cyan/50 transition-all duration-200 cursor-pointer relative',
        className
      )}
      onClick={onClick}
    >
      {/* Botón eliminar */}
      {!showConfirm ? (
        <button
          onClick={handleShowConfirm}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 text-text-tertiary hover:text-vivid-magenta hover:bg-background-elevated rounded transition-all"
          title="Eliminar lead"
        >
          <Trash2 size={14} />
        </button>
      ) : (
        <div 
          className="absolute inset-0 bg-background-card/95 rounded-lg flex flex-col items-center justify-center gap-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm text-text-primary font-medium">¿Eliminar este lead?</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="px-3 py-1.5 text-sm bg-vivid-magenta text-white rounded-lg hover:bg-vivid-magenta/80 disabled:opacity-50 font-medium"
            >
              {isPending ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
            <button
              onClick={handleCancelDelete}
              className="px-3 py-1.5 text-sm bg-border-secondary text-text-primary rounded-lg hover:bg-border-primary font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Header con nombre y WhatsApp */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-medium text-text-primary flex-1 pr-8">{lead.nombre_negocio}</h3>
        <WhatsAppButton
          phoneNumber={lead.whatsapp}
          variant="icon"
          size="sm"
          className="flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Badges de estado */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {lead.es_calificado && (
          <StatusBadge label="Calificado" variant="success" />
        )}
        {lead.respondio && <StatusBadge label="Respondió" variant="info" />}
        {lead.loom_enviado && <StatusBadge label="Loom enviado" variant="warning" />}
        {lead.tuvo_reunion && <StatusBadge label="Reunión" variant="success" />}
      </div>

      {/* Actividades recientes */}
      {actividades.length > 0 ? (
        <div className="space-y-1.5 mt-1">
          {actividades.slice(0, 3).map((actividad) => (
            <div 
              key={actividad.id} 
              className="flex items-center gap-2 text-xs"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-vivid-cyan flex-shrink-0" />
              <span className="text-text-secondary truncate">
                {TIPO_ACTIVIDAD_LABELS[actividad.tipo]}
              </span>
              <span className="text-text-tertiary flex-shrink-0">
                {format(new Date(actividad.fecha_hora), 'dd MMM', { locale: es })}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-tertiary italic">Sin actividades</p>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { LeadCard } from './LeadCard'
import { KanbanColumn } from './KanbanColumn'
import { useLeads, useUpdateLead } from '../hooks/useLeads'
import { EtapaLead, ETAPA_LABELS, type EtapaLeadType, type Lead } from '../types'

interface KanbanBoardProps {
  onLeadClick?: (lead: Lead) => void
  searchQuery?: string
  esCalificadoFilter?: boolean | null
}

const COLUMNAS_PIPELINE: EtapaLeadType[] = [
  EtapaLead.NUEVO_LEAD,
  EtapaLead.PRIMER_MENSAJE_ENVIADO,
  EtapaLead.AUDIO_ENVIADO,
  EtapaLead.LOOM_ENVIADO,
  EtapaLead.RESPONDIO,
  EtapaLead.INTERESADO,
  EtapaLead.REUNION_AGENDADA,
  EtapaLead.CERRADO,
]

const STAGE_STYLES: Record<
  EtapaLeadType,
  { borderColor: string; badgeBg: string; badgeText: string; glow: string }
> = {
  [EtapaLead.NUEVO_LEAD]: {
    borderColor: 'border-text-tertiary',
    badgeBg: 'bg-text-tertiary/10',
    badgeText: 'text-text-tertiary',
    glow: 'shadow-text-tertiary/20',
  },
  [EtapaLead.PRIMER_MENSAJE_ENVIADO]: {
    borderColor: 'border-vivid-blue',
    badgeBg: 'bg-vivid-blue/10',
    badgeText: 'text-vivid-blue',
    glow: 'shadow-vivid-blue/20',
  },
  [EtapaLead.AUDIO_ENVIADO]: {
    borderColor: 'border-vivid-purple',
    badgeBg: 'bg-vivid-purple/10',
    badgeText: 'text-vivid-purple',
    glow: 'shadow-vivid-purple/20',
  },
  [EtapaLead.LOOM_ENVIADO]: {
    borderColor: 'border-vivid-magenta',
    badgeBg: 'bg-vivid-magenta/10',
    badgeText: 'text-vivid-magenta',
    glow: 'shadow-vivid-magenta/20',
  },
  [EtapaLead.RESPONDIO]: {
    borderColor: 'border-vivid-yellow',
    badgeBg: 'bg-vivid-yellow/10',
    badgeText: 'text-vivid-yellow',
    glow: 'shadow-vivid-yellow/20',
  },
  [EtapaLead.INTERESADO]: {
    borderColor: 'border-vivid-cyan',
    badgeBg: 'bg-vivid-cyan/10',
    badgeText: 'text-vivid-cyan',
    glow: 'shadow-vivid-cyan/20',
  },
  [EtapaLead.REUNION_AGENDADA]: {
    borderColor: 'border-vivid-green',
    badgeBg: 'bg-vivid-green/10',
    badgeText: 'text-vivid-green',
    glow: 'shadow-vivid-green/20',
  },
  [EtapaLead.CERRADO]: {
    borderColor: 'border-red-500',
    badgeBg: 'bg-red-500/10',
    badgeText: 'text-red-500',
    glow: 'shadow-red-500/20',
  },
}

export function KanbanBoard({
  onLeadClick,
  searchQuery,
  esCalificadoFilter,
}: KanbanBoardProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null)

  const { data: leads = [], isLoading } = useLeads({
    search: searchQuery,
    es_calificado: esCalificadoFilter ?? undefined,
  })

  const { mutate: updateLead } = useUpdateLead()

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // Menor distancia para iniciar drag con mouse (más responsivo)
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Pequeño delay para diferenciar scroll de drag
        tolerance: 5,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const lead = leads.find((l) => l.id === event.active.id)
    setActiveLead(lead || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      setActiveLead(null)
      return
    }

    const leadId = active.id as string
    let newEtapa = over.id as EtapaLeadType

    // Si el id sobre el que soltamos NO es una columna, asumimos que es un lead
    // y buscamos su etapa correspondiente
    if (!COLUMNAS_PIPELINE.includes(newEtapa)) {
      const overLead = leads.find((l) => l.id === over.id)
      if (overLead) {
        newEtapa = overLead.etapa
      } else {
        // Si no es columna ni lead conocido, cancelamos
        setActiveLead(null)
        return
      }
    }

    // Actualizar etapa del lead solo si cambió
    const activeLead = leads.find((l) => l.id === leadId)
    if (activeLead && activeLead.etapa !== newEtapa) {
      updateLead({
        id: leadId,
        input: { etapa: newEtapa },
      })
    }

    setActiveLead(null)
  }

  const handleDragCancel = () => {
    setActiveLead(null)
  }

  // Agrupar leads por etapa
  const leadsPorEtapa = COLUMNAS_PIPELINE.reduce(
    (acc, etapa) => {
      acc[etapa] = leads.filter((lead) => lead.etapa === etapa)
      return acc
    },
    {} as Record<EtapaLeadType, Lead[]>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary">Cargando leads...</p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 pb-4 min-h-full">
        {COLUMNAS_PIPELINE.map((etapa) => (
          <KanbanColumn
            key={etapa}
            etapa={etapa}
            title={ETAPA_LABELS[etapa]}
            leads={leadsPorEtapa[etapa]}
            onLeadClick={onLeadClick}
            colorStyles={STAGE_STYLES[etapa]}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead && <LeadCard lead={activeLead} className="rotate-3 shadow-lg" />}
      </DragOverlay>
    </DndContext>
  )
}

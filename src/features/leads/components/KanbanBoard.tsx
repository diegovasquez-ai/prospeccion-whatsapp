'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
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
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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
    const newEtapa = over.id as EtapaLeadType

    // Actualizar etapa del lead
    updateLead({
      id: leadId,
      input: { etapa: newEtapa },
    })

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
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNAS_PIPELINE.map((etapa) => (
          <KanbanColumn
            key={etapa}
            etapa={etapa}
            title={ETAPA_LABELS[etapa]}
            leads={leadsPorEtapa[etapa]}
            onLeadClick={onLeadClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead && <LeadCard lead={activeLead} className="rotate-3 shadow-lg" />}
      </DragOverlay>
    </DndContext>
  )
}

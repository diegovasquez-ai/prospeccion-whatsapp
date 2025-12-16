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
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead && <LeadCard lead={activeLead} className="rotate-3 shadow-lg" />}
      </DragOverlay>
    </DndContext>
  )
}

'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { LeadCard } from './LeadCard'
import { KanbanColumn } from './KanbanColumn'
import { useQueryClient } from '@tanstack/react-query'
import { LEADS_QUERY_KEY, useUpdateLead } from '../hooks/useLeads'
import { ETAPAS, ETAPA_LABELS, type EtapaLeadType, type Lead } from '../types'

interface KanbanBoardProps {
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
}

export function KanbanBoard({ leads, onLeadClick }: KanbanBoardProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null)
  const update = useUpdateLead()
  const queryClient = useQueryClient()

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  )

  const handleDragStart = (event: DragStartEvent) =>
    setActiveLead(leads.find((l) => l.id === event.active.id) ?? null)

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveLead(null)
    if (!over) return
    const etapa = over.id as EtapaLeadType
    const lead = leads.find((l) => l.id === active.id)
    if (!lead || !ETAPAS.includes(etapa) || lead.etapa === etapa) return
    const input: Partial<Lead> = { etapa }
    if (['respondio', 'interesado', 'reunion_agendada', 'cliente'].includes(etapa)) input.respondio = true
    // Actualización optimista: la tarjeta queda en su nueva columna al instante
    queryClient.setQueryData<Lead[]>(LEADS_QUERY_KEY, (old) =>
      old?.map((l) => (l.id === lead.id ? { ...l, ...input } : l))
    )
    update.mutate({ id: lead.id, input })
  }

  const porEtapa = (etapa: EtapaLeadType) => leads.filter((l) => l.etapa === etapa)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveLead(null)}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => `Moviendo ${leads.find((l) => l.id === active.id)?.nombre_negocio ?? ''}`,
          onDragOver: ({ over }) => (over ? `Sobre ${ETAPA_LABELS[over.id as EtapaLeadType] ?? ''}` : ''),
          onDragEnd: ({ over }) => (over ? `Movido a ${ETAPA_LABELS[over.id as EtapaLeadType] ?? ''}` : 'Cancelado'),
          onDragCancel: () => 'Movimiento cancelado',
        },
      }}
    >
      <div className="flex gap-3 pb-4 min-h-full">
        {ETAPAS.map((etapa) => (
          <KanbanColumn key={etapa} etapa={etapa} leads={porEtapa(etapa)} onLeadClick={onLeadClick} />
        ))}
      </div>
      <DragOverlay>
        {activeLead && <LeadCard lead={activeLead} className="rotate-2 shadow-2xl border-vivid-cyan/60" />}
      </DragOverlay>
    </DndContext>
  )
}

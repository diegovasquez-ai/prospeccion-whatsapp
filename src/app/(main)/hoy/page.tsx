'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Calendar,
  Clock,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
} from 'lucide-react'
import { useActividadesHoy } from '@/features/actividades/hooks/useActividades'
import { useDeleteActividad } from '@/features/actividades/hooks/useActividades'
import { TIPO_ACTIVIDAD_LABELS } from '@/features/actividades/types'
import { LeadDetailPanel } from '@/features/leads/components/LeadDetailPanel'
import { WhatsAppButton } from '@/shared/components/ui/WhatsAppButton'
import { useLead } from '@/features/leads/hooks/useLeads'
import type { Lead } from '@/features/leads/types'
import type { Actividad } from '@/features/actividades/types'

type ActividadConLead = Actividad & { lead: { id: string; nombre_negocio: string; whatsapp: string } }

export default function HoyPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const { data, isLoading } = useActividadesHoy()
  const { data: selectedLead } = useLead(selectedLeadId || '')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-text-secondary">Cargando actividades de hoy...</p>
      </div>
    )
  }

  const { hoy = [], pendientes = [], proximas = [] } = data || {}

  return (
    <div className="flex h-screen bg-background">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">HOY</h1>
            <p className="text-text-secondary">
              Tus actividades programadas para hoy y pendientes
            </p>
          </div>

          {/* Sección: Actividades pendientes (pasadas) */}
          {pendientes.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-vivid-magenta/20 border border-vivid-magenta/30 rounded-lg">
                  <AlertTriangle className="text-vivid-magenta" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">
                    Actividades atrasadas
                  </h2>
                  <p className="text-sm text-text-secondary">
                    {pendientes.length} actividades de días anteriores
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                {pendientes.map((actividad) => (
                  <ActividadCard
                    key={actividad.id}
                    actividad={actividad}
                    onSelectLead={() => setSelectedLeadId(actividad.lead.id)}
                    variant="atrasada"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Sección: Actividades de hoy */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-vivid-cyan/20 border border-vivid-cyan/30 rounded-lg">
                <Calendar className="text-vivid-cyan" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-text-primary">
                  Hoy - {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
                </h2>
                <p className="text-sm text-text-secondary">
                  {hoy.length} actividades programadas
                </p>
              </div>
            </div>

            {hoy.length === 0 ? (
              <div className="text-center py-8 border border-border-primary rounded-lg bg-background-card">
                <CheckCircle2 className="mx-auto text-vivid-green mb-2" size={32} />
                <p className="text-text-secondary">
                  No tienes actividades programadas para hoy
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {hoy.map((actividad) => (
                  <ActividadCard
                    key={actividad.id}
                    actividad={actividad}
                    onSelectLead={() => setSelectedLeadId(actividad.lead.id)}
                    variant="hoy"
                  />
                ))}
              </div>
            )}
          </section>

          {/* Sección: Próximas actividades */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-vivid-purple/20 border border-vivid-purple/30 rounded-lg">
                <CalendarDays className="text-vivid-purple" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-text-primary">
                  Próximos 7 días
                </h2>
                <p className="text-sm text-text-secondary">
                  {proximas.length} actividades programadas
                </p>
              </div>
            </div>

            {proximas.length === 0 ? (
              <p className="text-text-tertiary text-sm italic">
                No hay actividades programadas para los próximos días
              </p>
            ) : (
              <div className="grid gap-3">
                {proximas.map((actividad) => (
                  <ActividadCard
                    key={actividad.id}
                    actividad={actividad}
                    onSelectLead={() => setSelectedLeadId(actividad.lead.id)}
                    variant="proxima"
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Side panel de detalle */}
      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLeadId(null)}
        />
      )}
    </div>
  )
}

// Componente auxiliar para las tarjetas de actividades
function ActividadCard({
  actividad,
  onSelectLead,
  variant,
}: {
  actividad: ActividadConLead
  onSelectLead: () => void
  variant: 'atrasada' | 'hoy' | 'proxima'
}) {
  const { mutate: deleteActividad, isPending } = useDeleteActividad()
  const [showConfirm, setShowConfirm] = useState(false)

  const fecha = format(new Date(actividad.fecha_hora), "dd MMM yyyy", { locale: es })

  const variantStyles = {
    atrasada: 'border-vivid-magenta/30 hover:border-vivid-magenta/50',
    hoy: 'border-vivid-cyan/30 hover:border-vivid-cyan/50',
    proxima: 'border-border-secondary hover:border-vivid-purple/50',
  }

  const handleDelete = () => {
    deleteActividad(actividad.id!, {
      onSuccess: () => setShowConfirm(false),
    })
  }

  return (
    <div className={`relative bg-background-card border ${variantStyles[variant]} rounded-lg p-4 hover:shadow-lg transition-all group`}>
      {/* Confirmación de eliminar */}
      {showConfirm && (
        <div className="absolute inset-0 bg-background-card/95 rounded-lg flex items-center justify-center gap-3 z-10">
          <span className="text-sm text-text-primary">¿Eliminar?</span>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="px-3 py-1 text-sm bg-vivid-magenta text-white rounded hover:bg-vivid-magenta/80 disabled:opacity-50"
          >
            {isPending ? '...' : 'Sí'}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="px-3 py-1 text-sm bg-border-secondary text-text-primary rounded hover:bg-border-primary"
          >
            No
          </button>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        {/* Info de la actividad */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
              variant === 'atrasada' 
                ? 'bg-vivid-magenta/20 text-vivid-magenta' 
                : variant === 'hoy'
                ? 'bg-vivid-cyan/20 text-vivid-cyan'
                : 'bg-vivid-purple/20 text-vivid-purple'
            }`}>
              {TIPO_ACTIVIDAD_LABELS[actividad.tipo]}
            </span>
            <span className="flex items-center gap-1 text-xs text-text-tertiary">
              <Clock size={12} />
              {fecha}
            </span>
          </div>
          
          <button
            onClick={onSelectLead}
            className="font-medium text-text-primary hover:text-vivid-cyan text-left transition-colors"
          >
            {actividad.lead.nombre_negocio}
          </button>

          {actividad.nota && (
            <p className="text-sm text-text-secondary mt-1 line-clamp-1">
              {actividad.nota}
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <WhatsAppButton
            phoneNumber={actividad.lead.whatsapp}
            variant="icon"
            size="sm"
          />
          <button
            onClick={() => setShowConfirm(true)}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-text-tertiary hover:text-vivid-magenta rounded transition-all"
            title="Marcar como completada"
          >
            <CheckCircle2 size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

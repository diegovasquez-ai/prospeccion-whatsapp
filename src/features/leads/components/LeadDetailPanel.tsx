'use client'

import { useState } from 'react'
import { X, CheckCircle, Circle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { WhatsAppButton } from '@/shared/components/ui/WhatsAppButton'
import { ActivityItem } from '@/features/actividades/components/ActivityItem'
import { ActivityForm } from '@/features/actividades/components/ActivityForm'
import { useActividadesByLead } from '@/features/actividades/hooks/useActividades'
import { useUpdateLead } from '../hooks/useLeads'
import { ETAPA_LABELS, type Lead, type EtapaLeadType } from '../types'

interface LeadDetailPanelProps {
  lead: Lead
  onClose: () => void
}

export function LeadDetailPanel({ lead, onClose }: LeadDetailPanelProps) {
  const [formData, setFormData] = useState(lead)

  const { data: actividades = [], isLoading: actividadesLoading } =
    useActividadesByLead(lead.id!)

  const { mutate: updateLead } = useUpdateLead()

  const toggleFlag = (field: keyof Lead) => {
    const newValue = !formData[field]
    setFormData({ ...formData, [field]: newValue })
    updateLead({
      id: lead.id!,
      input: { [field]: newValue },
    })
  }

  return (
    <div className="w-[500px] border-l border-border-primary bg-background-elevated flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border-primary bg-background-card">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary flex-1 pr-4">
            {formData.nombre_negocio}
          </h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-vivid-cyan transition-colors flex-shrink-0"
          >
            <X size={24} />
          </button>
        </div>

        <WhatsAppButton phoneNumber={formData.whatsapp} size="md" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Sección: Info básica */}
        <div className="px-6 py-4 border-b border-border-primary">
          <h3 className="font-semibold text-text-primary mb-3">Información</h3>

          {/* Etapa */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Etapa
            </label>
            <select
              value={formData.etapa}
              onChange={(e) => {
                const newEtapa = e.target.value as EtapaLeadType
                setFormData({ ...formData, etapa: newEtapa })
                updateLead({
                  id: lead.id!,
                  input: { etapa: newEtapa },
                })
              }}
              className="w-full px-3 py-2 bg-background-card border border-border-secondary rounded-lg focus:ring-2 focus:ring-vivid-cyan focus:border-vivid-cyan text-text-primary"
            >
              {Object.entries(ETAPA_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Es calificado */}
          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              id="esCalificado"
              checked={formData.es_calificado}
              onChange={() => toggleFlag('es_calificado')}
              className="h-4 w-4 text-vivid-green focus:ring-vivid-green border-border-secondary rounded bg-background-card"
            />
            <label htmlFor="esCalificado" className="ml-2 text-sm text-text-primary">
              Es calificado
            </label>
          </div>

          {/* Fechas */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Creado:</span>
              <span className="font-medium text-text-primary">
                {format(new Date(formData.fecha_creacion!), 'dd MMM yyyy', {
                  locale: es,
                })}
              </span>
            </div>
            {formData.fecha_ultimo_contacto && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Último contacto:</span>
                <span className="font-medium text-text-primary">
                  {format(
                    new Date(formData.fecha_ultimo_contacto),
                    'dd MMM yyyy',
                    { locale: es }
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sección: Flags del proceso */}
        <div className="px-6 py-4 border-b border-border-primary">
          <h3 className="font-semibold text-text-primary mb-3">Estado del proceso</h3>

          <div className="space-y-2">
            {[
              { key: 'respondio', label: 'Respondió' },
              { key: 'acepto_loom', label: 'Aceptó Loom' },
              { key: 'loom_enviado', label: 'Loom enviado' },
              { key: 'pdf_armado', label: 'PDF armado' },
              { key: 'tuvo_reunion', label: 'Se tuvo reunión' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleFlag(key as keyof Lead)}
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg hover:bg-background-card border border-transparent hover:border-vivid-cyan/30 transition-all"
              >
                {formData[key as keyof Lead] ? (
                  <CheckCircle className="text-vivid-green drop-shadow-[0_0_8px_rgba(0,255,136,0.5)]" size={20} />
                ) : (
                  <Circle className="text-text-tertiary" size={20} />
                )}
                <span className="text-sm text-text-primary">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sección: Observaciones */}
        <div className="px-6 py-4 border-b border-border-primary">
          <h3 className="font-semibold text-text-primary mb-3">Observaciones</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                General
              </label>
              <textarea
                value={formData.observacion_general || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    observacion_general: e.target.value,
                  })
                }
                onBlur={() =>
                  updateLead({
                    id: lead.id!,
                    input: { observacion_general: formData.observacion_general },
                  })
                }
                rows={3}
                className="w-full px-3 py-2 bg-background-card border border-border-secondary rounded-lg focus:ring-2 focus:ring-vivid-cyan text-text-primary placeholder:text-text-tertiary"
                placeholder="Notas generales sobre el lead..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Post reunión
              </label>
              <textarea
                value={formData.observacion_post_reunion || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    observacion_post_reunion: e.target.value,
                  })
                }
                onBlur={() =>
                  updateLead({
                    id: lead.id!,
                    input: {
                      observacion_post_reunion: formData.observacion_post_reunion,
                    },
                  })
                }
                rows={3}
                className="w-full px-3 py-2 bg-background-card border border-border-secondary rounded-lg focus:ring-2 focus:ring-vivid-cyan text-text-primary placeholder:text-text-tertiary"
                placeholder="Notas sobre la reunión..."
              />
            </div>
          </div>
        </div>

        {/* Sección: Timeline de actividades */}
        <div className="px-6 py-4">
          <h3 className="font-semibold text-text-primary mb-3">Timeline</h3>

          {/* Form para nueva actividad */}
          <ActivityForm leadId={lead.id!} />

          {/* Lista de actividades */}
          <div className="mt-6">
            {actividadesLoading ? (
              <p className="text-sm text-text-secondary">Cargando actividades...</p>
            ) : actividades.length === 0 ? (
              <p className="text-sm text-text-tertiary text-center py-4">
                No hay actividades registradas
              </p>
            ) : (
              <div className="space-y-1">
                {actividades.map((actividad) => (
                  <ActivityItem key={actividad.id} activity={actividad} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

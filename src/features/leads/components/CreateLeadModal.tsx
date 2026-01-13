'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useCreateLead } from '../hooks/useLeads'
import { EtapaLead, ETAPA_LABELS, type EtapaLeadType } from '../types'

interface CreateLeadModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateLeadModal({ isOpen, onClose }: CreateLeadModalProps) {
  const [nombreNegocio, setNombreNegocio] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [etapa, setEtapa] = useState<EtapaLeadType>(EtapaLead.PRIMER_MENSAJE_ENVIADO)
  const [esCalificado, setEsCalificado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { mutate: createLead, isPending } = useCreateLead()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    createLead(
      {
        nombre_negocio: nombreNegocio,
        whatsapp,
        etapa,
        es_calificado: esCalificado,
        respondio: false,
        acepto_loom: false,
        loom_enviado: false,
        pdf_armado: false,
        tuvo_reunion: false,
      },
      {
        onSuccess: () => {
          // Reset form
          setNombreNegocio('')
          setWhatsapp('')
          setEtapa(EtapaLead.PRIMER_MENSAJE_ENVIADO)
          setEsCalificado(false)
          setError(null)
          onClose()
        },
        onError: (err) => {
          setError(err.message)
        },
      }
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-background-card rounded-lg border border-border-secondary shadow-2xl shadow-vivid-cyan/20 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary">
          <h2 className="text-xl font-semibold text-text-primary">Nuevo Lead</h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-vivid-cyan transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
          {/* Nombre del negocio */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Nombre del negocio *
            </label>
            <input
              type="text"
              value={nombreNegocio}
              onChange={(e) => {
                setNombreNegocio(e.target.value)
                setError(null)
              }}
              required
              className="w-full px-3 py-2 bg-background-elevated border border-border-secondary rounded-lg focus:ring-2 focus:ring-vivid-cyan focus:border-vivid-cyan text-text-primary placeholder:text-text-tertiary"
              placeholder="Ej: Inmobiliaria XYZ"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Número de WhatsApp *
            </label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => {
                setWhatsapp(e.target.value)
                setError(null)
              }}
              required
              className="w-full px-3 py-2 bg-background-elevated border border-border-secondary rounded-lg focus:ring-2 focus:ring-vivid-cyan focus:border-vivid-cyan text-text-primary placeholder:text-text-tertiary"
              placeholder="Ej: +56912345678"
            />
          </div>

          {/* Etapa */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Etapa inicial
            </label>
            <select
              value={etapa}
              onChange={(e) => setEtapa(e.target.value as EtapaLeadType)}
              className="w-full px-3 py-2 bg-background-elevated border border-border-secondary rounded-lg focus:ring-2 focus:ring-vivid-cyan focus:border-vivid-cyan text-text-primary"
            >
              {Object.entries(ETAPA_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Es calificado */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="esCalificado"
              checked={esCalificado}
              onChange={(e) => setEsCalificado(e.target.checked)}
              className="h-4 w-4 text-vivid-green focus:ring-vivid-green border-border-secondary rounded bg-background-elevated"
            />
            <label
              htmlFor="esCalificado"
              className="ml-2 block text-sm text-text-primary"
            >
              Marcar como calificado
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border-secondary text-text-primary rounded-lg hover:bg-background-elevated transition-all font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-gradient-vivid text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity font-medium shadow-lg shadow-vivid-cyan/20"
            >
              {isPending ? 'Creando...' : 'Crear Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

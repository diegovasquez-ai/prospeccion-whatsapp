'use client'

import { useState } from 'react'
import { useCreateActividad } from '../hooks/useActividades'
import {
  TipoActividad,
  TIPO_ACTIVIDAD_LABELS,
  RESULTADO_ACTIVIDAD_LABELS,
  type TipoActividadType,
  type ResultadoActividadType,
} from '../types'

interface ActivityFormProps {
  leadId: string
  onSuccess?: () => void
}

export function ActivityForm({ leadId, onSuccess }: ActivityFormProps) {
  const [tipo, setTipo] = useState<TipoActividadType>(TipoActividad.FOLLOW_UP)
  const [resultado, setResultado] = useState<ResultadoActividadType | ''>('')
  const [nota, setNota] = useState('')
  const [fecha, setFecha] = useState(
    new Date().toISOString().slice(0, 10)
  )

  const { mutate: createActividad, isPending } = useCreateActividad()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    createActividad(
      {
        lead_id: leadId,
        tipo,
        resultado: resultado || null,
        nota: nota || null,
        fecha_hora: new Date(fecha + 'T12:00:00').toISOString(),
      },
      {
        onSuccess: () => {
          // Reset form
          setTipo(TipoActividad.FOLLOW_UP)
          setResultado('')
          setNota('')
          setFecha(new Date().toISOString().slice(0, 10))
          onSuccess?.()
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-background-card border border-border-primary rounded-lg">
      <h4 className="font-medium text-sm text-text-primary">Nueva actividad</h4>

      {/* Tipo de actividad */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Tipo
        </label>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoActividadType)}
          className="w-full px-3 py-2 bg-background-elevated border border-border-secondary rounded-lg focus:ring-2 focus:ring-vivid-cyan focus:border-vivid-cyan text-text-primary"
        >
          {Object.entries(TIPO_ACTIVIDAD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Fecha */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Fecha
        </label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-full px-3 py-2 bg-background-elevated border border-border-secondary rounded-lg focus:ring-2 focus:ring-vivid-cyan focus:border-vivid-cyan text-text-primary [color-scheme:dark]"
        />
      </div>

      {/* Resultado */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Resultado (opcional)
        </label>
        <select
          value={resultado}
          onChange={(e) =>
            setResultado(e.target.value as ResultadoActividadType | '')
          }
          className="w-full px-3 py-2 bg-background-elevated border border-border-secondary rounded-lg focus:ring-2 focus:ring-vivid-cyan focus:border-vivid-cyan text-text-primary"
        >
          <option value="">-- Seleccionar --</option>
          {Object.entries(RESULTADO_ACTIVIDAD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Nota */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Nota (opcional)
        </label>
        <textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-background-elevated border border-border-secondary rounded-lg focus:ring-2 focus:ring-vivid-cyan focus:border-vivid-cyan text-text-primary placeholder:text-text-tertiary"
          placeholder="Agregar detalles sobre esta actividad..."
        />
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full px-4 py-2 bg-vivid-cyan text-background font-semibold rounded-lg hover:bg-vivid-cyan/90 hover:shadow-[0_0_20px_rgba(0,217,255,0.4)] disabled:bg-border-secondary disabled:text-text-tertiary disabled:cursor-not-allowed disabled:shadow-none transition-all"
      >
        {isPending ? 'Guardando...' : 'Agregar actividad'}
      </button>
    </form>
  )
}

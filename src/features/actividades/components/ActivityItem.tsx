'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Trash2 } from 'lucide-react'
import { useDeleteActividad } from '../hooks/useActividades'
import type { Actividad } from '../types'
import {
  TIPO_ACTIVIDAD_LABELS,
  RESULTADO_ACTIVIDAD_LABELS,
} from '../types'

interface ActivityItemProps {
  activity: Actividad
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const { mutate: deleteActividad, isPending } = useDeleteActividad()

  const fecha = format(new Date(activity.fecha_hora), "dd MMM yyyy", {
    locale: es,
  })

  const handleDelete = () => {
    deleteActividad(activity.id!, {
      onSuccess: () => setShowConfirm(false),
    })
  }

  return (
    <div className="group flex gap-3 py-3 border-b border-border-primary last:border-0">
      {/* Indicador visual */}
      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-vivid-cyan mt-2 shadow-[0_0_8px_rgba(0,217,255,0.5)]" />

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        {/* Tipo y fecha */}
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <h4 className="font-medium text-sm text-text-primary">
            {TIPO_ACTIVIDAD_LABELS[activity.tipo]}
          </h4>
          <div className="flex items-center gap-2 flex-shrink-0">
            <time className="text-xs text-text-tertiary">{fecha}</time>
            
            {/* Botón eliminar */}
            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="opacity-0 group-hover:opacity-100 p-1 text-text-tertiary hover:text-vivid-magenta transition-all"
                title="Eliminar actividad"
              >
                <Trash2 size={14} />
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="px-2 py-0.5 text-xs bg-vivid-magenta text-white rounded hover:bg-vivid-magenta/80 disabled:opacity-50"
                >
                  {isPending ? '...' : 'Sí'}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-2 py-0.5 text-xs bg-border-secondary text-text-primary rounded hover:bg-border-primary"
                >
                  No
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Resultado */}
        {activity.resultado && (
          <p className="text-sm text-text-secondary mb-1">
            <span className="font-medium text-text-primary">Resultado:</span>{' '}
            {RESULTADO_ACTIVIDAD_LABELS[activity.resultado]}
          </p>
        )}

        {/* Nota */}
        {activity.nota && (
          <p className="text-sm text-text-secondary bg-background-card border border-border-primary rounded px-2 py-1">
            {activity.nota}
          </p>
        )}
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarCheck,
  Mail,
  MessageSquare,
  Phone,
  StickyNote,
  Trash2,
  Video,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { formatDateTime } from '@/shared/utils/dates'
import {
  RESULTADO_ACTIVIDAD_LABELS,
  TIPO_ACTIVIDAD_LABELS,
  type Actividad,
  type TipoActividadType,
} from '../types'

const ICONOS: Partial<Record<TipoActividadType, React.ReactNode>> = {
  llamada: <Phone size={14} />,
  whatsapp_saliente: <ArrowUpRight size={14} />,
  whatsapp_entrante: <ArrowDownLeft size={14} />,
  loom_enviado: <Video size={14} />,
  reunion: <CalendarCheck size={14} />,
  email: <Mail size={14} />,
  nota_interna: <StickyNote size={14} />,
}

const COLOR: Partial<Record<TipoActividadType, string>> = {
  llamada: 'bg-vivid-purple/15 text-vivid-purple',
  whatsapp_entrante: 'bg-vivid-green/15 text-vivid-green',
  reunion: 'bg-vivid-yellow/15 text-vivid-yellow',
  nota_interna: 'bg-text-tertiary/15 text-text-secondary',
}

interface ActividadItemProps {
  actividad: Actividad
  /** Si se indica, muestra el nombre del contacto con enlace */
  lead?: { id: string; nombre_negocio: string }
  onDelete?: () => void
}

export function ActividadItem({ actividad, lead, onDelete }: ActividadItemProps) {
  const resultado = actividad.resultado
  return (
    <li className="group flex gap-3 py-3">
      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${COLOR[actividad.tipo] ?? 'bg-vivid-cyan/15 text-vivid-cyan'}`}>
        {ICONOS[actividad.tipo] ?? <MessageSquare size={14} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-medium text-text-primary">{TIPO_ACTIVIDAD_LABELS[actividad.tipo] ?? actividad.tipo}</span>
          {lead && (
            <Link href={`/contactos/${lead.id}`} className="text-sm text-vivid-cyan hover:underline">
              {lead.nombre_negocio}
            </Link>
          )}
          {resultado && (
            <StatusBadge
              label={RESULTADO_ACTIVIDAD_LABELS[resultado] ?? resultado}
              variant={['respondio', 'interesado', 'completado'].includes(resultado) ? 'success' : resultado === 'no_interesado' ? 'danger' : 'default'}
            />
          )}
          {actividad.duracion_minutos ? <span className="text-xs text-text-tertiary">{actividad.duracion_minutos} min</span> : null}
        </div>
        {actividad.nota && <p className="mt-1 whitespace-pre-line text-sm text-text-secondary">{actividad.nota}</p>}
        <p className="mt-1 text-xs text-text-tertiary">{formatDateTime(actividad.fecha_hora)}</p>
      </div>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          aria-label="Eliminar actividad"
          title="Eliminar actividad"
          className="h-8 w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 hover:text-red-400"
        >
          <Trash2 size={14} />
        </Button>
      )}
    </li>
  )
}

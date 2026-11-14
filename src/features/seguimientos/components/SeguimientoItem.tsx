'use client'

import Link from 'next/link'
import { Check, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { WhatsAppButton } from '@/shared/components/ui/WhatsAppButton'
import { useCrmUi } from '@/shared/stores/crm-ui-store'
import { formatRelativeDay } from '@/shared/utils/dates'
import { cn } from '@/shared/utils/cn'
import type { Lead } from '@/features/leads/types'
import {
  useCompleteSeguimiento,
  useDeleteSeguimiento,
  useReopenSeguimiento,
} from '../hooks/useSeguimientos'
import { TIPO_SEGUIMIENTO_LABELS, type Seguimiento } from '../types'
import { estadoSeguimiento } from '../utils/estado'

interface SeguimientoItemProps {
  seguimiento: Seguimiento
  lead?: Lead
}

const ESTADO_BADGE = {
  vencido: { label: 'Vencido', variant: 'danger' },
  hoy: { label: 'Hoy', variant: 'info' },
  proximo: { label: 'Próximo', variant: 'default' },
  completado: { label: 'Hecho', variant: 'success' },
} as const

export function SeguimientoItem({ seguimiento, lead }: SeguimientoItemProps) {
  const openSeguimientoForm = useCrmUi((s) => s.openSeguimientoForm)
  const completar = useCompleteSeguimiento()
  const reabrir = useReopenSeguimiento()
  const eliminar = useDeleteSeguimiento()
  const estado = estadoSeguimiento(seguimiento)
  const badge = ESTADO_BADGE[estado]

  return (
    <li
      className={cn(
        'flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border bg-background-card p-3',
        estado === 'vencido' ? 'border-red-500/30' : 'border-border-primary'
      )}
    >
      <Button
        variant={seguimiento.completado ? 'secondary' : 'ghost'}
        size="icon"
        onClick={() => (seguimiento.completado ? reabrir : completar).mutate(seguimiento)}
        aria-label={seguimiento.completado ? 'Marcar como pendiente' : 'Marcar como hecho'}
        title={seguimiento.completado ? 'Marcar como pendiente' : 'Marcar como hecho'}
        className={cn('hidden sm:inline-flex rounded-full border border-border-secondary', seguimiento.completado && 'text-vivid-green')}
      >
        {seguimiento.completado ? <RotateCcw size={15} /> : <Check size={16} />}
      </Button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={badge.label} variant={badge.variant} />
          <span className={cn('text-sm font-medium', seguimiento.completado ? 'text-text-tertiary line-through' : 'text-text-primary')}>
            {TIPO_SEGUIMIENTO_LABELS[seguimiento.tipo]}
          </span>
          {lead && (
            <Link href={`/contactos/${lead.id}`} className="text-sm text-vivid-cyan hover:underline truncate">
              {lead.nombre_negocio}
            </Link>
          )}
        </div>
        {seguimiento.nota && <p className="mt-1 text-sm text-text-secondary">{seguimiento.nota}</p>}
        <p className="mt-1 text-xs text-text-tertiary">{formatRelativeDay(seguimiento.fecha_programada)}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          className="sm:hidden"
          onClick={() => (seguimiento.completado ? reabrir : completar).mutate(seguimiento)}
        >
          {seguimiento.completado ? 'Reabrir' : 'Hecho'}
        </Button>
        {lead && !seguimiento.completado && <WhatsAppButton leadId={lead.id} variant="icon" />}
        <Button variant="ghost" size="icon" onClick={() => openSeguimientoForm(seguimiento.lead_id, seguimiento.id)} aria-label="Editar o reprogramar" title="Editar o reprogramar">
          <Pencil size={15} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => eliminar.mutate(seguimiento)} aria-label="Eliminar seguimiento" title="Eliminar" className="hover:text-red-400">
          <Trash2 size={15} />
        </Button>
      </div>
    </li>
  )
}

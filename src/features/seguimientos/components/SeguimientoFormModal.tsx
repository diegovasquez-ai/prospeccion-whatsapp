'use client'

import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Field, Input, Select, Textarea, toOptions } from '@/shared/components/ui/Form'
import { Modal } from '@/shared/components/ui/Modal'
import { useCrmUi } from '@/shared/stores/crm-ui-store'
import { toDateTimeLocal } from '@/shared/utils/dates'
import { LeadPicker } from '@/features/leads/components/LeadPicker'
import { useCreateSeguimiento, useSeguimientos } from '../hooks/useSeguimientos'
import { TIPO_SEGUIMIENTO_LABELS, type Seguimiento, type TipoSeguimiento } from '../types'
import { seguimientosService } from '../services/seguimientosService'
import { useCrmMutation } from '@/shared/hooks/use-crm-mutation'

const ATAJOS = [
  { label: 'Mañana', dias: 1 },
  { label: 'En 3 días', dias: 3 },
  { label: 'En 1 semana', dias: 7 },
]

function enDias(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  d.setHours(9, 0, 0, 0)
  return toDateTimeLocal(d)
}

/** Diálogo global: programar o editar un seguimiento */
export function SeguimientoFormModal() {
  const { seguimientoForm, closeAll } = useCrmUi()
  const { data: seguimientos = [] } = useSeguimientos()
  if (!seguimientoForm) return null
  const existente = seguimientos.find((s) => s.id === seguimientoForm.seguimientoId) ?? null
  if (seguimientoForm.seguimientoId && !existente) return null
  return (
    <SeguimientoForm
      key={seguimientoForm.seguimientoId ?? 'nuevo'}
      leadId={seguimientoForm.leadId ?? existente?.lead_id ?? null}
      existente={existente}
      onClose={closeAll}
    />
  )
}

function SeguimientoForm({
  leadId: initialLead,
  existente,
  onClose,
}: {
  leadId: string | null
  existente: Seguimiento | null
  onClose: () => void
}) {
  const [leadId, setLeadId] = useState(initialLead ?? '')
  const [tipo, setTipo] = useState<TipoSeguimiento>(existente?.tipo ?? 'whatsapp')
  const [fecha, setFecha] = useState(
    existente ? toDateTimeLocal(new Date(existente.fecha_programada)) : enDias(1)
  )
  const [nota, setNota] = useState(existente?.nota ?? '')
  const [error, setError] = useState<string | null>(null)
  const crear = useCreateSeguimiento()
  const editar = useCrmMutation(
    (patch: Partial<Seguimiento>) => seguimientosService.update(existente!.id, patch),
    { successMessage: 'Seguimiento actualizado' }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadId) return setError('Selecciona un contacto')
    if (!fecha) return setError('Indica la fecha')
    const datos = { tipo, fecha_programada: new Date(fecha).toISOString(), nota: nota.trim() || null }
    if (existente) editar.mutate(datos, { onSuccess: onClose })
    else crear.mutate({ ...datos, lead_id: leadId, completado: false, completado_at: null }, { onSuccess: onClose })
  }

  return (
    <Modal
      open
      title={existente ? 'Editar seguimiento' : 'Programar seguimiento'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="seguimiento-form" loading={crear.isPending || editar.isPending}>Guardar</Button>
        </>
      }
    >
      <form id="seguimiento-form" onSubmit={handleSubmit} className="space-y-4">
        {!initialLead && (
          <Field label="Contacto *" htmlFor="seg-lead">
            <LeadPicker id="seg-lead" value={leadId} onChange={setLeadId} />
          </Field>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Acción" htmlFor="seg-tipo">
            <Select id="seg-tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoSeguimiento)} options={toOptions(TIPO_SEGUIMIENTO_LABELS)} />
          </Field>
          <Field label="Fecha y hora" htmlFor="seg-fecha">
            <Input id="seg-fecha" type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          {ATAJOS.map((a) => (
            <Button key={a.dias} size="sm" variant="secondary" onClick={() => setFecha(enDias(a.dias))}>
              {a.label}
            </Button>
          ))}
        </div>
        <Field label="Nota" htmlFor="seg-nota">
          <Textarea id="seg-nota" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="¿Qué hay que hacer?" />
        </Field>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>
    </Modal>
  )
}

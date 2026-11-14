'use client'

import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Field, Input, Select, Textarea, toOptions } from '@/shared/components/ui/Form'
import { Modal } from '@/shared/components/ui/Modal'
import { useCrmUi } from '@/shared/stores/crm-ui-store'
import { toDateTimeLocal } from '@/shared/utils/dates'
import { LeadPicker } from '@/features/leads/components/LeadPicker'
import { useCreateActividad } from '../hooks/useActividades'
import {
  RESULTADO_ACTIVIDAD_LABELS,
  TIPO_ACTIVIDAD_LABELS,
  TIPOS_ACTIVIDAD,
  type ResultadoActividadType,
  type TipoActividadType,
} from '../types'

/** Diálogo global: registrar llamada, conversación o nota */
export function ActividadFormModal() {
  const { actividadForm, closeAll } = useCrmUi()
  if (!actividadForm) return null
  const tipo = TIPOS_ACTIVIDAD.includes(actividadForm.tipo as TipoActividadType)
    ? (actividadForm.tipo as TipoActividadType)
    : 'llamada'
  return <ActividadForm leadId={actividadForm.leadId} tipoInicial={tipo} onClose={closeAll} />
}

function ActividadForm({
  leadId: initialLead,
  tipoInicial,
  onClose,
}: {
  leadId: string | null
  tipoInicial: TipoActividadType
  onClose: () => void
}) {
  const [leadId, setLeadId] = useState(initialLead ?? '')
  const [tipo, setTipo] = useState<TipoActividadType>(tipoInicial)
  const [fecha, setFecha] = useState(toDateTimeLocal(new Date()))
  const [resultado, setResultado] = useState<ResultadoActividadType | ''>('')
  const [duracion, setDuracion] = useState('')
  const [nota, setNota] = useState('')
  const [error, setError] = useState<string | null>(null)
  const crear = useCreateActividad()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadId) return setError('Selecciona un contacto')
    if (!fecha) return setError('Indica la fecha y hora')
    crear.mutate(
      {
        lead_id: leadId,
        tipo,
        fecha_hora: new Date(fecha).toISOString(),
        resultado: resultado || null,
        duracion_minutos: tipo === 'llamada' && duracion ? Number(duracion) : null,
        nota: nota.trim() || null,
      },
      { onSuccess: onClose }
    )
  }

  return (
    <Modal
      open
      title="Registrar actividad"
      description="Llamadas, conversaciones de WhatsApp, reuniones o notas"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="actividad-form" loading={crear.isPending}>Guardar</Button>
        </>
      }
    >
      <form id="actividad-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {!initialLead && (
          <Field label="Contacto *" htmlFor="act-lead" className="sm:col-span-2">
            <LeadPicker id="act-lead" value={leadId} onChange={setLeadId} />
          </Field>
        )}
        <Field label="Tipo" htmlFor="act-tipo">
          <Select id="act-tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoActividadType)} options={toOptions(TIPO_ACTIVIDAD_LABELS)} />
        </Field>
        <Field label="Fecha y hora" htmlFor="act-fecha">
          <Input id="act-fecha" type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Field>
        <Field label="Resultado" htmlFor="act-resultado">
          <Select id="act-resultado" value={resultado} onChange={(e) => setResultado(e.target.value as ResultadoActividadType | '')} placeholder="Sin resultado" options={toOptions(RESULTADO_ACTIVIDAD_LABELS)} />
        </Field>
        {tipo === 'llamada' && (
          <Field label="Duración (minutos)" htmlFor="act-duracion">
            <Input id="act-duracion" type="number" min={0} value={duracion} onChange={(e) => setDuracion(e.target.value)} />
          </Field>
        )}
        <Field label="Resumen de la conversación" htmlFor="act-nota" className="sm:col-span-2">
          <Textarea id="act-nota" rows={4} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="¿Qué se habló? ¿Próximos pasos?" />
        </Field>
        {error && <p className="sm:col-span-2 text-sm text-red-400">{error}</p>}
      </form>
    </Modal>
  )
}

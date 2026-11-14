'use client'

import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Field, Input, Select, Textarea, toOptions } from '@/shared/components/ui/Form'
import { Modal } from '@/shared/components/ui/Modal'
import { useCrmUi } from '@/shared/stores/crm-ui-store'
import { useCreateLead, useLead, useUpdateLead } from '../hooks/useLeads'
import {
  emptyLead,
  ETAPA_LABELS,
  leadFormSchema,
  PRIORIDAD_LABELS,
  type EtapaLeadType,
  type Lead,
  type Prioridad,
} from '../types'

type FormState = {
  nombre_negocio: string
  nombre_contacto: string
  whatsapp: string
  email: string
  ciudad: string
  sector: string
  fuente: string
  etapa: EtapaLeadType
  prioridad: Prioridad
  valor_estimado: string
  etiquetas: string
  es_calificado: boolean
  observacion_general: string
}

function toFormState(lead: Partial<Lead>): FormState {
  return {
    nombre_negocio: lead.nombre_negocio ?? '',
    nombre_contacto: lead.nombre_contacto ?? '',
    whatsapp: lead.whatsapp ?? '',
    email: lead.email ?? '',
    ciudad: lead.ciudad ?? '',
    sector: lead.sector ?? '',
    fuente: lead.fuente ?? '',
    etapa: lead.etapa ?? 'primer_mensaje_enviado',
    prioridad: lead.prioridad ?? 'media',
    valor_estimado: lead.valor_estimado != null ? String(lead.valor_estimado) : '',
    etiquetas: (lead.etiquetas ?? []).join(', '),
    es_calificado: lead.es_calificado ?? false,
    observacion_general: lead.observacion_general ?? '',
  }
}

const FUENTES = ['Instagram', 'Facebook', 'Google Maps', 'LinkedIn', 'Referido', 'Base de datos', 'Sitio web', 'Evento']

/** Diálogo global de crear / editar contacto */
export function LeadFormModal() {
  const { leadForm, closeAll } = useCrmUi()
  const { data: lead } = useLead(leadForm !== 'new' ? leadForm : null)
  if (!leadForm || (leadForm !== 'new' && !lead)) return null
  return <LeadForm key={leadForm} lead={leadForm === 'new' ? null : lead} onClose={closeAll} />
}

function LeadForm({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  const [form, setForm] = useState<FormState>(() => toFormState(lead ?? emptyLead()))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const create = useCreateLead()
  const update = useUpdateLead('Contacto actualizado')
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const valor = form.valor_estimado.replace(/[^\d.]/g, '')
    const parsed = leadFormSchema.safeParse({
      ...form,
      valor_estimado: valor ? Number(valor) : null,
      etiquetas: form.etiquetas.split(',').map((t) => t.trim()).filter(Boolean),
    })
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])))
      return
    }
    setErrors({})
    const values = { ...parsed.data, nombre_contacto: parsed.data.nombre_contacto ?? null, email: parsed.data.email ?? null, ciudad: parsed.data.ciudad ?? null, sector: parsed.data.sector ?? null, fuente: parsed.data.fuente ?? null, observacion_general: parsed.data.observacion_general ?? null }
    if (lead) update.mutate({ id: lead.id, input: values }, { onSuccess: onClose })
    else create.mutate({ ...emptyLead(), ...values }, { onSuccess: onClose })
  }

  const pending = create.isPending || update.isPending

  return (
    <Modal
      open
      size="lg"
      title={lead ? 'Editar contacto' : 'Nuevo contacto'}
      description={lead ? lead.nombre_negocio : 'Registra un nuevo prospecto en el pipeline'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="lead-form" loading={pending}>
            {lead ? 'Guardar cambios' : 'Crear contacto'}
          </Button>
        </>
      }
    >
      <form id="lead-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4" noValidate>
        <Field label="Nombre del negocio *" htmlFor="nombre_negocio" error={errors.nombre_negocio}>
          <Input id="nombre_negocio" autoFocus value={form.nombre_negocio} onChange={(e) => set('nombre_negocio', e.target.value)} placeholder="Ej: Panadería La Espiga" />
        </Field>
        <Field label="Persona de contacto" htmlFor="nombre_contacto">
          <Input id="nombre_contacto" value={form.nombre_contacto} onChange={(e) => set('nombre_contacto', e.target.value)} placeholder="Ej: Laura Gómez" />
        </Field>
        <Field label="WhatsApp *" htmlFor="whatsapp" error={errors.whatsapp} hint="Con indicativo (+57…). Si escribes 10 dígitos se añade +57.">
          <Input id="whatsapp" type="tel" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="+57 300 123 4567" />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input id="email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="correo@negocio.com" />
        </Field>
        <Field label="Ciudad" htmlFor="ciudad">
          <Input id="ciudad" value={form.ciudad} onChange={(e) => set('ciudad', e.target.value)} />
        </Field>
        <Field label="Sector / rubro" htmlFor="sector">
          <Input id="sector" value={form.sector} onChange={(e) => set('sector', e.target.value)} placeholder="Ej: Restaurantes" />
        </Field>
        <Field label="Fuente" htmlFor="fuente">
          <Input id="fuente" list="fuentes" value={form.fuente} onChange={(e) => set('fuente', e.target.value)} placeholder="¿De dónde salió?" />
          <datalist id="fuentes">{FUENTES.map((f) => <option key={f} value={f} />)}</datalist>
        </Field>
        <Field label="Valor estimado" htmlFor="valor" error={errors.valor_estimado}>
          <Input id="valor" inputMode="numeric" value={form.valor_estimado} onChange={(e) => set('valor_estimado', e.target.value)} placeholder="Ej: 1500000" />
        </Field>
        <Field label="Etapa" htmlFor="etapa">
          <Select id="etapa" value={form.etapa} onChange={(e) => set('etapa', e.target.value as EtapaLeadType)} options={toOptions(ETAPA_LABELS)} />
        </Field>
        <Field label="Prioridad" htmlFor="prioridad">
          <Select id="prioridad" value={form.prioridad} onChange={(e) => set('prioridad', e.target.value as Prioridad)} options={toOptions(PRIORIDAD_LABELS)} />
        </Field>
        <Field label="Etiquetas" htmlFor="etiquetas" hint="Separadas por comas" className="sm:col-span-2">
          <Input id="etiquetas" value={form.etiquetas} onChange={(e) => set('etiquetas', e.target.value)} placeholder="local, premium, 2 sedes" />
        </Field>
        <Field label="Observaciones" htmlFor="obs" className="sm:col-span-2">
          <Textarea id="obs" value={form.observacion_general} onChange={(e) => set('observacion_general', e.target.value)} />
        </Field>
        <label className="sm:col-span-2 flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <input type="checkbox" checked={form.es_calificado} onChange={(e) => set('es_calificado', e.target.checked)} className="h-4 w-4 accent-vivid-cyan" />
          Prospecto calificado (cumple el perfil de cliente ideal)
        </label>
      </form>
    </Modal>
  )
}

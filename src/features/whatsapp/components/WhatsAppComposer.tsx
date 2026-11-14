'use client'

import { useState } from 'react'
import { MessageCircle, Phone } from 'lucide-react'
import { Button, buttonClasses } from '@/shared/components/ui/Button'
import { Field, Select, Textarea } from '@/shared/components/ui/Form'
import { Modal } from '@/shared/components/ui/Modal'
import { useCrmUi } from '@/shared/stores/crm-ui-store'
import { telUrl, whatsappUrl } from '@/shared/utils/phone'
import { renderTemplate } from '@/shared/utils/template'
import { useLead, useUpdateLead } from '@/features/leads/hooks/useLeads'
import type { Lead } from '@/features/leads/types'
import { usePlantillas } from '@/features/plantillas/hooks/usePlantillas'
import { CATEGORIA_PLANTILLA_LABELS } from '@/features/plantillas/types'
import { useCreateActividad } from '@/features/actividades/hooks/useActividades'

/** Diálogo global: elegir plantilla, editar el mensaje y abrir WhatsApp */
export function WhatsAppComposer() {
  const { whatsappLeadId, closeAll } = useCrmUi()
  const { data: lead } = useLead(whatsappLeadId)
  if (!whatsappLeadId || !lead) return null
  return <Composer key={lead.id} lead={lead} onClose={closeAll} />
}

function Composer({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { data: plantillas = [] } = usePlantillas()
  const [plantillaId, setPlantillaId] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [registrar, setRegistrar] = useState(true)
  const crearActividad = useCreateActividad('Mensaje registrado en el historial')
  const updateLead = useUpdateLead()

  const elegirPlantilla = (id: string) => {
    setPlantillaId(id)
    const plantilla = plantillas.find((p) => p.id === id)
    if (plantilla) setMensaje(renderTemplate(plantilla.contenido, lead))
  }

  const enviar = () => {
    window.open(whatsappUrl(lead.whatsapp, mensaje), '_blank', 'noopener,noreferrer')
    if (registrar) {
      const esPrimero = lead.etapa === 'nuevo_lead' && !lead.fecha_ultimo_contacto
      crearActividad.mutate({
        lead_id: lead.id,
        tipo: esPrimero ? 'primer_mensaje' : 'whatsapp_saliente',
        fecha_hora: new Date().toISOString(),
        nota: mensaje.trim() || 'Chat abierto desde el CRM',
        resultado: null,
        duracion_minutos: null,
      })
      if (esPrimero) updateLead.mutate({ id: lead.id, input: { etapa: 'primer_mensaje_enviado' } })
    }
    onClose()
  }

  return (
    <Modal
      open
      title={`WhatsApp a ${lead.nombre_contacto || lead.nombre_negocio}`}
      description={lead.whatsapp}
      onClose={onClose}
      footer={
        <>
          <a href={telUrl(lead.whatsapp)} className={buttonClasses('secondary')}>
            <Phone size={16} /> Llamar
          </a>
          <Button variant="whatsapp" onClick={enviar}>
            <MessageCircle size={16} /> Abrir WhatsApp
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Plantilla" htmlFor="plantilla" hint={plantillas.length === 0 ? 'Aún no tienes plantillas. Créalas en la sección Plantillas.' : undefined}>
          <Select
            id="plantilla"
            value={plantillaId}
            onChange={(e) => elegirPlantilla(e.target.value)}
            placeholder="Mensaje libre (sin plantilla)"
            options={plantillas.map((p) => ({
              value: p.id,
              label: `${p.nombre} · ${CATEGORIA_PLANTILLA_LABELS[p.categoria]}`,
            }))}
          />
        </Field>
        <Field label="Mensaje" htmlFor="mensaje" hint="Puedes editarlo antes de abrir WhatsApp.">
          <Textarea id="mensaje" rows={6} value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Escribe tu mensaje…" />
        </Field>
        <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <input type="checkbox" checked={registrar} onChange={(e) => setRegistrar(e.target.checked)} className="h-4 w-4 accent-vivid-green" />
          Registrar este mensaje en el historial del contacto
        </label>
      </div>
    </Modal>
  )
}

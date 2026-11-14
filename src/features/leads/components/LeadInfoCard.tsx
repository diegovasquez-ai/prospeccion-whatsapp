'use client'

import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Textarea } from '@/shared/components/ui/Form'
import { Card } from '@/shared/components/ui/Layout'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { formatDate, formatMoney, timeAgo } from '@/shared/utils/dates'
import { useUpdateLead } from '../hooks/useLeads'
import { PRIORIDAD_LABELS, type Lead } from '../types'

const CHECKLIST: { key: keyof Pick<Lead, 'es_calificado' | 'respondio' | 'acepto_loom' | 'loom_enviado' | 'pdf_armado' | 'tuvo_reunion'>; label: string }[] = [
  { key: 'es_calificado', label: 'Calificado' },
  { key: 'respondio', label: 'Respondió' },
  { key: 'acepto_loom', label: 'Aceptó Loom' },
  { key: 'loom_enviado', label: 'Loom enviado' },
  { key: 'pdf_armado', label: 'PDF / propuesta armada' },
  { key: 'tuvo_reunion', label: 'Tuvo reunión' },
]

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-text-tertiary">{label}</dt>
      <dd className="text-sm text-text-primary break-words">{children || '—'}</dd>
    </div>
  )
}

export function LeadInfoCard({ lead }: { lead: Lead }) {
  const update = useUpdateLead()
  const [notaReunion, setNotaReunion] = useState(lead.observacion_post_reunion ?? '')
  const notaCambiada = notaReunion !== (lead.observacion_post_reunion ?? '')

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold text-text-primary">Datos del contacto</h2>
        <dl className="grid grid-cols-2 gap-3">
          <Dato label="Contacto">{lead.nombre_contacto}</Dato>
          <Dato label="WhatsApp">{lead.whatsapp}</Dato>
          <Dato label="Email">{lead.email && <a href={`mailto:${lead.email}`} className="text-vivid-cyan hover:underline">{lead.email}</a>}</Dato>
          <Dato label="Ciudad">{lead.ciudad}</Dato>
          <Dato label="Sector">{lead.sector}</Dato>
          <Dato label="Fuente">{lead.fuente}</Dato>
          <Dato label="Prioridad">{PRIORIDAD_LABELS[lead.prioridad]}</Dato>
          <Dato label="Valor estimado">{lead.valor_estimado != null && formatMoney(lead.valor_estimado)}</Dato>
          <Dato label="Creado">{formatDate(lead.created_at ?? lead.fecha_creacion)}</Dato>
          <Dato label="Último contacto">{timeAgo(lead.fecha_ultimo_contacto)}</Dato>
        </dl>
        {lead.etiquetas.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {lead.etiquetas.map((t) => <StatusBadge key={t} label={t} variant="info" />)}
          </div>
        )}
        {lead.observacion_general && (
          <p className="mt-3 whitespace-pre-line rounded-lg bg-background-elevated p-3 text-sm text-text-secondary">{lead.observacion_general}</p>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold text-text-primary">Checklist de prospección</h2>
        <div className="grid grid-cols-2 gap-2">
          {CHECKLIST.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={lead[key]}
                onChange={(e) => update.mutate({ id: lead.id, input: { [key]: e.target.checked } })}
                className="h-4 w-4 accent-vivid-cyan"
              />
              {label}
            </label>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-2 text-sm font-semibold text-text-primary">Notas post-reunión</h2>
        <Textarea aria-label="Notas post-reunión" rows={3} value={notaReunion} onChange={(e) => setNotaReunion(e.target.value)} placeholder="Acuerdos, objeciones, próximos pasos…" />
        {notaCambiada && (
          <div className="mt-2 flex justify-end">
            <Button size="sm" loading={update.isPending} onClick={() => update.mutate({ id: lead.id, input: { observacion_post_reunion: notaReunion.trim() || null } })}>
              Guardar nota
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

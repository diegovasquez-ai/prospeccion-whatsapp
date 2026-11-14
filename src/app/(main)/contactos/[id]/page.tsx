'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CalendarPlus, History, NotebookPen, Pencil, Phone, Trash2 } from 'lucide-react'
import { Button, buttonClasses } from '@/shared/components/ui/Button'
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog'
import { Select, toOptions } from '@/shared/components/ui/Form'
import { Card, EmptyState, ErrorState, LoadingState, Page } from '@/shared/components/ui/Layout'
import { WhatsAppButton } from '@/shared/components/ui/WhatsAppButton'
import { useCrmUi } from '@/shared/stores/crm-ui-store'
import { telUrl } from '@/shared/utils/phone'
import { LeadInfoCard } from '@/features/leads/components/LeadInfoCard'
import { useDeleteLead, useLead, useUpdateLead } from '@/features/leads/hooks/useLeads'
import { ETAPA_LABELS, type EtapaLeadType } from '@/features/leads/types'
import { ActividadItem } from '@/features/actividades/components/ActividadItem'
import { useActividadesByLead, useDeleteActividad } from '@/features/actividades/hooks/useActividades'
import { SeguimientoItem } from '@/features/seguimientos/components/SeguimientoItem'
import { useSeguimientos } from '@/features/seguimientos/hooks/useSeguimientos'

export default function ContactoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: lead, isLoading, error } = useLead(id)
  const { data: actividades } = useActividadesByLead(id)
  const { data: seguimientos = [] } = useSeguimientos()
  const { openLeadForm, openActividadForm, openSeguimientoForm } = useCrmUi()
  const update = useUpdateLead('Etapa actualizada')
  const eliminarLead = useDeleteLead()
  const eliminarActividad = useDeleteActividad()
  const [confirmar, setConfirmar] = useState(false)
  const [verCompletados, setVerCompletados] = useState(false)

  if (isLoading) return <LoadingState />
  if (error) return <Page><ErrorState error={error} /></Page>
  if (!lead) {
    return (
      <Page>
        <EmptyState title="Contacto no encontrado" description="Puede que haya sido eliminado." action={<Link href="/contactos" className={buttonClasses('secondary')}>Volver a contactos</Link>} />
      </Page>
    )
  }

  const propios = seguimientos.filter((s) => s.lead_id === lead.id)
  const pendientes = propios.filter((s) => !s.completado)
  const completados = propios.filter((s) => s.completado)

  return (
    <Page>
      <Link href="/contactos" className="mb-4 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary">
        <ArrowLeft size={16} /> Contactos
      </Link>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{lead.nombre_negocio}</h1>
          <p className="text-sm text-text-secondary">{[lead.nombre_contacto, lead.whatsapp].filter(Boolean).join(' · ')}</p>
          <div className="mt-3 w-64">
            <Select
              aria-label="Etapa del pipeline"
              value={lead.etapa}
              onChange={(e) => update.mutate({ id: lead.id, input: { etapa: e.target.value as EtapaLeadType } })}
              options={toOptions(ETAPA_LABELS)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <WhatsAppButton leadId={lead.id} />
          <a href={telUrl(lead.whatsapp)} className={buttonClasses('secondary')}><Phone size={16} /> Llamar</a>
          <Button variant="secondary" onClick={() => openActividadForm(lead.id, 'llamada')}><NotebookPen size={16} /> Registrar actividad</Button>
          <Button variant="secondary" onClick={() => openLeadForm(lead.id)}><Pencil size={16} /> Editar</Button>
          <Button variant="danger" size="icon" onClick={() => setConfirmar(true)} aria-label="Eliminar contacto" title="Eliminar contacto"><Trash2 size={16} /></Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        <LeadInfoCard key={lead.id} lead={lead} />

        <div className="space-y-6 min-w-0">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">Seguimientos pendientes ({pendientes.length})</h2>
              <Button size="sm" variant="secondary" onClick={() => openSeguimientoForm(lead.id)}><CalendarPlus size={14} /> Programar</Button>
            </div>
            {pendientes.length === 0 ? (
              <p className="text-sm text-text-tertiary">Sin seguimientos pendientes. Programa el próximo paso para no perder este prospecto.</p>
            ) : (
              <ul className="space-y-2">{pendientes.map((s) => <SeguimientoItem key={s.id} seguimiento={s} />)}</ul>
            )}
            {completados.length > 0 && (
              <div className="mt-3">
                <button onClick={() => setVerCompletados((v) => !v)} className="text-xs text-text-secondary hover:text-text-primary">
                  {verCompletados ? 'Ocultar' : 'Ver'} completados ({completados.length})
                </button>
                {verCompletados && <ul className="mt-2 space-y-2">{completados.map((s) => <SeguimientoItem key={s.id} seguimiento={s} />)}</ul>}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">Historial de llamadas y conversaciones</h2>
              <Button size="sm" variant="secondary" onClick={() => openActividadForm(lead.id, 'whatsapp_entrante')}><History size={14} /> Añadir</Button>
            </div>
            {actividades.length === 0 ? (
              <p className="py-4 text-sm text-text-tertiary">Todavía no hay actividad registrada con este contacto.</p>
            ) : (
              <ul className="divide-y divide-border-primary">
                {actividades.map((a) => (
                  <ActividadItem key={a.id} actividad={a} onDelete={() => eliminarActividad.mutate(a.id)} />
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmar}
        title="Eliminar contacto"
        message={`Se eliminará "${lead.nombre_negocio}" con todo su historial y seguimientos. Esta acción no se puede deshacer.`}
        loading={eliminarLead.isPending}
        onCancel={() => setConfirmar(false)}
        onConfirm={() => eliminarLead.mutate(lead.id, { onSuccess: () => router.push('/contactos') })}
      />
    </Page>
  )
}

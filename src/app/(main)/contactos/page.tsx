'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Download, Pencil, Plus, Search, Trash2, Upload, Users } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog'
import { Input, Select, toOptions } from '@/shared/components/ui/Form'
import { Card, EmptyState, ErrorState, LoadingState, Page, PageHeader } from '@/shared/components/ui/Layout'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { WhatsAppButton } from '@/shared/components/ui/WhatsAppButton'
import { useCrmUi } from '@/shared/stores/crm-ui-store'
import { downloadCsv } from '@/shared/utils/csv'
import { formatMoney, timeAgo } from '@/shared/utils/dates'
import { CsvImportModal } from '@/features/leads/components/CsvImportModal'
import { EtapaBadge } from '@/features/leads/components/EtapaBadge'
import { useDeleteLead, useLeads } from '@/features/leads/hooks/useLeads'
import { leadsToCsv } from '@/features/leads/utils/lead-csv'
import {
  ETAPA_LABELS,
  PRIORIDAD_LABELS,
  type EtapaLeadType,
  type Lead,
  type LeadFilters,
  type Prioridad,
} from '@/features/leads/types'

type Orden = 'recientes' | 'nombre' | 'ultimo_contacto' | 'valor'
const ORDENES: Record<Orden, string> = {
  recientes: 'Más recientes',
  nombre: 'Nombre (A-Z)',
  ultimo_contacto: 'Sin contactar hace más tiempo',
  valor: 'Mayor valor',
}
const PAGE = 50

function ordenar(leads: Lead[], orden: Orden): Lead[] {
  const copy = [...leads]
  if (orden === 'nombre') return copy.sort((a, b) => a.nombre_negocio.localeCompare(b.nombre_negocio, 'es'))
  if (orden === 'valor') return copy.sort((a, b) => (b.valor_estimado ?? 0) - (a.valor_estimado ?? 0))
  if (orden === 'ultimo_contacto')
    return copy.sort((a, b) => (a.fecha_ultimo_contacto ?? '').localeCompare(b.fecha_ultimo_contacto ?? ''))
  return copy
}

export default function ContactosPage() {
  const { openLeadForm } = useCrmUi()
  const [search, setSearch] = useState('')
  const [etapa, setEtapa] = useState<EtapaLeadType | ''>('')
  const [prioridad, setPrioridad] = useState<Prioridad | ''>('')
  const [fuente, setFuente] = useState('')
  const [orden, setOrden] = useState<Orden>('recientes')
  const [visibles, setVisibles] = useState(PAGE)
  const [importOpen, setImportOpen] = useState(false)
  const [aEliminar, setAEliminar] = useState<Lead | null>(null)
  const eliminar = useDeleteLead()

  const filters = useMemo<LeadFilters>(() => ({ search, etapa, prioridad, fuente }), [search, etapa, prioridad, fuente])
  const { data, all, isLoading, error } = useLeads(filters)
  const leads = useMemo(() => ordenar(data, orden), [data, orden])
  const fuentes = useMemo(
    () => [...new Set(all.map((l) => l.fuente).filter((f): f is string => !!f))].sort(),
    [all]
  )

  const exportar = () => {
    const fecha = new Date().toISOString().slice(0, 10)
    downloadCsv(`contactos-${fecha}.csv`, leadsToCsv(leads))
  }

  return (
    <Page>
      <PageHeader
        title="Contactos"
        description={`${all.length} prospectos registrados`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setImportOpen(true)}><Upload size={16} /> Importar CSV</Button>
            <Button variant="secondary" onClick={exportar} disabled={leads.length === 0}><Download size={16} /> Exportar {leads.length !== all.length ? `(${leads.length})` : ''}</Button>
            <Button onClick={() => openLeadForm()}><Plus size={16} /> Nuevo contacto</Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        <div className="relative lg:col-span-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <Input aria-label="Buscar" value={search} onChange={(e) => { setSearch(e.target.value); setVisibles(PAGE) }} placeholder="Buscar nombre, teléfono, email, etiqueta…" className="pl-9" />
        </div>
        <Select aria-label="Etapa" value={etapa} onChange={(e) => setEtapa(e.target.value as EtapaLeadType | '')} placeholder="Todas las etapas" options={toOptions(ETAPA_LABELS)} />
        <Select aria-label="Prioridad" value={prioridad} onChange={(e) => setPrioridad(e.target.value as Prioridad | '')} placeholder="Todas las prioridades" options={toOptions(PRIORIDAD_LABELS)} />
        <Select aria-label="Fuente" value={fuente} onChange={(e) => setFuente(e.target.value)} placeholder="Todas las fuentes" options={fuentes.map((f) => ({ value: f, label: f }))} />
      </div>
      <div className="mb-3 flex items-center justify-between text-xs text-text-secondary">
        <span>{leads.length} resultados</span>
        <label className="flex items-center gap-2">
          Ordenar:
          <Select aria-label="Ordenar" value={orden} onChange={(e) => setOrden(e.target.value as Orden)} options={toOptions(ORDENES)} className="h-8 w-auto text-xs" />
        </label>
      </div>

      {isLoading ? <LoadingState /> : error ? <ErrorState error={error} /> : leads.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={32} />}
            title={all.length === 0 ? 'Aún no tienes contactos' : 'Sin resultados'}
            description={all.length === 0 ? 'Crea tu primer prospecto o importa una lista desde CSV.' : 'Prueba con otros filtros.'}
            action={all.length === 0 ? <Button onClick={() => openLeadForm()}><Plus size={16} /> Nuevo contacto</Button> : undefined}
          />
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-text-secondary border-b border-border-primary">
              <tr>
                <th className="px-4 py-3 font-medium">Negocio</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">WhatsApp</th>
                <th className="px-4 py-3 font-medium">Etapa</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Prioridad</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Valor</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Último contacto</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {leads.slice(0, visibles).map((lead) => (
                <tr key={lead.id} className="border-b border-border-primary last:border-0 hover:bg-background-elevated/60">
                  <td className="px-4 py-3">
                    <Link href={`/contactos/${lead.id}`} className="font-medium text-text-primary hover:text-vivid-cyan">{lead.nombre_negocio}</Link>
                    <p className="text-xs text-text-tertiary">{[lead.nombre_contacto, lead.ciudad].filter(Boolean).join(' · ') || '—'}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-text-secondary tabular-nums">{lead.whatsapp}</td>
                  <td className="px-4 py-3"><EtapaBadge etapa={lead.etapa} /></td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <StatusBadge label={PRIORIDAD_LABELS[lead.prioridad]} variant={lead.prioridad === 'alta' ? 'danger' : lead.prioridad === 'media' ? 'warning' : 'default'} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-text-secondary tabular-nums">{formatMoney(lead.valor_estimado)}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-text-secondary">{timeAgo(lead.fecha_ultimo_contacto)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <WhatsAppButton leadId={lead.id} variant="icon" />
                      <Button variant="ghost" size="icon" onClick={() => openLeadForm(lead.id)} aria-label={`Editar ${lead.nombre_negocio}`} title="Editar"><Pencil size={15} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setAEliminar(lead)} aria-label={`Eliminar ${lead.nombre_negocio}`} title="Eliminar" className="hover:text-red-400"><Trash2 size={15} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length > visibles && (
            <div className="p-3 text-center border-t border-border-primary">
              <Button variant="ghost" onClick={() => setVisibles((v) => v + PAGE)}>Mostrar más ({leads.length - visibles} restantes)</Button>
            </div>
          )}
        </Card>
      )}

      <CsvImportModal open={importOpen} onClose={() => setImportOpen(false)} />
      <ConfirmDialog
        open={!!aEliminar}
        title="Eliminar contacto"
        message={`Se eliminará "${aEliminar?.nombre_negocio}" junto con su historial y seguimientos. Esta acción no se puede deshacer.`}
        loading={eliminar.isPending}
        onCancel={() => setAEliminar(null)}
        onConfirm={() => aEliminar && eliminar.mutate(aEliminar.id, { onSuccess: () => setAEliminar(null) })}
      />
    </Page>
  )
}

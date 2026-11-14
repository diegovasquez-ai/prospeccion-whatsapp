'use client'

import { useMemo, useState } from 'react'
import { History, NotebookPen, Search } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Input, Select, toOptions } from '@/shared/components/ui/Form'
import { Card, EmptyState, ErrorState, LoadingState, Page, PageHeader } from '@/shared/components/ui/Layout'
import { useCrmUi } from '@/shared/stores/crm-ui-store'
import { downloadCsv, toCsv } from '@/shared/utils/csv'
import { useLeads } from '@/features/leads/hooks/useLeads'
import { ActividadItem } from '@/features/actividades/components/ActividadItem'
import { useActividades, useDeleteActividad } from '@/features/actividades/hooks/useActividades'
import {
  RESULTADO_ACTIVIDAD_LABELS,
  TIPO_ACTIVIDAD_LABELS,
  type TipoActividadType,
} from '@/features/actividades/types'

const PERIODOS = { '7': 'Últimos 7 días', '30': 'Últimos 30 días', '90': 'Últimos 90 días', todo: 'Todo' }
const PAGE = 50

export default function HistorialPage() {
  const { openActividadForm } = useCrmUi()
  const { data: actividades = [], isLoading, error } = useActividades()
  const { all: leads } = useLeads()
  const eliminar = useDeleteActividad()
  const [tipo, setTipo] = useState<TipoActividadType | ''>('')
  const [periodo, setPeriodo] = useState<keyof typeof PERIODOS>('30')
  const [search, setSearch] = useState('')
  const [visibles, setVisibles] = useState(PAGE)

  const leadsById = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads])
  const filtradas = useMemo(() => {
    const desde = periodo === 'todo' ? 0 : Date.now() - Number(periodo) * 86_400_000
    const term = search.trim().toLowerCase()
    return actividades.filter((a) => {
      if (tipo && a.tipo !== tipo) return false
      if (new Date(a.fecha_hora).getTime() < desde) return false
      if (!term) return true
      const lead = leadsById.get(a.lead_id)
      return `${lead?.nombre_negocio ?? ''} ${lead?.nombre_contacto ?? ''} ${a.nota ?? ''}`.toLowerCase().includes(term)
    })
  }, [actividades, tipo, periodo, search, leadsById])

  const llamadas = filtradas.filter((a) => a.tipo === 'llamada')
  const minutos = llamadas.reduce((acc, a) => acc + (a.duracion_minutos ?? 0), 0)

  const exportar = () => {
    const csv = toCsv(
      ['Fecha', 'Contacto', 'WhatsApp', 'Tipo', 'Resultado', 'Duración (min)', 'Nota'],
      filtradas.map((a) => {
        const lead = leadsById.get(a.lead_id)
        return [a.fecha_hora, lead?.nombre_negocio, lead?.whatsapp, TIPO_ACTIVIDAD_LABELS[a.tipo], a.resultado ? RESULTADO_ACTIVIDAD_LABELS[a.resultado] : '', a.duracion_minutos, a.nota]
      })
    )
    downloadCsv(`historial-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  return (
    <Page className="max-w-4xl">
      <PageHeader
        title="Historial"
        description="Todas las llamadas, mensajes y reuniones con tus prospectos"
        actions={
          <>
            <Button variant="secondary" onClick={exportar} disabled={filtradas.length === 0}>Exportar CSV</Button>
            <Button onClick={() => openActividadForm(null, 'llamada')}><NotebookPen size={16} /> Registrar actividad</Button>
          </>
        }
      />
      <div className="mb-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <Input aria-label="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar contacto o nota…" className="pl-9" />
        </div>
        <Select aria-label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoActividadType | '')} placeholder="Todos los tipos" options={toOptions(TIPO_ACTIVIDAD_LABELS)} />
        <Select aria-label="Periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value as keyof typeof PERIODOS)} options={toOptions(PERIODOS)} />
      </div>
      <p className="mb-4 text-xs text-text-secondary">
        {filtradas.length} actividades · {llamadas.length} llamadas{minutos > 0 ? ` (${minutos} min)` : ''}
      </p>

      {isLoading ? <LoadingState /> : error ? <ErrorState error={error} /> : filtradas.length === 0 ? (
        <Card><EmptyState icon={<History size={32} />} title="Sin actividad en este periodo" description="Registra llamadas o conversaciones desde aquí o desde la ficha de cada contacto." /></Card>
      ) : (
        <Card className="px-4">
          <ul className="divide-y divide-border-primary">
            {filtradas.slice(0, visibles).map((a) => (
              <ActividadItem key={a.id} actividad={a} lead={leadsById.get(a.lead_id)} onDelete={() => eliminar.mutate(a.id)} />
            ))}
          </ul>
          {filtradas.length > visibles && (
            <div className="py-3 text-center border-t border-border-primary">
              <Button variant="ghost" onClick={() => setVisibles((v) => v + PAGE)}>Mostrar más</Button>
            </div>
          )}
        </Card>
      )}
    </Page>
  )
}

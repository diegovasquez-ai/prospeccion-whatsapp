'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button, buttonClasses } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Form'
import { Card, ErrorState, LoadingState, Page, PageHeader } from '@/shared/components/ui/Layout'
import { useCrmUi } from '@/shared/stores/crm-ui-store'
import { formatMoney } from '@/shared/utils/dates'
import { BarList, DailyActivityChart, KpiTile } from '@/features/dashboard/components/charts'
import { computeMetrics } from '@/features/dashboard/utils/metrics'
import { useLeads } from '@/features/leads/hooks/useLeads'
import { ETAPAS, ETAPA_COLORS, ETAPA_LABELS } from '@/features/leads/types'
import { useActividades } from '@/features/actividades/hooks/useActividades'
import { SeguimientoItem } from '@/features/seguimientos/components/SeguimientoItem'
import { useSeguimientos } from '@/features/seguimientos/hooks/useSeguimientos'
import { estadoSeguimiento } from '@/features/seguimientos/utils/estado'

const PERIODOS = [
  { value: '7', label: 'Últimos 7 días' },
  { value: '30', label: 'Últimos 30 días' },
  { value: '90', label: 'Últimos 90 días' },
]

const pct = (n: number) => `${n.toFixed(0)}%`

export default function DashboardPage() {
  const [dias, setDias] = useState('30')
  const { openLeadForm } = useCrmUi()
  const leadsQ = useLeads()
  const actividadesQ = useActividades()
  const seguimientosQ = useSeguimientos()
  const leads = leadsQ.all
  const actividades = useMemo(() => actividadesQ.data ?? [], [actividadesQ.data])
  const seguimientos = useMemo(() => seguimientosQ.data ?? [], [seguimientosQ.data])

  const m = useMemo(
    () => computeMetrics(leads, actividades, seguimientos, Number(dias)),
    [leads, actividades, seguimientos, dias]
  )
  const urgentes = useMemo(
    () => seguimientos.filter((s) => ['vencido', 'hoy'].includes(estadoSeguimiento(s))).slice(0, 6),
    [seguimientos]
  )
  const leadsById = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads])

  if (leadsQ.isLoading) return <LoadingState label="Calculando estadísticas…" />
  const error = leadsQ.error ?? actividadesQ.error ?? seguimientosQ.error
  const periodo = PERIODOS.find((p) => p.value === dias)?.label.toLowerCase()

  return (
    <Page>
      <PageHeader
        title="Dashboard comercial"
        description="Rendimiento de tu prospección por WhatsApp"
        actions={
          <>
            <Select aria-label="Periodo" value={dias} onChange={(e) => setDias(e.target.value)} options={PERIODOS} className="w-44" />
            <Button onClick={() => openLeadForm()}><Plus size={16} /> Nuevo contacto</Button>
          </>
        }
      />
      {error && <div className="mb-4"><ErrorState error={error} /></div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiTile label="Contactos totales" value={m.totalContactos} hint={`+${m.nuevosPeriodo} nuevos en ${periodo}`} />
        <KpiTile label="Prospectos contactados" value={m.contactadosPeriodo} hint={`${m.conversacionesPeriodo} interacciones · ${m.llamadasPeriodo} llamadas`} />
        <KpiTile label="Tasa de respuesta" value={pct(m.tasaRespuesta)} hint={`Interesados: ${pct(m.tasaInteres)}`} />
        <KpiTile label="Clientes ganados" value={m.clientes} hint={`Conversión: ${pct(m.tasaConversion)}`} tone="success" />
        <KpiTile label="Valor del pipeline" value={formatMoney(m.valorPipeline)} hint="Oportunidades abiertas" />
        <KpiTile label="Valor ganado" value={formatMoney(m.valorGanado)} tone="success" />
        <KpiTile label="Reuniones agendadas" value={m.reunionesAgendadas} />
        <KpiTile label="Seguimientos vencidos" value={m.seguimientosVencidos} hint={`${m.seguimientosHoy} para hoy`} tone={m.seguimientosVencidos > 0 ? 'danger' : 'default'} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Embudo por etapa</h2>
          <BarList items={ETAPAS.map((e) => ({ label: ETAPA_LABELS[e], value: m.porEtapa[e], colorClass: ETAPA_COLORS[e].bg }))} emptyLabel="Aún no hay contactos" />
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Contactos por fuente</h2>
          <BarList items={m.porFuente.slice(0, 8).map((f) => ({ label: f.fuente, value: f.total, colorClass: 'bg-vivid-purple' }))} emptyLabel="Aún no hay contactos" />
        </Card>
        <Card className="p-5 lg:col-span-3">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Actividad diaria (llamadas, mensajes, reuniones)</h2>
          <DailyActivityChart data={m.actividadDiaria} />
        </Card>
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Para hoy y vencidos</h2>
            <Link href="/seguimientos" className="text-xs text-vivid-cyan hover:underline">Ver todos</Link>
          </div>
          {urgentes.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-tertiary">Nada pendiente para hoy 🎉</p>
          ) : (
            <ul className="space-y-2">{urgentes.map((s) => <SeguimientoItem key={s.id} seguimiento={s} lead={leadsById.get(s.lead_id)} />)}</ul>
          )}
          {leads.length === 0 && (
            <Link href="/contactos" className={buttonClasses('secondary', 'sm', 'mt-4')}>Importar contactos</Link>
          )}
        </Card>
      </div>
    </Page>
  )
}

import type { Actividad } from '@/features/actividades/types'
import { ETAPAS, type EtapaLeadType, type Lead } from '@/features/leads/types'
import type { Seguimiento } from '@/features/seguimientos/types'
import { estadoSeguimiento } from '@/features/seguimientos/utils/estado'

export interface DashboardMetrics {
  totalContactos: number
  nuevosPeriodo: number
  contactadosPeriodo: number
  conversacionesPeriodo: number
  llamadasPeriodo: number
  tasaRespuesta: number
  tasaInteres: number
  tasaConversion: number
  clientes: number
  reunionesAgendadas: number
  valorPipeline: number
  valorGanado: number
  seguimientosVencidos: number
  seguimientosHoy: number
  porEtapa: Record<EtapaLeadType, number>
  porFuente: { fuente: string; total: number }[]
  actividadDiaria: { fecha: string; total: number }[]
}

const ETAPAS_ACTIVAS: EtapaLeadType[] = ['respondio', 'interesado', 'reunion_agendada']
const ETAPAS_INTERES: EtapaLeadType[] = ['interesado', 'reunion_agendada', 'cliente']
const pct = (part: number, total: number) => (total > 0 ? (part / total) * 100 : 0)

function dayKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Calcula las estadísticas comerciales para un periodo de `dias` días hasta `now` */
export function computeMetrics(
  leads: Lead[],
  actividades: Actividad[],
  seguimientos: Seguimiento[],
  dias = 30,
  now: Date = new Date()
): DashboardMetrics {
  const desde = new Date(now)
  desde.setHours(0, 0, 0, 0)
  desde.setDate(desde.getDate() - (dias - 1))
  const enPeriodo = (iso?: string | null) => !!iso && new Date(iso) >= desde && new Date(iso) <= now

  const actividadesPeriodo = actividades.filter((a) => enPeriodo(a.fecha_hora))
  const contactados = leads.filter((l) => l.etapa !== 'nuevo_lead' || l.fecha_ultimo_contacto)
  const respondieron = leads.filter(
    (l) => l.respondio || [...ETAPAS_ACTIVAS, 'cliente'].includes(l.etapa)
  )

  const porEtapa = Object.fromEntries(ETAPAS.map((e) => [e, 0])) as Record<EtapaLeadType, number>
  const fuentes = new Map<string, number>()
  leads.forEach((l) => {
    porEtapa[l.etapa] = (porEtapa[l.etapa] ?? 0) + 1
    const fuente = l.fuente?.trim() || 'Sin fuente'
    fuentes.set(fuente, (fuentes.get(fuente) ?? 0) + 1)
  })

  const diarios = new Map<string, number>()
  for (let i = 0; i < Math.min(dias, 30); i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - (Math.min(dias, 30) - 1 - i))
    diarios.set(dayKey(d), 0)
  }
  actividadesPeriodo.forEach((a) => {
    const key = dayKey(new Date(a.fecha_hora))
    if (diarios.has(key)) diarios.set(key, (diarios.get(key) ?? 0) + 1)
  })

  const pendientes = seguimientos.map((s) => estadoSeguimiento(s, now))
  const sumValor = (list: Lead[]) => list.reduce((acc, l) => acc + (l.valor_estimado ?? 0), 0)

  return {
    totalContactos: leads.length,
    nuevosPeriodo: leads.filter((l) => enPeriodo(l.created_at ?? l.fecha_creacion)).length,
    contactadosPeriodo: new Set(actividadesPeriodo.map((a) => a.lead_id)).size,
    conversacionesPeriodo: actividadesPeriodo.filter((a) => a.tipo !== 'nota_interna').length,
    llamadasPeriodo: actividadesPeriodo.filter((a) => a.tipo === 'llamada').length,
    tasaRespuesta: pct(respondieron.length, contactados.length),
    tasaInteres: pct(leads.filter((l) => ETAPAS_INTERES.includes(l.etapa)).length, contactados.length),
    tasaConversion: pct(porEtapa.cliente, contactados.length),
    clientes: porEtapa.cliente,
    reunionesAgendadas: porEtapa.reunion_agendada,
    valorPipeline: sumValor(leads.filter((l) => !['cliente', 'cerrado'].includes(l.etapa))),
    valorGanado: sumValor(leads.filter((l) => l.etapa === 'cliente')),
    seguimientosVencidos: pendientes.filter((e) => e === 'vencido').length,
    seguimientosHoy: pendientes.filter((e) => e === 'hoy').length,
    porEtapa,
    porFuente: [...fuentes.entries()]
      .map(([fuente, total]) => ({ fuente, total }))
      .sort((a, b) => b.total - a.total),
    actividadDiaria: [...diarios.entries()].map(([fecha, total]) => ({ fecha, total })),
  }
}

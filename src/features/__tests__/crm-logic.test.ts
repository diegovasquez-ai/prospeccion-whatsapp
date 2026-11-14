import { emptyLead, type Lead } from '@/features/leads/types'
import { mapCsvRows } from '@/features/leads/utils/lead-csv'
import { filterLeads } from '@/features/leads/utils/filter-leads'
import { computeMetrics } from '@/features/dashboard/utils/metrics'
import { agruparSeguimientos, estadoSeguimiento } from '@/features/seguimientos/utils/estado'
import type { Seguimiento } from '@/features/seguimientos/types'
import type { Actividad } from '@/features/actividades/types'

const NOW = new Date('2026-11-13T12:00:00')

function lead(partial: Partial<Lead>): Lead {
  return { ...emptyLead(), id: partial.id ?? Math.random().toString(), ...partial } as Lead
}

function seg(fecha: string, completado = false): Seguimiento {
  return { id: fecha, lead_id: '1', fecha_programada: fecha, tipo: 'whatsapp', nota: null, completado, completado_at: null }
}

describe('mapCsvRows', () => {
  test('mapea encabezados en español y valida filas', () => {
    const rows = mapCsvRows([
      { Empresa: 'Café Sol', Teléfono: '3001234567', Etapa: 'Interesado', Valor: '1.500.000' },
      { Empresa: '', Teléfono: '3001234568', Etapa: '', Valor: '' },
      { Empresa: 'Sin número', Teléfono: '12', Etapa: '', Valor: '' },
    ])
    expect(rows[0].lead).toMatchObject({
      nombre_negocio: 'Café Sol',
      whatsapp: '+573001234567',
      etapa: 'interesado',
      valor_estimado: 1500000,
    })
    expect(rows[1].error).toBe('Falta el nombre del negocio')
    expect(rows[2].error).toBe('WhatsApp vacío o inválido')
  })
})

describe('filterLeads', () => {
  const leads = [
    lead({ id: 'a', nombre_negocio: 'Panadería Ñandú', whatsapp: '+573001112233', etapa: 'interesado', prioridad: 'alta' }),
    lead({ id: 'b', nombre_negocio: 'Gimnasio', whatsapp: '+573209998877', etapa: 'cerrado', etiquetas: ['premium'] }),
  ]
  test('busca sin importar tildes', () => {
    expect(filterLeads(leads, { search: 'panaderia' }).map((l) => l.id)).toEqual(['a'])
  })
  test('busca por dígitos del teléfono y etiquetas', () => {
    expect(filterLeads(leads, { search: '9998' }).map((l) => l.id)).toEqual(['b'])
    expect(filterLeads(leads, { search: 'premium' }).map((l) => l.id)).toEqual(['b'])
  })
  test('filtra por etapa y prioridad', () => {
    expect(filterLeads(leads, { etapa: 'cerrado' }).map((l) => l.id)).toEqual(['b'])
    expect(filterLeads(leads, { prioridad: 'alta' }).map((l) => l.id)).toEqual(['a'])
  })
})

describe('estadoSeguimiento', () => {
  test('clasifica vencido, hoy, próximo y completado', () => {
    expect(estadoSeguimiento(seg('2026-11-12T10:00:00'), NOW)).toBe('vencido')
    expect(estadoSeguimiento(seg('2026-11-13T09:00:00'), NOW)).toBe('vencido')
    expect(estadoSeguimiento(seg('2026-11-13T18:00:00'), NOW)).toBe('hoy')
    expect(estadoSeguimiento(seg('2026-11-14T09:00:00'), NOW)).toBe('proximo')
    expect(estadoSeguimiento(seg('2026-11-10T09:00:00', true), NOW)).toBe('completado')
  })
  test('agrupa todos los elementos', () => {
    const g = agruparSeguimientos([seg('2026-11-12T10:00:00'), seg('2026-11-20T10:00:00')], NOW)
    expect(g.vencido).toHaveLength(1)
    expect(g.proximo).toHaveLength(1)
  })
})

describe('computeMetrics', () => {
  test('calcula tasas, valores y embudo', () => {
    const leads = [
      lead({ id: '1', etapa: 'cliente', valor_estimado: 100, respondio: true, created_at: '2026-11-10T10:00:00' }),
      lead({ id: '2', etapa: 'interesado', valor_estimado: 50, respondio: true, created_at: '2026-01-01T10:00:00' }),
      lead({ id: '3', etapa: 'primer_mensaje_enviado', valor_estimado: 30, created_at: '2026-11-12T10:00:00' }),
      lead({ id: '4', etapa: 'nuevo_lead' }),
    ]
    const actividades: Actividad[] = [
      { id: 'x', lead_id: '1', tipo: 'llamada', fecha_hora: '2026-11-12T10:00:00', resultado: null, nota: null, duracion_minutos: 10 },
      { id: 'y', lead_id: '3', tipo: 'whatsapp_saliente', fecha_hora: '2026-11-13T09:00:00', resultado: null, nota: null, duracion_minutos: null },
    ]
    const m = computeMetrics(leads, actividades, [seg('2026-11-12T10:00:00')], 7, NOW)
    expect(m.totalContactos).toBe(4)
    expect(m.nuevosPeriodo).toBe(2)
    expect(m.contactadosPeriodo).toBe(2)
    expect(m.llamadasPeriodo).toBe(1)
    expect(m.clientes).toBe(1)
    expect(m.tasaRespuesta).toBeCloseTo((2 / 3) * 100)
    expect(m.valorPipeline).toBe(80)
    expect(m.valorGanado).toBe(100)
    expect(m.seguimientosVencidos).toBe(1)
    expect(m.porEtapa.nuevo_lead).toBe(1)
    expect(m.actividadDiaria).toHaveLength(7)
    expect(m.actividadDiaria.at(-1)?.total).toBe(1)
  })
})

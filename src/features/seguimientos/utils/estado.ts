import type { EstadoSeguimiento, Seguimiento } from '../types'

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Vencido: fecha pasada sin completar. Hoy: programado para hoy (aún no vencido). */
export function estadoSeguimiento(s: Seguimiento, now: Date = new Date()): EstadoSeguimiento {
  if (s.completado) return 'completado'
  const fecha = new Date(s.fecha_programada)
  if (fecha < now) return 'vencido'
  const manana = startOfDay(now)
  manana.setDate(manana.getDate() + 1)
  return fecha < manana ? 'hoy' : 'proximo'
}

export function agruparSeguimientos(items: Seguimiento[], now: Date = new Date()) {
  const grupos: Record<EstadoSeguimiento, Seguimiento[]> = {
    vencido: [],
    hoy: [],
    proximo: [],
    completado: [],
  }
  items.forEach((s) => grupos[estadoSeguimiento(s, now)].push(s))
  grupos.completado.sort((a, b) => (b.completado_at ?? '').localeCompare(a.completado_at ?? ''))
  return grupos
}

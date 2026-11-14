import { createRepository } from '@/shared/lib/repository'
import { leadsService } from '@/features/leads/services/leadsService'
import type { Lead } from '@/features/leads/types'
import { TIPOS_CONVERSACION, type Actividad, type CreateActividadInput } from '../types'

const repo = createRepository<Actividad>('actividades')

/** Actualiza en el contacto los datos que se derivan de una nueva actividad */
async function syncLeadFromActividad(actividad: CreateActividadInput) {
  const patch: Partial<Lead> = {}
  if (TIPOS_CONVERSACION.includes(actividad.tipo)) patch.fecha_ultimo_contacto = actividad.fecha_hora
  if (actividad.tipo === 'whatsapp_entrante' || actividad.resultado === 'respondio') patch.respondio = true
  if (actividad.tipo === 'loom_enviado') patch.loom_enviado = true
  if (actividad.tipo === 'reunion') patch.tuvo_reunion = true
  if (Object.keys(patch).length > 0) await leadsService.update(actividad.lead_id, patch)
}

export const actividadesService = {
  async list(): Promise<Actividad[]> {
    const rows = await repo.list()
    return rows
      .map((a) => ({ ...a, duracion_minutos: a.duracion_minutos ?? null }))
      .sort((a, b) => b.fecha_hora.localeCompare(a.fecha_hora))
  },

  async create(input: CreateActividadInput): Promise<Actividad> {
    let created: Actividad
    try {
      created = await repo.insert(input)
    } catch (error) {
      // BD sin migración 004: reintenta sin duración y con un tipo compatible
      if (!(error instanceof Error && /duracion|valid_tipo|column/i.test(error.message))) throw error
      const { duracion_minutos, ...legacy } = input
      const tipo = input.tipo.startsWith('whatsapp') ? 'follow_up' : input.tipo
      const nota = duracion_minutos ? `${legacy.nota ?? ''} (${duracion_minutos} min)`.trim() : legacy.nota
      created = await repo.insert({ ...legacy, tipo, nota } as CreateActividadInput)
    }
    await syncLeadFromActividad(input)
    return created
  },

  async update(id: string, patch: Partial<Actividad>): Promise<Actividad> {
    return repo.update(id, patch)
  },

  async remove(id: string): Promise<void> {
    await repo.remove(id)
  },
}

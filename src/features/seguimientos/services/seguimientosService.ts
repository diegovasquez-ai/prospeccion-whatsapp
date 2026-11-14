import { createRepository } from '@/shared/lib/repository'
import { leadsService } from '@/features/leads/services/leadsService'
import type { CreateSeguimientoInput, Seguimiento } from '../types'

const repo = createRepository<Seguimiento>('seguimientos')

/** Guarda en el contacto la fecha del próximo seguimiento pendiente */
async function syncProximoSeguimiento(leadId: string) {
  const pendientes = (await repo.list())
    .filter((s) => s.lead_id === leadId && !s.completado)
    .map((s) => s.fecha_programada)
    .sort()
  await leadsService.update(leadId, { proxima_fecha_seguimiento: pendientes[0] ?? null })
}

export const seguimientosService = {
  async list(): Promise<Seguimiento[]> {
    return (await repo.list()).sort((a, b) => a.fecha_programada.localeCompare(b.fecha_programada))
  },

  async create(input: CreateSeguimientoInput): Promise<Seguimiento> {
    const created = await repo.insert(input)
    await syncProximoSeguimiento(input.lead_id)
    return created
  },

  async update(id: string, patch: Partial<Seguimiento>): Promise<Seguimiento> {
    const updated = await repo.update(id, patch)
    await syncProximoSeguimiento(updated.lead_id)
    return updated
  },

  async complete(seguimiento: Seguimiento): Promise<Seguimiento> {
    return this.update(seguimiento.id, {
      completado: true,
      completado_at: new Date().toISOString(),
    })
  },

  async reopen(seguimiento: Seguimiento): Promise<Seguimiento> {
    return this.update(seguimiento.id, { completado: false, completado_at: null })
  },

  async remove(seguimiento: Seguimiento): Promise<void> {
    await repo.remove(seguimiento.id)
    await syncProximoSeguimiento(seguimiento.lead_id)
  },
}

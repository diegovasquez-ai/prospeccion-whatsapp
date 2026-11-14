import { createRepository } from '@/shared/lib/repository'
import type { CreatePlantillaInput, Plantilla } from '../types'

const repo = createRepository<Plantilla>('plantillas')

export const plantillasService = {
  async list(): Promise<Plantilla[]> {
    return (await repo.list()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  },
  create: (input: CreatePlantillaInput) => repo.insert(input),
  update: (id: string, patch: Partial<Plantilla>) => repo.update(id, patch),
  remove: (id: string) => repo.remove(id),
}

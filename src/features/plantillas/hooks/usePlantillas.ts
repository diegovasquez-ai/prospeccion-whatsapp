import { useQuery } from '@tanstack/react-query'
import { useCrmMutation } from '@/shared/hooks/use-crm-mutation'
import { plantillasService } from '../services/plantillasService'
import type { CreatePlantillaInput, Plantilla } from '../types'

export const PLANTILLAS_QUERY_KEY = ['plantillas'] as const

export function usePlantillas() {
  return useQuery({ queryKey: PLANTILLAS_QUERY_KEY, queryFn: plantillasService.list })
}

export function useSavePlantilla() {
  return useCrmMutation(
    ({ id, input }: { id?: string; input: CreatePlantillaInput }) =>
      id ? plantillasService.update(id, input) : plantillasService.create(input),
    { successMessage: (p: Plantilla) => `Plantilla "${p.nombre}" guardada` }
  )
}

export function useDeletePlantilla() {
  return useCrmMutation((id: string) => plantillasService.remove(id), {
    successMessage: 'Plantilla eliminada',
  })
}

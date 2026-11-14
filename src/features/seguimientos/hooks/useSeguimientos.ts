import { useQuery } from '@tanstack/react-query'
import { useCrmMutation } from '@/shared/hooks/use-crm-mutation'
import { seguimientosService } from '../services/seguimientosService'
import type { CreateSeguimientoInput, Seguimiento } from '../types'

export const SEGUIMIENTOS_QUERY_KEY = ['seguimientos'] as const

export function useSeguimientos() {
  return useQuery({ queryKey: SEGUIMIENTOS_QUERY_KEY, queryFn: seguimientosService.list })
}

export function useCreateSeguimiento() {
  return useCrmMutation((input: CreateSeguimientoInput) => seguimientosService.create(input), {
    successMessage: 'Seguimiento programado',
  })
}

export function useCompleteSeguimiento() {
  return useCrmMutation((s: Seguimiento) => seguimientosService.complete(s), {
    successMessage: 'Seguimiento completado',
  })
}

export function useReopenSeguimiento() {
  return useCrmMutation((s: Seguimiento) => seguimientosService.reopen(s), {
    successMessage: 'Seguimiento reabierto',
  })
}

export function useRescheduleSeguimiento() {
  return useCrmMutation(
    ({ seguimiento, fecha }: { seguimiento: Seguimiento; fecha: string }) =>
      seguimientosService.update(seguimiento.id, { fecha_programada: fecha }),
    { successMessage: 'Seguimiento reprogramado' }
  )
}

export function useDeleteSeguimiento() {
  return useCrmMutation((s: Seguimiento) => seguimientosService.remove(s), {
    successMessage: 'Seguimiento eliminado',
  })
}

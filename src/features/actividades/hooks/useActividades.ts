import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { actividadesService } from '../services/actividadesService'
import type {
  CreateActividadInput,
  UpdateActividadInput,
} from '../types'

const ACTIVIDADES_QUERY_KEY = 'actividades'

/**
 * Hook para obtener actividades de un lead
 */
export function useActividadesByLead(leadId: string) {
  return useQuery({
    queryKey: [ACTIVIDADES_QUERY_KEY, leadId],
    queryFn: () => actividadesService.getActividadesByLeadId(leadId),
    enabled: !!leadId,
  })
}

/**
 * Hook para obtener una actividad por ID
 */
export function useActividad(id: string) {
  return useQuery({
    queryKey: [ACTIVIDADES_QUERY_KEY, 'single', id],
    queryFn: () => actividadesService.getActividadById(id),
    enabled: !!id,
  })
}

/**
 * Hook para crear una nueva actividad
 */
export function useCreateActividad() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateActividadInput) =>
      actividadesService.createActividad(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [ACTIVIDADES_QUERY_KEY, data.lead_id],
      })
      // También invalidar el lead para actualizar fecha_ultimo_contacto si es necesario
      queryClient.invalidateQueries({ queryKey: ['leads', data.lead_id] })
    },
  })
}

/**
 * Hook para actualizar una actividad
 */
export function useUpdateActividad() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Partial<UpdateActividadInput>
    }) => actividadesService.updateActividad(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [ACTIVIDADES_QUERY_KEY, data.lead_id],
      })
      queryClient.invalidateQueries({
        queryKey: [ACTIVIDADES_QUERY_KEY, 'single', data.id],
      })
    },
  })
}

/**
 * Hook para eliminar una actividad
 */
export function useDeleteActividad() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => actividadesService.deleteActividad(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACTIVIDADES_QUERY_KEY] })
    },
  })
}

/**
 * Hook para obtener actividades de HOY
 */
export function useActividadesHoy() {
  return useQuery({
    queryKey: [ACTIVIDADES_QUERY_KEY, 'hoy'],
    queryFn: () => actividadesService.getActividadesHoy(),
  })
}
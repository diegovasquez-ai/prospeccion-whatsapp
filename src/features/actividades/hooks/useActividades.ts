import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCrmMutation } from '@/shared/hooks/use-crm-mutation'
import { actividadesService } from '../services/actividadesService'
import type { CreateActividadInput } from '../types'

export const ACTIVIDADES_QUERY_KEY = ['actividades'] as const

export function useActividades() {
  return useQuery({ queryKey: ACTIVIDADES_QUERY_KEY, queryFn: actividadesService.list })
}

export function useActividadesByLead(leadId: string) {
  const query = useActividades()
  const data = useMemo(
    () => (query.data ?? []).filter((a) => a.lead_id === leadId),
    [query.data, leadId]
  )
  return { ...query, data }
}

export function useCreateActividad(successMessage: string | null = 'Actividad registrada') {
  return useCrmMutation((input: CreateActividadInput) => actividadesService.create(input), {
    successMessage: successMessage ?? undefined,
  })
}

export function useDeleteActividad() {
  return useCrmMutation((id: string) => actividadesService.remove(id), {
    successMessage: 'Actividad eliminada',
  })
}

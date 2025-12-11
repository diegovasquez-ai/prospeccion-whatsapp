import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leadsService } from '../services/leadsService'
import type {
  Lead,
  CreateLeadInput,
  UpdateLeadInput,
  LeadFilters,
} from '../types'

const LEADS_QUERY_KEY = 'leads'

/**
 * Hook para obtener todos los leads con filtros opcionales
 */
export function useLeads(filters?: LeadFilters) {
  return useQuery({
    queryKey: [LEADS_QUERY_KEY, filters],
    queryFn: () => leadsService.getLeads(filters),
  })
}

/**
 * Hook para obtener un lead por ID
 */
export function useLead(id: string) {
  return useQuery({
    queryKey: [LEADS_QUERY_KEY, id],
    queryFn: () => leadsService.getLeadById(id),
    enabled: !!id,
  })
}

/**
 * Hook para crear un nuevo lead
 */
export function useCreateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateLeadInput) => leadsService.createLead(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LEADS_QUERY_KEY] })
    },
  })
}

/**
 * Hook para actualizar un lead
 */
export function useUpdateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<UpdateLeadInput> }) =>
      leadsService.updateLead(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [LEADS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [LEADS_QUERY_KEY, data.id] })
    },
  })
}

/**
 * Hook para eliminar un lead
 */
export function useDeleteLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => leadsService.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LEADS_QUERY_KEY] })
    },
  })
}

/**
 * Hook para obtener leads de la vista HOY
 */
export function useLeadsToday() {
  return useQuery({
    queryKey: [LEADS_QUERY_KEY, 'today'],
    queryFn: () => leadsService.getLeadsForToday(),
  })
}

/**
 * Hook para obtener métricas del dashboard
 */
export function useLeadsMetrics(weekStart: Date, weekEnd: Date) {
  return useQuery({
    queryKey: [LEADS_QUERY_KEY, 'metrics', weekStart, weekEnd],
    queryFn: () => leadsService.getMetrics(weekStart, weekEnd),
  })
}

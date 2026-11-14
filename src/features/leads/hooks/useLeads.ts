import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCrmMutation } from '@/shared/hooks/use-crm-mutation'
import { leadsService } from '../services/leadsService'
import { filterLeads } from '../utils/filter-leads'
import type { CreateLeadInput, Lead, LeadFilters, UpdateLeadInput } from '../types'

export const LEADS_QUERY_KEY = ['leads'] as const

export function useLeads(filters?: LeadFilters) {
  const query = useQuery({ queryKey: LEADS_QUERY_KEY, queryFn: leadsService.list })
  const data = useMemo(
    () => (filters ? filterLeads(query.data ?? [], filters) : query.data ?? []),
    [query.data, filters]
  )
  return { ...query, data, all: query.data ?? [] }
}

export function useLead(id: string | null | undefined) {
  const query = useQuery({ queryKey: LEADS_QUERY_KEY, queryFn: leadsService.list })
  return { ...query, data: query.data?.find((l) => l.id === id) ?? null }
}

export function useCreateLead() {
  return useCrmMutation((input: CreateLeadInput) => leadsService.create(input), {
    successMessage: (lead: Lead) => `Contacto "${lead.nombre_negocio}" creado`,
  })
}

export function useUpdateLead(successMessage?: string) {
  return useCrmMutation(
    ({ id, input }: { id: string; input: UpdateLeadInput }) => leadsService.update(id, input),
    { successMessage }
  )
}

export function useDeleteLead() {
  return useCrmMutation((id: string) => leadsService.remove(id), {
    successMessage: 'Contacto eliminado',
  })
}

export function useImportLeads() {
  return useCrmMutation((inputs: CreateLeadInput[]) => leadsService.importMany(inputs))
}

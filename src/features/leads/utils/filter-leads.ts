import type { Lead, LeadFilters } from '../types'

const fold = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Filtra contactos por texto (nombre, contacto, teléfono, ciudad, etiquetas) y atributos */
export function filterLeads(leads: Lead[], filters: LeadFilters): Lead[] {
  const term = fold(filters.search?.trim() ?? '')
  const digits = term.replace(/\D/g, '')
  return leads.filter((lead) => {
    if (filters.etapa && lead.etapa !== filters.etapa) return false
    if (filters.prioridad && lead.prioridad !== filters.prioridad) return false
    if (filters.fuente && lead.fuente !== filters.fuente) return false
    if (filters.es_calificado != null && lead.es_calificado !== filters.es_calificado) return false
    if (!term) return true
    const haystack = fold(
      [lead.nombre_negocio, lead.nombre_contacto, lead.email, lead.ciudad, lead.sector, ...lead.etiquetas]
        .filter(Boolean)
        .join(' ')
    )
    return haystack.includes(term) || (digits.length >= 3 && lead.whatsapp.replace(/\D/g, '').includes(digits))
  })
}

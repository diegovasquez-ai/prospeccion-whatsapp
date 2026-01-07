import { z } from 'zod'

// Enums
export const EtapaLead = {
  NUEVO_LEAD: 'nuevo_lead',
  PRIMER_MENSAJE_ENVIADO: 'primer_mensaje_enviado',
  AUDIO_ENVIADO: 'audio_enviado',
  LOOM_ENVIADO: 'loom_enviado',
  RESPONDIO: 'respondio',
  INTERESADO: 'interesado',
  REUNION_AGENDADA: 'reunion_agendada',
  CERRADO: 'cerrado',
} as const

export type EtapaLeadType = (typeof EtapaLead)[keyof typeof EtapaLead]

// Labels para UI
export const ETAPA_LABELS: Record<EtapaLeadType, string> = {
  [EtapaLead.NUEVO_LEAD]: 'No respondió',
  [EtapaLead.PRIMER_MENSAJE_ENVIADO]: 'Primer mensaje enviado',
  [EtapaLead.AUDIO_ENVIADO]: 'Audio enviado',
  [EtapaLead.LOOM_ENVIADO]: 'Loom enviado',
  [EtapaLead.RESPONDIO]: 'Respondió',
  [EtapaLead.INTERESADO]: 'Interesado',
  [EtapaLead.REUNION_AGENDADA]: 'Reunión agendada',
  [EtapaLead.CERRADO]: 'Cerrado / No interesado',
}

// Schema Zod para validación
export const leadSchema = z.object({
  id: z.string().uuid().optional(),
  nombre_negocio: z.string().min(1, 'El nombre del negocio es requerido'),
  whatsapp: z.string().min(1, 'El número de WhatsApp es requerido'),
  etapa: z.enum([
    EtapaLead.NUEVO_LEAD,
    EtapaLead.PRIMER_MENSAJE_ENVIADO,
    EtapaLead.AUDIO_ENVIADO,
    EtapaLead.LOOM_ENVIADO,
    EtapaLead.RESPONDIO,
    EtapaLead.INTERESADO,
    EtapaLead.REUNION_AGENDADA,
    EtapaLead.CERRADO,
  ]),
  es_calificado: z.boolean().default(false),
  respondio: z.boolean().default(false),
  acepto_loom: z.boolean().default(false),
  loom_enviado: z.boolean().default(false),
  pdf_armado: z.boolean().default(false),
  tuvo_reunion: z.boolean().default(false),
  observacion_general: z.string().optional().nullable(),
  observacion_post_reunion: z.string().optional().nullable(),
  fecha_creacion: z.string().datetime().optional(),
  fecha_ultimo_contacto: z.string().datetime().optional().nullable(),
  proxima_fecha_seguimiento: z.string().datetime().optional().nullable(),
  fecha_reunion: z.string().datetime().optional().nullable(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
})

export const createLeadSchema = leadSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  fecha_creacion: true,
})

export const updateLeadSchema = leadSchema.partial().required({ id: true })

// Types derivados de schemas
export type Lead = z.infer<typeof leadSchema>
export type CreateLeadInput = z.infer<typeof createLeadSchema>
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>

// Type para filtros
export type LeadFilters = {
  etapa?: EtapaLeadType
  es_calificado?: boolean
  search?: string
}

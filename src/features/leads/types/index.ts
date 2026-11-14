import { z } from 'zod'

export const ETAPAS = [
  'nuevo_lead',
  'primer_mensaje_enviado',
  'audio_enviado',
  'loom_enviado',
  'respondio',
  'interesado',
  'reunion_agendada',
  'cliente',
  'cerrado',
] as const

export type EtapaLeadType = (typeof ETAPAS)[number]

/** Compatibilidad con el código anterior */
export const EtapaLead = {
  NUEVO_LEAD: 'nuevo_lead',
  PRIMER_MENSAJE_ENVIADO: 'primer_mensaje_enviado',
  AUDIO_ENVIADO: 'audio_enviado',
  LOOM_ENVIADO: 'loom_enviado',
  RESPONDIO: 'respondio',
  INTERESADO: 'interesado',
  REUNION_AGENDADA: 'reunion_agendada',
  CLIENTE: 'cliente',
  CERRADO: 'cerrado',
} as const satisfies Record<string, EtapaLeadType>

export const ETAPA_LABELS: Record<EtapaLeadType, string> = {
  nuevo_lead: 'No respondió',
  primer_mensaje_enviado: 'Primer mensaje enviado',
  audio_enviado: 'Audio enviado',
  loom_enviado: 'Loom enviado',
  respondio: 'Respondió',
  interesado: 'Interesado',
  reunion_agendada: 'Reunión agendada',
  cliente: 'Cliente ganado',
  cerrado: 'Perdido / No interesado',
}

/** Color de acento (clase Tailwind) por etapa */
export const ETAPA_COLORS: Record<EtapaLeadType, { text: string; bg: string; border: string }> = {
  nuevo_lead: { text: 'text-text-tertiary', bg: 'bg-text-tertiary', border: 'border-text-tertiary' },
  primer_mensaje_enviado: { text: 'text-vivid-blue', bg: 'bg-vivid-blue', border: 'border-vivid-blue' },
  audio_enviado: { text: 'text-vivid-purple', bg: 'bg-vivid-purple', border: 'border-vivid-purple' },
  loom_enviado: { text: 'text-vivid-magenta', bg: 'bg-vivid-magenta', border: 'border-vivid-magenta' },
  respondio: { text: 'text-vivid-yellow', bg: 'bg-vivid-yellow', border: 'border-vivid-yellow' },
  interesado: { text: 'text-vivid-cyan', bg: 'bg-vivid-cyan', border: 'border-vivid-cyan' },
  reunion_agendada: { text: 'text-emerald-400', bg: 'bg-emerald-400', border: 'border-emerald-400' },
  cliente: { text: 'text-vivid-green', bg: 'bg-vivid-green', border: 'border-vivid-green' },
  cerrado: { text: 'text-red-400', bg: 'bg-red-400', border: 'border-red-400' },
}

export const PRIORIDADES = ['alta', 'media', 'baja'] as const
export type Prioridad = (typeof PRIORIDADES)[number]
export const PRIORIDAD_LABELS: Record<Prioridad, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
}

export interface Lead {
  id: string
  nombre_negocio: string
  nombre_contacto: string | null
  whatsapp: string
  email: string | null
  ciudad: string | null
  sector: string | null
  fuente: string | null
  etapa: EtapaLeadType
  prioridad: Prioridad
  valor_estimado: number | null
  etiquetas: string[]
  es_calificado: boolean
  respondio: boolean
  acepto_loom: boolean
  loom_enviado: boolean
  pdf_armado: boolean
  tuvo_reunion: boolean
  observacion_general: string | null
  observacion_post_reunion: string | null
  fecha_creacion?: string
  fecha_ultimo_contacto: string | null
  proxima_fecha_seguimiento: string | null
  fecha_reunion: string | null
  created_at?: string
  updated_at?: string
}

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .optional()

/** Validación del formulario de contacto */
export const leadFormSchema = z.object({
  nombre_negocio: z.string().trim().min(1, 'El nombre del negocio es obligatorio'),
  nombre_contacto: optionalText,
  whatsapp: z
    .string()
    .trim()
    .refine((v) => v.replace(/\D/g, '').length >= 8, 'Número de WhatsApp inválido (mínimo 8 dígitos)'),
  email: z
    .string()
    .trim()
    .refine((v) => v === '' || z.string().email().safeParse(v).success, 'Email inválido')
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
  ciudad: optionalText,
  sector: optionalText,
  fuente: optionalText,
  etapa: z.enum(ETAPAS),
  prioridad: z.enum(PRIORIDADES),
  valor_estimado: z.number().nonnegative('El valor no puede ser negativo').nullable(),
  etiquetas: z.array(z.string()),
  es_calificado: z.boolean(),
  observacion_general: optionalText,
})

export type LeadFormValues = z.input<typeof leadFormSchema>
export type CreateLeadInput = Omit<Lead, 'id' | 'created_at' | 'updated_at'>
export type UpdateLeadInput = Partial<Lead>

/** Valores por defecto para un contacto nuevo */
export function emptyLead(): CreateLeadInput {
  return {
    nombre_negocio: '',
    nombre_contacto: null,
    whatsapp: '',
    email: null,
    ciudad: null,
    sector: null,
    fuente: null,
    etapa: 'primer_mensaje_enviado',
    prioridad: 'media',
    valor_estimado: null,
    etiquetas: [],
    es_calificado: false,
    respondio: false,
    acepto_loom: false,
    loom_enviado: false,
    pdf_armado: false,
    tuvo_reunion: false,
    observacion_general: null,
    observacion_post_reunion: null,
    fecha_ultimo_contacto: null,
    proxima_fecha_seguimiento: null,
    fecha_reunion: null,
  }
}

/** Rellena campos faltantes de filas antiguas (antes de la migración 004) */
export function normalizeLead(row: Partial<Lead> & { id: string }): Lead {
  return { ...emptyLead(), ...row, etiquetas: row.etiquetas ?? [], prioridad: row.prioridad ?? 'media' } as Lead
}

export interface LeadFilters {
  search?: string
  etapa?: EtapaLeadType | ''
  prioridad?: Prioridad | ''
  es_calificado?: boolean | null
  fuente?: string
}

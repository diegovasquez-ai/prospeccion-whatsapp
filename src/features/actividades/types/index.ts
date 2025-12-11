import { z } from 'zod'

// Enums
export const TipoActividad = {
  PRIMER_MENSAJE: 'primer_mensaje',
  FOLLOW_UP: 'follow_up',
  AUDIO_ENVIADO: 'audio_enviado',
  LOOM_ENVIADO: 'loom_enviado',
  REUNION: 'reunion',
  NOTA_INTERNA: 'nota_interna',
  LLAMADA: 'llamada',
  EMAIL: 'email',
  OTRO: 'otro',
} as const

export type TipoActividadType = (typeof TipoActividad)[keyof typeof TipoActividad]

export const ResultadoActividad = {
  RESPONDIO: 'respondio',
  NO_RESPONDIO: 'no_respondio',
  REPROGRAMADO: 'reprogramado',
  INTERESADO: 'interesado',
  NO_INTERESADO: 'no_interesado',
  COMPLETADO: 'completado',
  PENDIENTE: 'pendiente',
} as const

export type ResultadoActividadType =
  (typeof ResultadoActividad)[keyof typeof ResultadoActividad]

// Labels para UI
export const TIPO_ACTIVIDAD_LABELS: Record<TipoActividadType, string> = {
  [TipoActividad.PRIMER_MENSAJE]: 'Primer mensaje',
  [TipoActividad.FOLLOW_UP]: 'Follow up',
  [TipoActividad.AUDIO_ENVIADO]: 'Audio enviado',
  [TipoActividad.LOOM_ENVIADO]: 'Loom enviado',
  [TipoActividad.REUNION]: 'Reunión',
  [TipoActividad.NOTA_INTERNA]: 'Nota interna',
  [TipoActividad.LLAMADA]: 'Llamada',
  [TipoActividad.EMAIL]: 'Email',
  [TipoActividad.OTRO]: 'Otro',
}

export const RESULTADO_ACTIVIDAD_LABELS: Record<ResultadoActividadType, string> = {
  [ResultadoActividad.RESPONDIO]: 'Respondió',
  [ResultadoActividad.NO_RESPONDIO]: 'No respondió',
  [ResultadoActividad.REPROGRAMADO]: 'Reprogramado',
  [ResultadoActividad.INTERESADO]: 'Interesado',
  [ResultadoActividad.NO_INTERESADO]: 'No interesado',
  [ResultadoActividad.COMPLETADO]: 'Completado',
  [ResultadoActividad.PENDIENTE]: 'Pendiente',
}

// Schema Zod para validación
export const actividadSchema = z.object({
  id: z.string().uuid().optional(),
  lead_id: z.string().uuid(),
  fecha_hora: z.string().datetime(),
  tipo: z.enum([
    TipoActividad.PRIMER_MENSAJE,
    TipoActividad.FOLLOW_UP,
    TipoActividad.AUDIO_ENVIADO,
    TipoActividad.LOOM_ENVIADO,
    TipoActividad.REUNION,
    TipoActividad.NOTA_INTERNA,
    TipoActividad.LLAMADA,
    TipoActividad.EMAIL,
    TipoActividad.OTRO,
  ]),
  resultado: z
    .enum([
      ResultadoActividad.RESPONDIO,
      ResultadoActividad.NO_RESPONDIO,
      ResultadoActividad.REPROGRAMADO,
      ResultadoActividad.INTERESADO,
      ResultadoActividad.NO_INTERESADO,
      ResultadoActividad.COMPLETADO,
      ResultadoActividad.PENDIENTE,
    ])
    .optional()
    .nullable(),
  nota: z.string().optional().nullable(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
})

export const createActividadSchema = actividadSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const updateActividadSchema = actividadSchema.partial().required({ id: true })

// Types derivados de schemas
export type Actividad = z.infer<typeof actividadSchema>
export type CreateActividadInput = z.infer<typeof createActividadSchema>
export type UpdateActividadInput = z.infer<typeof updateActividadSchema>

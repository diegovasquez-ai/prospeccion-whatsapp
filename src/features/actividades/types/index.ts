export const TIPOS_ACTIVIDAD = [
  'llamada',
  'whatsapp_saliente',
  'whatsapp_entrante',
  'primer_mensaje',
  'follow_up',
  'audio_enviado',
  'loom_enviado',
  'reunion',
  'email',
  'nota_interna',
  'otro',
] as const

export type TipoActividadType = (typeof TIPOS_ACTIVIDAD)[number]

export const TIPO_ACTIVIDAD_LABELS: Record<TipoActividadType, string> = {
  llamada: 'Llamada',
  whatsapp_saliente: 'WhatsApp enviado',
  whatsapp_entrante: 'WhatsApp recibido',
  primer_mensaje: 'Primer mensaje',
  follow_up: 'Follow up',
  audio_enviado: 'Audio enviado',
  loom_enviado: 'Loom enviado',
  reunion: 'Reunión',
  email: 'Email',
  nota_interna: 'Nota interna',
  otro: 'Otro',
}

/** Tipos que cuentan como conversación (llamadas o mensajes) */
export const TIPOS_CONVERSACION: TipoActividadType[] = [
  'llamada',
  'whatsapp_saliente',
  'whatsapp_entrante',
  'primer_mensaje',
  'follow_up',
  'audio_enviado',
  'loom_enviado',
  'reunion',
  'email',
]

export const RESULTADOS_ACTIVIDAD = [
  'respondio',
  'no_respondio',
  'reprogramado',
  'interesado',
  'no_interesado',
  'completado',
  'pendiente',
] as const

export type ResultadoActividadType = (typeof RESULTADOS_ACTIVIDAD)[number]

export const RESULTADO_ACTIVIDAD_LABELS: Record<ResultadoActividadType, string> = {
  respondio: 'Respondió',
  no_respondio: 'No respondió',
  reprogramado: 'Reprogramado',
  interesado: 'Interesado',
  no_interesado: 'No interesado',
  completado: 'Completado',
  pendiente: 'Pendiente',
}

export interface Actividad {
  id: string
  lead_id: string
  fecha_hora: string
  tipo: TipoActividadType
  resultado: ResultadoActividadType | null
  nota: string | null
  duracion_minutos: number | null
  created_at?: string
  updated_at?: string
}

export type CreateActividadInput = Omit<Actividad, 'id' | 'created_at' | 'updated_at'>

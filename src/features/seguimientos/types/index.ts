export const TIPOS_SEGUIMIENTO = ['whatsapp', 'llamada', 'reunion', 'email', 'otro'] as const
export type TipoSeguimiento = (typeof TIPOS_SEGUIMIENTO)[number]

export const TIPO_SEGUIMIENTO_LABELS: Record<TipoSeguimiento, string> = {
  whatsapp: 'Escribir por WhatsApp',
  llamada: 'Llamar',
  reunion: 'Reunión',
  email: 'Enviar email',
  otro: 'Otro',
}

export interface Seguimiento {
  id: string
  lead_id: string
  fecha_programada: string
  tipo: TipoSeguimiento
  nota: string | null
  completado: boolean
  completado_at: string | null
  created_at?: string
  updated_at?: string
}

export type CreateSeguimientoInput = Omit<Seguimiento, 'id' | 'created_at' | 'updated_at'>

export type EstadoSeguimiento = 'vencido' | 'hoy' | 'proximo' | 'completado'

import { emptyLead, type EtapaLeadType, type Lead, type Prioridad } from '@/features/leads/types'
import type { Actividad, TipoActividadType } from '@/features/actividades/types'
import type { Seguimiento } from '@/features/seguimientos/types'
import type { Plantilla } from '@/features/plantillas/types'
import { newId, type BaseRow } from './repository'

const DIA = 24 * 60 * 60 * 1000
const haceDias = (d: number, hora = 10) => {
  const date = new Date(Date.now() - d * DIA)
  date.setHours(hora, 0, 0, 0)
  return date.toISOString()
}

type LeadSeed = [string, string, string, string, string, string, EtapaLeadType, Prioridad, number | null, number]

const LEADS: LeadSeed[] = [
  ['Panadería La Espiga', 'Laura Gómez', '+573001112233', 'Bogotá', 'Alimentos', 'Instagram', 'interesado', 'alta', 1800000, 12],
  ['Clínica Dental Sonríe', 'Andrés Ruiz', '+573102223344', 'Medellín', 'Salud', 'Google Maps', 'reunion_agendada', 'alta', 3500000, 9],
  ['Gimnasio Fuerza Total', 'Camila Torres', '+573203334455', 'Cali', 'Fitness', 'Referido', 'respondio', 'media', 1200000, 7],
  ['Inmobiliaria Horizonte', 'Jorge Patiño', '+573014445566', 'Barranquilla', 'Inmobiliario', 'LinkedIn', 'primer_mensaje_enviado', 'media', 4000000, 3],
  ['Café Montaña', 'Sofía Herrera', '+573125556677', 'Manizales', 'Restaurantes', 'Instagram', 'audio_enviado', 'baja', 900000, 5],
  ['Taller AutoExpress', 'Luis Martínez', '+573226667788', 'Bogotá', 'Automotriz', 'Google Maps', 'nuevo_lead', 'baja', null, 2],
  ['Boutique Aurora', 'Valentina Ríos', '+573017778899', 'Medellín', 'Moda', 'Instagram', 'cliente', 'alta', 2500000, 25],
  ['Spa Armonía', 'Daniela Castro', '+573138889900', 'Bucaramanga', 'Belleza', 'Referido', 'loom_enviado', 'media', 1500000, 6],
  ['Ferretería El Tornillo', 'Carlos Vega', '+573239990011', 'Pereira', 'Ferretería', 'Base de datos', 'cerrado', 'baja', 800000, 20],
  ['Veterinaria Patitas', 'Mariana López', '+573040001122', 'Cartagena', 'Mascotas', 'Google Maps', 'primer_mensaje_enviado', 'media', 1100000, 1],
]

const PLANTILLAS: Omit<Plantilla, 'id'>[] = [
  { nombre: 'Primer contacto', categoria: 'primer_contacto', contenido: 'Hola {contacto}, ¿cómo estás? Vi {negocio} y me pareció muy interesante. Ayudo a negocios de {sector} a conseguir más clientes. ¿Te puedo contar en 2 minutos cómo?' },
  { nombre: 'Seguimiento suave', categoria: 'seguimiento', contenido: 'Hola {contacto}, te escribo de nuevo por si se te pasó mi mensaje anterior. ¿Tienes 10 minutos esta semana para conversar sobre {negocio}?' },
  { nombre: 'Envío de propuesta', categoria: 'propuesta', contenido: 'Hola {contacto}, como conversamos, te comparto la propuesta para {negocio}. Quedo atento a tus comentarios.' },
  { nombre: 'Cierre', categoria: 'cierre', contenido: 'Hola {contacto}, ¿pudiste revisar la propuesta? Si te parece bien, podemos empezar esta misma semana.' },
]

/** Datos de ejemplo para el modo demo (sin Supabase) */
export function buildDemoData(): Record<string, BaseRow[]> {
  const leads: Lead[] = LEADS.map(([negocio, contacto, whatsapp, ciudad, sector, fuente, etapa, prioridad, valor, dias]) => ({
    ...emptyLead(),
    id: newId(),
    nombre_negocio: negocio,
    nombre_contacto: contacto,
    whatsapp,
    ciudad,
    sector,
    fuente,
    etapa,
    prioridad,
    valor_estimado: valor,
    es_calificado: prioridad !== 'baja',
    respondio: ['respondio', 'interesado', 'reunion_agendada', 'cliente'].includes(etapa),
    fecha_ultimo_contacto: etapa === 'nuevo_lead' ? null : haceDias(Math.max(dias - 2, 0)),
    created_at: haceDias(dias, 9),
    updated_at: haceDias(Math.max(dias - 2, 0)),
  }))

  const actividades: Actividad[] = []
  const add = (lead: Lead, tipo: TipoActividadType, dias: number, nota: string, extra: Partial<Actividad> = {}) =>
    actividades.push({
      id: newId(), lead_id: lead.id, tipo, fecha_hora: haceDias(dias, 9 + (actividades.length % 8)),
      nota, resultado: null, duracion_minutos: null, created_at: haceDias(dias), ...extra,
    })
  leads.forEach((lead, i) => {
    const dias = LEADS[i][9]
    if (lead.etapa === 'nuevo_lead') return
    add(lead, 'primer_mensaje', dias, 'Mensaje inicial de presentación por WhatsApp')
    if (lead.respondio) add(lead, 'whatsapp_entrante', dias - 1, 'Respondió pidiendo más información', { resultado: 'respondio' })
    if (['interesado', 'reunion_agendada', 'cliente'].includes(lead.etapa))
      add(lead, 'llamada', Math.max(dias - 3, 0), 'Llamada de diagnóstico, interesado en el servicio', { resultado: 'interesado', duracion_minutos: 15 })
  })

  const seguimiento = (lead: Lead, offsetDias: number, tipo: Seguimiento['tipo'], nota: string): Seguimiento => {
    const fecha = new Date(Date.now() + offsetDias * DIA)
    fecha.setHours(offsetDias === 0 ? 23 : 10, offsetDias === 0 ? 0 : 30, 0, 0)
    return { id: newId(), lead_id: lead.id, fecha_programada: fecha.toISOString(), tipo, nota, completado: false, completado_at: null, created_at: haceDias(1) }
  }
  const seguimientos: Seguimiento[] = [
    seguimiento(leads[2], -2, 'whatsapp', 'Enviar casos de éxito de otros gimnasios'),
    seguimiento(leads[3], -1, 'whatsapp', 'Recordar primer mensaje'),
    seguimiento(leads[0], 0, 'llamada', 'Llamar para cerrar fecha de inicio'),
    seguimiento(leads[1], 1, 'reunion', 'Reunión de presentación de propuesta'),
    seguimiento(leads[7], 3, 'whatsapp', 'Preguntar si vio el video Loom'),
  ]
  leads.forEach((lead) => {
    const prox = seguimientos.filter((s) => s.lead_id === lead.id).map((s) => s.fecha_programada).sort()[0]
    lead.proxima_fecha_seguimiento = prox ?? null
  })

  const plantillas: Plantilla[] = PLANTILLAS.map((p) => ({ ...p, id: newId(), created_at: haceDias(30) }))
  return { leads, actividades, seguimientos, plantillas }
}

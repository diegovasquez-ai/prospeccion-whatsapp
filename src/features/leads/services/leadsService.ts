import { supabase } from '@/shared/lib/supabase'
import type {
  Lead,
  CreateLeadInput,
  UpdateLeadInput,
  LeadFilters,
} from '../types'

export const leadsService = {
  /**
   * Obtener todos los leads con filtros opcionales
   */
  async getLeads(filters?: LeadFilters): Promise<Lead[]> {
    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (filters?.etapa) {
      query = query.eq('etapa', filters.etapa)
    }

    if (filters?.es_calificado !== undefined) {
      query = query.eq('es_calificado', filters.es_calificado)
    }

    if (filters?.search) {
      // Buscar por whatsapp o nombre del negocio
      query = query.or(`whatsapp.ilike.%${filters.search}%,nombre_negocio.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Error fetching leads: ${error.message}`)
    }

    return data || []
  },

  /**
   * Obtener un lead por ID
   */
  async getLeadById(id: string): Promise<Lead | null> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Error fetching lead: ${error.message}`)
    }

    return data
  },

  /**
   * Crear un nuevo lead
   */
  async createLead(input: CreateLeadInput): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .insert(input)
      .select()
      .single()

    if (error) {
      throw new Error(`Error creating lead: ${error.message}`)
    }

    return data
  },

  /**
   * Actualizar un lead existente
   */
  async updateLead(id: string, input: Partial<UpdateLeadInput>): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating lead: ${error.message}`)
    }

    return data
  },

  /**
   * Eliminar un lead
   */
  async deleteLead(id: string): Promise<void> {
    const { error } = await supabase.from('leads').delete().eq('id', id)

    if (error) {
      throw new Error(`Error deleting lead: ${error.message}`)
    }
  },

  /**
   * Obtener leads para la vista HOY
   */
  async getLeadsForToday(): Promise<{
    sinPrimerMensaje: Lead[]
    seguimientosHoy: Lead[]
    reunionesProximas: Lead[]
    loomSinRespuesta: Lead[]
  }> {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const manana = new Date(hoy)
    manana.setDate(manana.getDate() + 2)

    // Leads sin primer mensaje
    const { data: sinPrimerMensaje } = await supabase
      .from('leads')
      .select('*')
      .eq('etapa', 'nuevo_lead')
      .order('created_at', { ascending: false })

    // Seguimientos para hoy (fecha de seguimiento <= hoy)
    const { data: seguimientosHoy } = await supabase
      .from('leads')
      .select('*')
      .not('proxima_fecha_seguimiento', 'is', null)
      .lte('proxima_fecha_seguimiento', new Date().toISOString())
      .order('proxima_fecha_seguimiento', { ascending: true })

    // Reuniones próximas (próximas 48h)
    const { data: reunionesProximas } = await supabase
      .from('leads')
      .select('*')
      .not('fecha_reunion', 'is', null)
      .gte('fecha_reunion', hoy.toISOString())
      .lte('fecha_reunion', manana.toISOString())
      .order('fecha_reunion', { ascending: true })

    // Loom enviados sin respuesta hace más de 3 días
    const tresDiasAtras = new Date()
    tresDiasAtras.setDate(tresDiasAtras.getDate() - 3)

    const { data: loomSinRespuesta } = await supabase
      .from('leads')
      .select('*')
      .eq('loom_enviado', true)
      .eq('respondio', false)
      .lte('fecha_ultimo_contacto', tresDiasAtras.toISOString())
      .order('fecha_ultimo_contacto', { ascending: true })

    return {
      sinPrimerMensaje: sinPrimerMensaje || [],
      seguimientosHoy: seguimientosHoy || [],
      reunionesProximas: reunionesProximas || [],
      loomSinRespuesta: loomSinRespuesta || [],
    }
  },

  /**
   * Obtener métricas para el dashboard
   */
  async getMetrics(weekStart: Date, weekEnd: Date): Promise<{
    leadsCreados: number
    leadsContactados: number
    porcentajeRespuesta: number
    porcentajeInteresados: number
    reunionesAgendadas: number
    leadsPorEtapa: Record<string, number>
  }> {
    // Leads creados en la semana
    const { count: leadsCreados } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('fecha_creacion', weekStart.toISOString())
      .lte('fecha_creacion', weekEnd.toISOString())

    // Leads contactados (primer mensaje enviado)
    const { count: leadsContactados } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('fecha_creacion', weekStart.toISOString())
      .lte('fecha_creacion', weekEnd.toISOString())
      .neq('etapa', 'nuevo_lead')

    // Total de leads y leads que respondieron
    const { data: allLeads } = await supabase
      .from('leads')
      .select('respondio, etapa')

    const totalLeads = allLeads?.length || 0
    const leadsQueRespondieron = allLeads?.filter(l => l.respondio).length || 0
    const leadsInteresados =
      allLeads?.filter(l => l.etapa === 'interesado' || l.etapa === 'reunion_agendada')
        .length || 0

    // Reuniones agendadas
    const { count: reunionesAgendadas } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('tuvo_reunion', true)

    // Leads por etapa
    const leadsPorEtapa: Record<string, number> = {}
    allLeads?.forEach(lead => {
      leadsPorEtapa[lead.etapa] = (leadsPorEtapa[lead.etapa] || 0) + 1
    })

    return {
      leadsCreados: leadsCreados || 0,
      leadsContactados: leadsContactados || 0,
      porcentajeRespuesta:
        totalLeads > 0 ? (leadsQueRespondieron / totalLeads) * 100 : 0,
      porcentajeInteresados:
        totalLeads > 0 ? (leadsInteresados / totalLeads) * 100 : 0,
      reunionesAgendadas: reunionesAgendadas || 0,
      leadsPorEtapa,
    }
  },
  /**
   * Obtener conteo de leads creados hoy
   */
  async getTodayLeadsCount(): Promise<number> {
    const hoy = new Date()
    // Normalizar a inicio del día en la zona horaria local
    const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
    const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999)

    const { count, error } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', inicioDia.toISOString())
      .lte('created_at', finDia.toISOString())

    if (error) {
      throw new Error(`Error fetching today leads count: ${error.message}`)
    }

    return count || 0
  },
}

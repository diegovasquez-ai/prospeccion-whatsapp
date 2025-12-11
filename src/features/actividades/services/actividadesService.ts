import { supabase } from '@/shared/lib/supabase'
import type { Actividad, CreateActividadInput, UpdateActividadInput } from '../types'

export const actividadesService = {
  /**
   * Obtener todas las actividades de un lead
   */
  async getActividadesByLeadId(leadId: string): Promise<Actividad[]> {
    const { data, error } = await supabase
      .from('actividades')
      .select('*')
      .eq('lead_id', leadId)
      .order('fecha_hora', { ascending: false })

    if (error) {
      throw new Error(`Error fetching actividades: ${error.message}`)
    }

    return data || []
  },

  /**
   * Obtener una actividad por ID
   */
  async getActividadById(id: string): Promise<Actividad | null> {
    const { data, error } = await supabase
      .from('actividades')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Error fetching actividad: ${error.message}`)
    }

    return data
  },

  /**
   * Crear una nueva actividad
   */
  async createActividad(input: CreateActividadInput): Promise<Actividad> {
    const { data, error } = await supabase
      .from('actividades')
      .insert(input)
      .select()
      .single()

    if (error) {
      throw new Error(`Error creating actividad: ${error.message}`)
    }

    return data
  },

  /**
   * Actualizar una actividad existente
   */
  async updateActividad(
    id: string,
    input: Partial<UpdateActividadInput>
  ): Promise<Actividad> {
    const { data, error } = await supabase
      .from('actividades')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating actividad: ${error.message}`)
    }

    return data
  },

  /**
   * Eliminar una actividad
   */
  async deleteActividad(id: string): Promise<void> {
    const { error } = await supabase.from('actividades').delete().eq('id', id)

    if (error) {
      throw new Error(`Error deleting actividad: ${error.message}`)
    }
  },

  /**
   * Obtener actividades para HOY (hoy y pendientes pasadas)
   */
  async getActividadesHoy(): Promise<{
    hoy: (Actividad & { lead: { id: string; nombre_negocio: string; whatsapp: string } })[]
    pendientes: (Actividad & { lead: { id: string; nombre_negocio: string; whatsapp: string } })[]
    proximas: (Actividad & { lead: { id: string; nombre_negocio: string; whatsapp: string } })[]
  }> {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    const finHoy = new Date(hoy)
    finHoy.setHours(23, 59, 59, 999)

    const manana = new Date(hoy)
    manana.setDate(manana.getDate() + 1)

    const en7Dias = new Date(hoy)
    en7Dias.setDate(en7Dias.getDate() + 7)

    // Actividades de hoy
    const { data: actividadesHoy, error: errorHoy } = await supabase
      .from('actividades')
      .select('*, lead:leads(id, nombre_negocio, whatsapp)')
      .gte('fecha_hora', hoy.toISOString())
      .lte('fecha_hora', finHoy.toISOString())
      .order('fecha_hora', { ascending: true })

    if (errorHoy) {
      throw new Error(`Error fetching actividades hoy: ${errorHoy.message}`)
    }

    // Actividades pendientes (fechas pasadas)
    const { data: actividadesPendientes, error: errorPendientes } = await supabase
      .from('actividades')
      .select('*, lead:leads(id, nombre_negocio, whatsapp)')
      .lt('fecha_hora', hoy.toISOString())
      .order('fecha_hora', { ascending: false })

    if (errorPendientes) {
      throw new Error(`Error fetching actividades pendientes: ${errorPendientes.message}`)
    }

    // Actividades próximas (mañana a 7 días)
    const { data: actividadesProximas, error: errorProximas } = await supabase
      .from('actividades')
      .select('*, lead:leads(id, nombre_negocio, whatsapp)')
      .gte('fecha_hora', manana.toISOString())
      .lte('fecha_hora', en7Dias.toISOString())
      .order('fecha_hora', { ascending: true })

    if (errorProximas) {
      throw new Error(`Error fetching actividades proximas: ${errorProximas.message}`)
    }

    return {
      hoy: (actividadesHoy || []) as (Actividad & { lead: { id: string; nombre_negocio: string; whatsapp: string } })[],
      pendientes: (actividadesPendientes || []) as (Actividad & { lead: { id: string; nombre_negocio: string; whatsapp: string } })[],
      proximas: (actividadesProximas || []) as (Actividad & { lead: { id: string; nombre_negocio: string; whatsapp: string } })[],
    }
  },
}

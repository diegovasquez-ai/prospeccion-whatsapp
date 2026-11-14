export const CATEGORIAS_PLANTILLA = [
  'primer_contacto',
  'seguimiento',
  'propuesta',
  'cierre',
  'otro',
] as const
export type CategoriaPlantilla = (typeof CATEGORIAS_PLANTILLA)[number]

export const CATEGORIA_PLANTILLA_LABELS: Record<CategoriaPlantilla, string> = {
  primer_contacto: 'Primer contacto',
  seguimiento: 'Seguimiento',
  propuesta: 'Propuesta',
  cierre: 'Cierre',
  otro: 'Otro',
}

export interface Plantilla {
  id: string
  nombre: string
  categoria: CategoriaPlantilla
  contenido: string
  created_at?: string
  updated_at?: string
}

export type CreatePlantillaInput = Omit<Plantilla, 'id' | 'created_at' | 'updated_at'>

/** Variables disponibles dentro de una plantilla */
export const VARIABLES_PLANTILLA = [
  { clave: '{contacto}', descripcion: 'Nombre del contacto' },
  { clave: '{negocio}', descripcion: 'Nombre del negocio' },
  { clave: '{ciudad}', descripcion: 'Ciudad' },
  { clave: '{sector}', descripcion: 'Sector / rubro' },
] as const

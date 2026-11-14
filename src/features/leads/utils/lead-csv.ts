import { normalizeHeader, toCsv } from '@/shared/utils/csv'
import { normalizePhone } from '@/shared/utils/phone'
import {
  emptyLead,
  ETAPAS,
  ETAPA_LABELS,
  PRIORIDADES,
  type CreateLeadInput,
  type EtapaLeadType,
  type Lead,
  type Prioridad,
} from '../types'

type CsvField =
  | 'nombre_negocio'
  | 'nombre_contacto'
  | 'whatsapp'
  | 'email'
  | 'ciudad'
  | 'sector'
  | 'fuente'
  | 'etapa'
  | 'prioridad'
  | 'valor_estimado'
  | 'etiquetas'
  | 'observacion_general'

/** Encabezados aceptados (ya normalizados) para cada campo */
const HEADER_ALIASES: Record<CsvField, string[]> = {
  nombre_negocio: ['nombrenegocio', 'negocio', 'empresa', 'company', 'razonsocial', 'nombre'],
  nombre_contacto: ['nombrecontacto', 'contacto', 'persona', 'contactname', 'responsable'],
  whatsapp: ['whatsapp', 'telefono', 'celular', 'movil', 'phone', 'numero', 'tel'],
  email: ['email', 'correo', 'correoelectronico', 'mail'],
  ciudad: ['ciudad', 'city', 'municipio'],
  sector: ['sector', 'rubro', 'industria', 'categoria'],
  fuente: ['fuente', 'origen', 'source', 'canal'],
  etapa: ['etapa', 'estado', 'stage'],
  prioridad: ['prioridad', 'priority'],
  valor_estimado: ['valorestimado', 'valor', 'monto', 'value'],
  etiquetas: ['etiquetas', 'tags', 'etiqueta'],
  observacion_general: ['observaciones', 'observacion', 'observaciongeneral', 'notas', 'nota', 'comentarios'],
}

const EXPORT_COLUMNS: { header: string; value: (l: Lead) => unknown }[] = [
  { header: 'Negocio', value: (l) => l.nombre_negocio },
  { header: 'Contacto', value: (l) => l.nombre_contacto },
  { header: 'WhatsApp', value: (l) => l.whatsapp },
  { header: 'Email', value: (l) => l.email },
  { header: 'Ciudad', value: (l) => l.ciudad },
  { header: 'Sector', value: (l) => l.sector },
  { header: 'Fuente', value: (l) => l.fuente },
  { header: 'Etapa', value: (l) => ETAPA_LABELS[l.etapa] },
  { header: 'Prioridad', value: (l) => l.prioridad },
  { header: 'Valor estimado', value: (l) => l.valor_estimado },
  { header: 'Etiquetas', value: (l) => l.etiquetas },
  { header: 'Calificado', value: (l) => (l.es_calificado ? 'Sí' : 'No') },
  { header: 'Último contacto', value: (l) => l.fecha_ultimo_contacto },
  { header: 'Próximo seguimiento', value: (l) => l.proxima_fecha_seguimiento },
  { header: 'Observaciones', value: (l) => l.observacion_general },
  { header: 'Creado', value: (l) => l.created_at },
]

export function leadsToCsv(leads: Lead[]): string {
  return toCsv(
    EXPORT_COLUMNS.map((c) => c.header),
    leads.map((lead) => EXPORT_COLUMNS.map((c) => c.value(lead)))
  )
}

/** Acepta el valor interno ("interesado") o la etiqueta ("Interesado") */
function parseEtapa(value: string): EtapaLeadType | null {
  const norm = normalizeHeader(value)
  if (!norm) return null
  return (
    ETAPAS.find((e) => normalizeHeader(e) === norm || normalizeHeader(ETAPA_LABELS[e]) === norm) ??
    null
  )
}

function parsePrioridad(value: string): Prioridad {
  const norm = normalizeHeader(value)
  return (PRIORIDADES as readonly string[]).includes(norm) ? (norm as Prioridad) : 'media'
}

function parseNumber(value: string): number | null {
  if (!value) return null
  const n = Number(value.replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/** Detecta qué columna del CSV corresponde a cada campo */
export function detectColumns(headers: string[]): Partial<Record<CsvField, string>> {
  const result: Partial<Record<CsvField, string>> = {}
  const normalized = headers.map((h) => ({ original: h, norm: normalizeHeader(h) }))
  ;(Object.keys(HEADER_ALIASES) as CsvField[]).forEach((field) => {
    const match = HEADER_ALIASES[field]
      .map((alias) => normalized.find((h) => h.norm === alias))
      .find(Boolean)
    if (match && !Object.values(result).includes(match.original)) result[field] = match.original
  })
  return result
}

export interface CsvImportRow {
  fila: number
  lead: CreateLeadInput | null
  error: string | null
}

/** Convierte filas CSV en contactos listos para importar, validando cada una */
export function mapCsvRows(rows: Record<string, string>[]): CsvImportRow[] {
  if (rows.length === 0) return []
  const columns = detectColumns(Object.keys(rows[0]))
  const get = (row: Record<string, string>, field: CsvField) =>
    columns[field] ? (row[columns[field]!] ?? '').trim() : ''

  return rows.map((row, index) => {
    const fila = index + 2
    const nombre = get(row, 'nombre_negocio') || get(row, 'nombre_contacto')
    const whatsapp = normalizePhone(get(row, 'whatsapp'))
    if (!nombre) return { fila, lead: null, error: 'Falta el nombre del negocio' }
    if (whatsapp.replace(/\D/g, '').length < 8)
      return { fila, lead: null, error: 'WhatsApp vacío o inválido' }

    const lead: CreateLeadInput = {
      ...emptyLead(),
      nombre_negocio: nombre,
      nombre_contacto: get(row, 'nombre_contacto') || null,
      whatsapp,
      email: get(row, 'email') || null,
      ciudad: get(row, 'ciudad') || null,
      sector: get(row, 'sector') || null,
      fuente: get(row, 'fuente') || 'Importación CSV',
      etapa: parseEtapa(get(row, 'etapa')) ?? 'nuevo_lead',
      prioridad: parsePrioridad(get(row, 'prioridad')),
      valor_estimado: parseNumber(get(row, 'valor_estimado')),
      etiquetas: get(row, 'etiquetas')
        .split(/[,|]/)
        .map((t) => t.trim())
        .filter(Boolean),
      observacion_general: get(row, 'observacion_general') || null,
    }
    return { fila, lead, error: null }
  })
}

export const CSV_TEMPLATE = toCsv(
  ['Negocio', 'Contacto', 'WhatsApp', 'Email', 'Ciudad', 'Sector', 'Fuente', 'Etapa', 'Prioridad', 'Valor estimado', 'Etiquetas', 'Observaciones'],
  [['Panadería La Espiga', 'Laura Gómez', '+573001234567', 'laura@ejemplo.com', 'Bogotá', 'Alimentos', 'Instagram', 'Primer mensaje enviado', 'alta', '1500000', 'panadería, local', 'Abre de lunes a sábado']]
)

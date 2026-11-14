import { createRepository } from '@/shared/lib/repository'
import { supabase } from '@/shared/lib/supabase'
import { normalizePhone } from '@/shared/utils/phone'
import { normalizeLead, type CreateLeadInput, type Lead, type UpdateLeadInput } from '../types'

const repo = createRepository<Lead>('leads')

const phoneKey = (phone: string) => normalizePhone(phone).replace(/\D/g, '')

/** Columnas añadidas en la migración 004; se omiten si la BD aún no las tiene */
const COLUMNS_004 = [
  'nombre_contacto', 'email', 'ciudad', 'sector', 'fuente', 'prioridad', 'valor_estimado', 'etiquetas',
] as const

function isMissingColumnError(error: unknown): boolean {
  return error instanceof Error && /column|schema cache/i.test(error.message)
}

function stripNewColumns<T extends object>(row: T): T {
  const copy = { ...row } as Record<string, unknown>
  COLUMNS_004.forEach((c) => delete copy[c])
  return copy as T
}

/** Reintenta sin las columnas nuevas si la migración 004 aún no se aplicó */
async function withLegacyFallback<T, R>(row: T, op: (r: T) => Promise<R>): Promise<R> {
  try {
    return await op(row)
  } catch (error) {
    if (supabase && isMissingColumnError(error)) return op(stripNewColumns(row as object) as T)
    throw error
  }
}

async function assertUniquePhone(whatsapp: string, ignoreId?: string) {
  const key = phoneKey(whatsapp)
  const existing = (await repo.list()).find((l) => phoneKey(l.whatsapp) === key && l.id !== ignoreId)
  if (existing) throw new Error(`Ese WhatsApp ya pertenece a "${existing.nombre_negocio}"`)
}

export const leadsService = {
  async list(): Promise<Lead[]> {
    return (await repo.list()).map(normalizeLead)
  },

  async create(input: CreateLeadInput): Promise<Lead> {
    const whatsapp = normalizePhone(input.whatsapp)
    await assertUniquePhone(whatsapp)
    const created = await withLegacyFallback({ ...input, whatsapp }, (row) => repo.insert(row))
    return normalizeLead(created)
  },

  async update(id: string, patch: UpdateLeadInput): Promise<Lead> {
    const data = { ...patch }
    delete data.id
    delete data.created_at
    delete data.updated_at
    if (data.whatsapp) {
      data.whatsapp = normalizePhone(data.whatsapp)
      await assertUniquePhone(data.whatsapp, id)
    }
    const updated = await withLegacyFallback(data, (row) => repo.update(id, row))
    return normalizeLead(updated)
  },

  async remove(id: string): Promise<void> {
    await repo.remove(id)
    // En Supabase las tablas hijas se borran con ON DELETE CASCADE
    if (!supabase) {
      const hijos = ['actividades', 'seguimientos'] as const
      for (const tabla of hijos) {
        const childRepo = createRepository<{ id: string; lead_id: string }>(tabla)
        const rows = await childRepo.list()
        await Promise.all(rows.filter((r) => r.lead_id === id).map((r) => childRepo.remove(r.id)))
      }
    }
  },

  /** Importa contactos omitiendo números ya existentes o repetidos en el archivo */
  async importMany(inputs: CreateLeadInput[]): Promise<{ importados: number; duplicados: number }> {
    const seen = new Set((await repo.list()).map((l) => phoneKey(l.whatsapp)))
    const nuevos: CreateLeadInput[] = []
    inputs.forEach((input) => {
      const whatsapp = normalizePhone(input.whatsapp)
      const key = phoneKey(whatsapp)
      if (seen.has(key)) return
      seen.add(key)
      nuevos.push({ ...input, whatsapp })
    })
    const BATCH = 500
    for (let i = 0; i < nuevos.length; i += BATCH) {
      const batch = nuevos.slice(i, i + BATCH)
      try {
        await repo.insertMany(batch)
      } catch (error) {
        if (!(supabase && isMissingColumnError(error))) throw error
        await repo.insertMany(batch.map((r) => stripNewColumns(r)))
      }
    }
    return { importados: nuevos.length, duplicados: inputs.length - nuevos.length }
  },
}

import { supabase } from './supabase'

export interface BaseRow {
  id: string
  created_at?: string
  updated_at?: string
}

export type NewRow<T extends BaseRow> = Omit<T, 'id' | 'created_at' | 'updated_at'>

/** Operaciones CRUD comunes a Supabase y al modo demo */
export interface Repository<T extends BaseRow> {
  list(): Promise<T[]>
  insert(row: NewRow<T>): Promise<T>
  insertMany(rows: NewRow<T>[]): Promise<T[]>
  update(id: string, patch: Partial<T>): Promise<T>
  remove(id: string): Promise<void>
}

const PAGE_SIZE = 1000

function fail(action: string, table: string, message: string): never {
  throw new Error(`No se pudo ${action} en "${table}": ${message}`)
}

function supabaseRepository<T extends BaseRow>(table: string): Repository<T> {
  const db = supabase!
  return {
    async list() {
      const rows: T[] = []
      for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await db
          .from(table)
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, from + PAGE_SIZE - 1)
        if (error) fail('leer', table, error.message)
        rows.push(...((data ?? []) as T[]))
        if (!data || data.length < PAGE_SIZE) return rows
      }
    },
    async insert(row) {
      const { data, error } = await db.from(table).insert(row as Record<string, unknown>).select().single()
      if (error) fail('crear', table, error.message)
      return data as T
    },
    async insertMany(rows) {
      if (rows.length === 0) return []
      const { data, error } = await db.from(table).insert(rows as Record<string, unknown>[]).select()
      if (error) fail('importar', table, error.message)
      return (data ?? []) as T[]
    },
    async update(id, patch) {
      const { id: _ignored, ...rest } = patch
      void _ignored
      const { data, error } = await db.from(table).update(rest as Record<string, unknown>).eq('id', id).select().single()
      if (error) fail('actualizar', table, error.message)
      return data as T
    },
    async remove(id) {
      const { error } = await db.from(table).delete().eq('id', id)
      if (error) fail('eliminar', table, error.message)
    },
  }
}

// ---------------------------------------------------------------------
// Modo demo: tablas en localStorage del navegador
// ---------------------------------------------------------------------

const LOCAL_PREFIX = 'crm-demo:'
type Seeder = () => Record<string, BaseRow[]>
let seeder: Seeder | null = null

/** Registra los datos iniciales del modo demo (se cargan una sola vez) */
export function registerDemoSeed(fn: Seeder) {
  seeder = fn
}

function ensureSeeded() {
  if (typeof window === 'undefined' || !seeder) return
  if (window.localStorage.getItem(`${LOCAL_PREFIX}seeded`)) return
  const data = seeder()
  Object.entries(data).forEach(([table, rows]) =>
    window.localStorage.setItem(LOCAL_PREFIX + table, JSON.stringify(rows))
  )
  window.localStorage.setItem(`${LOCAL_PREFIX}seeded`, '1')
}

function readLocal<T>(table: string): T[] {
  if (typeof window === 'undefined') return []
  ensureSeeded()
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_PREFIX + table) ?? '[]') as T[]
  } catch {
    return []
  }
}

function writeLocal<T>(table: string, rows: T[]) {
  window.localStorage.setItem(LOCAL_PREFIX + table, JSON.stringify(rows))
}

/** Borra todos los datos demo; se volverán a sembrar al recargar */
export function resetDemoData() {
  Object.keys(window.localStorage)
    .filter((k) => k.startsWith(LOCAL_PREFIX))
    .forEach((k) => window.localStorage.removeItem(k))
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function localRepository<T extends BaseRow>(table: string): Repository<T> {
  const build = (row: NewRow<T>): T => {
    const now = new Date().toISOString()
    return { ...row, id: newId(), created_at: now, updated_at: now } as T
  }
  return {
    async list() {
      return readLocal<T>(table).sort((a, b) =>
        (b.created_at ?? '').localeCompare(a.created_at ?? '')
      )
    },
    async insert(row) {
      const created = build(row)
      writeLocal(table, [created, ...readLocal<T>(table)])
      return created
    },
    async insertMany(rows) {
      const created = rows.map(build)
      writeLocal(table, [...created, ...readLocal<T>(table)])
      return created
    },
    async update(id, patch) {
      const rows = readLocal<T>(table)
      const index = rows.findIndex((r) => r.id === id)
      if (index === -1) fail('actualizar', table, 'registro no encontrado')
      const updated = { ...rows[index], ...patch, id, updated_at: new Date().toISOString() }
      rows[index] = updated
      writeLocal(table, rows)
      return updated
    },
    async remove(id) {
      writeLocal(table, readLocal<T>(table).filter((r) => r.id !== id))
    },
  }
}

/** Devuelve el repositorio adecuado según exista o no configuración de Supabase */
export function createRepository<T extends BaseRow>(table: string): Repository<T> {
  return supabase ? supabaseRepository<T>(table) : localRepository<T>(table)
}

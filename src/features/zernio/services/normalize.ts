import type { ZernioAccount, ZernioProfile } from '../types'

type Obj = Record<string, unknown>

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : typeof v === 'number' ? String(v) : null)

/**
 * Único punto donde se resuelve el identificador de Zernio: según el endpoint
 * llega como accountId, _id o id (y profileId puede venir como objeto poblado).
 */
export function zernioId(value: unknown, preferred: string[] = ['accountId', '_id', 'id']): string | null {
  if (!isObj(value)) return str(value)
  for (const key of preferred) {
    const found = str(value[key])
    if (found) return found
  }
  return null
}

/** Extrae una lista venga como array, { [key]: [...] } o { data: [...] } */
export function extractList(payload: unknown, key: string): unknown[] {
  if (Array.isArray(payload)) return payload
  if (!isObj(payload)) return []
  if (Array.isArray(payload[key])) return payload[key] as unknown[]
  if (Array.isArray(payload.data)) return payload.data as unknown[]
  return []
}

export function normalizeAccount(raw: unknown): ZernioAccount | null {
  if (!isObj(raw)) return null
  const accountId = zernioId(raw)
  if (!accountId) return null
  const profile = raw.profileId ?? raw.profile
  return {
    accountId,
    platform: str(raw.platform) ?? 'desconocida',
    profileId: zernioId(profile, ['_id', 'id', 'profileId']),
    username: str(raw.username),
    displayName: str(raw.displayName) ?? str(raw.verifiedName) ?? str(raw.name),
    phoneNumber: str(raw.phoneNumber) ?? str(raw.displayPhoneNumber),
    isActive: raw.isActive !== false && raw.status !== 'disconnected',
  }
}

export function normalizeProfile(raw: unknown): ZernioProfile | null {
  if (!isObj(raw)) return null
  const profileId = zernioId(raw, ['_id', 'id', 'profileId'])
  if (!profileId) return null
  return { profileId, name: str(raw.name) ?? 'Perfil sin nombre' }
}

export function normalizeAccounts(payload: unknown): ZernioAccount[] {
  return extractList(payload, 'accounts')
    .map(normalizeAccount)
    .filter((a): a is ZernioAccount => a !== null)
}

export function normalizeProfiles(payload: unknown): ZernioProfile[] {
  return extractList(payload, 'profiles')
    .map(normalizeProfile)
    .filter((p): p is ZernioProfile => p !== null)
}

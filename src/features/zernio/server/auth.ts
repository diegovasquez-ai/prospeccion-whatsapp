/**
 * Autenticación de las rutas /api/zernio/*. SOLO SERVIDOR.
 * El navegador manda el access token de Supabase; aquí se verifica y se crea
 * un cliente de BD que actúa como ese usuario (respeta RLS, sin service role).
 */
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import { cleanApiKey } from '../services/zernio-client'

export type AuthResult =
  | { ok: true; user: User; db: SupabaseClient }
  | { ok: false; response: Response }

export function jsonError(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
  return Response.json({ error: { code, message, ...extra } }, { status })
}

export async function requireUser(request: Request): Promise<AuthResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return { ok: false, response: jsonError(503, 'supabase_not_configured', 'Conecta Supabase antes de usar las integraciones') }
  }
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return { ok: false, response: jsonError(401, 'unauthorized', 'Inicia sesión') }

  const db = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await db.auth.getUser(token)
  if (error || !data.user) return { ok: false, response: jsonError(401, 'unauthorized', 'Sesión inválida o expirada') }
  return { ok: true, user: data.user, db }
}

export function requireZernioKey(): Response | null {
  return cleanApiKey(process.env.ZERNIO_API_KEY)
    ? null
    : jsonError(503, 'zernio_not_configured', 'Falta configurar la clave de Zernio (ZERNIO_API_KEY) en el servidor')
}

/** URL a la que Zernio devuelve tras el OAuth (abre en el popup) */
export function callbackUrl(request: Request): string {
  const base = process.env.APP_URL ?? new URL(request.url).origin
  return `${base.replace(/\/+$/, '')}/integraciones/callback`
}

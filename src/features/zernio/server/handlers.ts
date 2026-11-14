/**
 * Lógica de las rutas /api/zernio/*. SOLO SERVIDOR. La API key de Zernio
 * nunca sale de aquí: al navegador solo vuelven authUrl y datos de cuentas.
 */
import { createZernioAccountsService, type ZernioAccountsService } from '../services/zernio-accounts'
import type { ZernioError } from '../services/zernio-client'
import { connectErrorMessage, type ConnectRequest, type WhatsAppCredentialsInput } from '../types'
import { upsertAccounts } from './accounts-repo'
import { callbackUrl, jsonError, requireUser, requireZernioKey } from './auth'

type Guarded = { db: Parameters<typeof upsertAccounts>[0]; service: ZernioAccountsService }

/** Exige sesión válida y clave de Zernio configurada */
async function guard(request: Request): Promise<{ ok: true; ctx: Guarded } | { ok: false; response: Response }> {
  const auth = await requireUser(request)
  if (!auth.ok) return auth
  const missingKey = requireZernioKey()
  if (missingKey) return { ok: false, response: missingKey }
  return { ok: true, ctx: { db: auth.db, service: createZernioAccountsService() } }
}

/** Traduce un error de Zernio a respuesta HTTP sin filtrar datos sensibles */
function zernioFailure(error: ZernioError): Response {
  // Un 401/403 de Zernio es la clave o el token de Meta, no la sesión del usuario en el CRM
  if (error.status === 401 && /api key/i.test(error.message)) {
    return jsonError(400, 'zernio_api_key_invalid', 'Zernio rechazó la clave API: no es válida, fue revocada o expiró. Copia de nuevo la clave desde Zernio y actualiza ZERNIO_API_KEY en Vercel.')
  }
  if (error.status === 401) {
    return jsonError(400, error.code || 'credentials_rejected', `Meta rechazó las credenciales: ${error.message}`)
  }
  const status = error.status >= 400 && error.status < 600 ? error.status : 502
  const message = connectErrorMessage(error.code, error.message)
  return jsonError(status, error.code, message, error.retryAfter != null ? { retryAfter: error.retryAfter } : {})
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export async function handleListProfiles(request: Request): Promise<Response> {
  const g = await guard(request)
  if (!g.ok) return g.response
  const res = await g.ctx.service.listProfiles()
  return res.success ? Response.json({ profiles: res.data }) : zernioFailure(res.error)
}

/** Lista las cuentas en Zernio y las sincroniza con la BD */
export async function handleSyncAccounts(request: Request): Promise<Response> {
  const g = await guard(request)
  if (!g.ok) return g.response
  const res = await g.ctx.service.listAccounts()
  if (!res.success) return zernioFailure(res.error)
  // Sin método: las filas nuevas toman el default 'oauth' y las existentes conservan el suyo
  const saveError = await upsertAccounts(g.ctx.db, res.data)
  return Response.json({ accounts: res.data, saveError })
}

export async function handleConnect(request: Request): Promise<Response> {
  const g = await guard(request)
  if (!g.ok) return g.response
  const body = await readJson(request)
  if (!body || typeof body !== 'object') return jsonError(400, 'invalid_request', 'Cuerpo JSON inválido')
  const res = await g.ctx.service.getConnectUrl(body as ConnectRequest, callbackUrl(request))
  // Al navegador solo vuelve la authUrl
  return res.success ? Response.json({ authUrl: res.data.authUrl }) : zernioFailure(res.error)
}

export async function handleWhatsAppCredentials(request: Request): Promise<Response> {
  const g = await guard(request)
  if (!g.ok) return g.response
  const body = await readJson(request)
  if (!body || typeof body !== 'object') return jsonError(400, 'invalid_request', 'Cuerpo JSON inválido')
  const res = await g.ctx.service.connectWhatsAppCredentials(body as WhatsAppCredentialsInput)
  if (!res.success) return zernioFailure(res.error)
  const saveError = await upsertAccounts(g.ctx.db, [res.data.account], 'credentials')
  return Response.json({ ...res.data, saveError })
}

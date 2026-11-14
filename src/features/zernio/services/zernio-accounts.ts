/**
 * Conexión de cuentas de Zernio. SOLO SERVIDOR (usa la API key vía zernio-client).
 */
import type {
  ConnectRequest,
  CredentialsConnectResult,
  ZernioAccount,
  ZernioProfile,
} from '../types'
import { connectRequestSchema, whatsappCredentialsSchema, type WhatsAppCredentialsInput } from '../types'
import { normalizeAccount, normalizeAccounts, normalizeProfiles } from './normalize'
import { createZernioClient, type ZernioClient, type ZernioResult } from './zernio-client'

function invalid<T>(message: string): ZernioResult<T> {
  return { success: false, error: { status: 400, code: 'invalid_request', message, retryAfter: null } }
}

export function createZernioAccountsService(client: ZernioClient = createZernioClient()) {
  return {
    async listAccounts(): Promise<ZernioResult<ZernioAccount[]>> {
      const res = await client.get('/accounts')
      return res.success ? { success: true, data: normalizeAccounts(res.data) } : res
    },

    async listProfiles(): Promise<ZernioResult<ZernioProfile[]>> {
      const res = await client.get('/profiles')
      return res.success ? { success: true, data: normalizeProfiles(res.data) } : res
    },

    /** Pide la authUrl de OAuth. onboarding / loginMethod siempre se envían explícitos. */
    async getConnectUrl(input: ConnectRequest, redirectUrl: string): Promise<ZernioResult<{ authUrl: string }>> {
      const parsed = connectRequestSchema.safeParse(input)
      if (!parsed.success) return invalid(parsed.error.issues[0]?.message ?? 'Solicitud inválida')
      const req = parsed.data
      const query: Record<string, string> = { profileId: req.profileId, redirect_url: redirectUrl }
      if (req.platform === 'whatsapp') query.onboarding = req.onboarding
      if (req.platform === 'instagram') query.loginMethod = req.loginMethod

      const res = await client.get<{ authUrl?: unknown }>(`/connect/${req.platform}`, { query })
      if (!res.success) return res
      const authUrl = typeof res.data?.authUrl === 'string' ? res.data.authUrl : null
      if (!authUrl?.startsWith('https://')) {
        return { success: false, error: { status: 502, code: 'invalid_auth_url', message: 'Zernio no devolvió una authUrl válida', retryAfter: null } }
      }
      return { success: true, data: { authUrl } }
    },

    /** BYO-WABA: el número ya vive en una WABA, Embedded Signup no sirve. */
    async connectWhatsAppCredentials(input: WhatsAppCredentialsInput): Promise<ZernioResult<CredentialsConnectResult>> {
      const parsed = whatsappCredentialsSchema.safeParse(input)
      if (!parsed.success) return invalid(parsed.error.issues[0]?.message ?? 'Datos inválidos')
      const { pin, ...rest } = parsed.data
      const body = pin ? { ...rest, pin } : rest

      // Clave de idempotencia automática por llamada (cubre sus reintentos). No se usa una
      // clave fija por número: Zernio repetiría 24 h el error de un PIN mal escrito.
      const res = await client.post<{ account?: unknown; registrationWarning?: unknown }>(
        '/connect/whatsapp/credentials',
        body
      )
      if (!res.success) return res
      const account = normalizeAccount(res.data?.account)
      if (!account) {
        return { success: false, error: { status: 502, code: 'invalid_account', message: 'Zernio no devolvió la cuenta conectada', retryAfter: null } }
      }
      const warning = typeof res.data?.registrationWarning === 'string' ? res.data.registrationWarning : null
      return { success: true, data: { account, registrationWarning: warning } }
    },
  }
}

export type ZernioAccountsService = ReturnType<typeof createZernioAccountsService>

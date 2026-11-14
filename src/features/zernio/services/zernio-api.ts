/**
 * Llamadas del NAVEGADOR a nuestras rutas /api/zernio/*. Nunca habla con Zernio
 * directamente: solo envía el token de sesión de Supabase.
 */
import { supabase } from '@/shared/lib/supabase'
import type {
  ConnectRequest,
  CredentialsConnectResult,
  WhatsAppCredentialsInput,
  ZernioAccount,
  ZernioProfile,
} from '../types'

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!supabase) throw new Error('Conecta Supabase para usar las integraciones')
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.')

  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers },
  })
  const body = (await response.json().catch(() => null)) as
    | (T & { error?: { message?: string } })
    | null
  if (!response.ok) throw new Error(body?.error?.message ?? `Error ${response.status}`)
  return body as T
}

export const zernioApi = {
  profiles: () => call<{ profiles: ZernioProfile[] }>('/api/zernio/profiles').then((r) => r.profiles),

  syncAccounts: () => call<{ accounts: ZernioAccount[]; saveError: string | null }>('/api/zernio/accounts'),

  connectUrl: (input: ConnectRequest) =>
    call<{ authUrl: string }>('/api/zernio/connect', { method: 'POST', body: JSON.stringify(input) }).then(
      (r) => r.authUrl
    ),

  connectWhatsAppCredentials: (input: WhatsAppCredentialsInput) =>
    call<CredentialsConnectResult & { saveError: string | null }>('/api/zernio/connect/whatsapp-credentials', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
}

export const ZERNIO_POPUP_MESSAGE = 'zernio-connect-result'

export interface ZernioPopupMessage {
  type: typeof ZERNIO_POPUP_MESSAGE
  accountId: string | null
  error: string | null
}

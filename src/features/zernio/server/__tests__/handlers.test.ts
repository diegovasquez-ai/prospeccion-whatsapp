/**
 * @jest-environment node
 */
import { handleConnect, handleSyncAccounts } from '../handlers'
import { callbackUrl } from '../auth'

const ENV = { ...process.env }

afterEach(() => {
  process.env = { ...ENV }
})

describe('rutas /api/zernio', () => {
  test('sin Supabase configurado responde 503', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    const res = await handleSyncAccounts(new Request('https://crm.app/api/zernio/accounts'))
    expect(res.status).toBe(503)
  })

  test('sin token de sesión responde 401 y no toca Zernio', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
    process.env.ZERNIO_API_KEY = 'secreta'
    const fetchSpy = jest.spyOn(global, 'fetch')
    const res = await handleConnect(new Request('https://crm.app/api/zernio/connect', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(401)
    expect(fetchSpy).not.toHaveBeenCalled()
    const body = await res.text()
    expect(body).not.toContain('secreta')
    fetchSpy.mockRestore()
  })

  test('callbackUrl usa el origen de la petición o APP_URL', () => {
    delete process.env.APP_URL
    expect(callbackUrl(new Request('https://crm.app/api/zernio/connect'))).toBe('https://crm.app/integraciones/callback')
    process.env.APP_URL = 'https://mi-crm.com/'
    expect(callbackUrl(new Request('https://otro.app/x'))).toBe('https://mi-crm.com/integraciones/callback')
  })
})

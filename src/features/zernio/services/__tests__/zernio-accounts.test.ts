/**
 * @jest-environment node
 */
import { extractList, normalizeAccount, normalizeAccounts, normalizeProfiles, zernioId } from '../normalize'
import { createZernioAccountsService } from '../zernio-accounts'
import { createZernioClient } from '../zernio-client'

function serviceWith(responses: Response[]) {
  const calls: { url: string; init: RequestInit }[] = []
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    return responses.shift() ?? new Response('{}', { status: 500 })
  }) as unknown as typeof fetch
  const client = createZernioClient({ apiKey: 'k', fetchImpl, sleep: async () => undefined })
  return { service: createZernioAccountsService(client), calls }
}

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })
const query = (url: string) => Object.fromEntries(new URL(url).searchParams)

describe('normalización de ids de Zernio', () => {
  test('acepta accountId, _id o id', () => {
    expect(zernioId({ accountId: 'a1' })).toBe('a1')
    expect(zernioId({ _id: 'b2' })).toBe('b2')
    expect(zernioId({ id: 'c3' })).toBe('c3')
    expect(zernioId({ _id: 'b2', id: 'c3' })).toBe('b2')
    expect(zernioId({})).toBeNull()
  })

  test('normalizeAccount: profileId poblado como objeto y teléfono alternativo', () => {
    expect(
      normalizeAccount({ _id: 'acc', platform: 'whatsapp', profileId: { _id: 'prof', name: 'X' }, verifiedName: 'Mi Negocio', displayPhoneNumber: '+57 300' })
    ).toEqual({
      accountId: 'acc', platform: 'whatsapp', profileId: 'prof', username: null,
      displayName: 'Mi Negocio', phoneNumber: '+57 300', isActive: true,
    })
    expect(normalizeAccount({ id: 'x', status: 'disconnected' })?.isActive).toBe(false)
    expect(normalizeAccount({ platform: 'whatsapp' })).toBeNull()
  })

  test('extractList acepta array, wrapper con clave o data', () => {
    expect(extractList([1], 'accounts')).toEqual([1])
    expect(extractList({ accounts: [2] }, 'accounts')).toEqual([2])
    expect(extractList({ data: [3] }, 'accounts')).toEqual([3])
    expect(extractList(null, 'accounts')).toEqual([])
  })

  test('normalizeAccounts / normalizeProfiles descartan filas sin id', () => {
    expect(normalizeAccounts({ accounts: [{ _id: 'a' }, { platform: 'x' }] })).toHaveLength(1)
    expect(normalizeProfiles([{ _id: 'p1', name: 'Marca' }, {}])).toEqual([{ profileId: 'p1', name: 'Marca' }])
  })
})

describe('getConnectUrl', () => {
  test('WhatsApp manda onboarding explícito, profileId y redirect_url', async () => {
    const { service, calls } = serviceWith([json(200, { authUrl: 'https://facebook.com/dialog/x', state: 's' })])
    const res = await service.getConnectUrl({ platform: 'whatsapp', profileId: 'p1', onboarding: 'business_app' }, 'https://crm.app/integraciones/callback')
    expect(res).toEqual({ success: true, data: { authUrl: 'https://facebook.com/dialog/x' } })
    expect(new URL(calls[0].url).pathname).toBe('/api/v1/connect/whatsapp')
    expect(query(calls[0].url)).toEqual({ profileId: 'p1', redirect_url: 'https://crm.app/integraciones/callback', onboarding: 'business_app' })
  })

  test('Instagram usa instagram_login por defecto', async () => {
    const { service, calls } = serviceWith([json(200, { authUrl: 'https://instagram.com/oauth' })])
    await service.getConnectUrl({ platform: 'instagram', profileId: 'p1' }, 'https://crm.app/cb')
    expect(query(calls[0].url).loginMethod).toBe('instagram_login')
  })

  test('rechaza WhatsApp sin onboarding sin llamar a Zernio', async () => {
    const { service, calls } = serviceWith([])
    const res = await service.getConnectUrl({ platform: 'whatsapp', profileId: 'p1' } as never, 'https://crm.app/cb')
    expect(res.success).toBe(false)
    expect(calls).toHaveLength(0)
  })

  test('authUrl ausente o no https es un error', async () => {
    const { service } = serviceWith([json(200, { authUrl: 'javascript:alert(1)' })])
    const res = await service.getConnectUrl({ platform: 'facebook', profileId: 'p1' }, 'https://crm.app/cb')
    expect(res).toMatchObject({ success: false, error: { code: 'invalid_auth_url' } })
  })
})

describe('connectWhatsAppCredentials', () => {
  const input = { profileId: 'p1', accessToken: 'EAAG'.padEnd(40, 'x'), wabaId: '123', phoneNumberId: '456' }

  test('envía el PIN y devuelve la cuenta normalizada y el aviso de registro', async () => {
    const { service, calls } = serviceWith([
      json(200, { message: 'ok', registrationWarning: '(#133005) Two step verification PIN mismatch', account: { accountId: 'acc1', platform: 'whatsapp', phoneNumber: '+573001112233' } }),
    ])
    const res = await service.connectWhatsAppCredentials({ ...input, pin: '123456' })
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ ...input, pin: '123456' })
    expect(res).toMatchObject({
      success: true,
      data: { account: { accountId: 'acc1', phoneNumber: '+573001112233' }, registrationWarning: expect.stringContaining('133005') },
    })
  })

  test('omite el PIN vacío y valida el formato', async () => {
    const { service, calls } = serviceWith([json(200, { account: { accountId: 'a' } })])
    await service.connectWhatsAppCredentials({ ...input, pin: '' })
    expect(JSON.parse(String(calls[0].init.body))).not.toHaveProperty('pin')
    const bad = await service.connectWhatsAppCredentials({ ...input, pin: '12' })
    expect(bad).toMatchObject({ success: false, error: { code: 'invalid_request' } })
  })

  test('propaga el código de conflicto de Zernio', async () => {
    const { service } = serviceWith([json(409, { message: 'Already connected', code: 'WHATSAPP_NUMBER_ALREADY_CONNECTED' })])
    const res = await service.connectWhatsAppCredentials(input)
    expect(res).toMatchObject({ success: false, error: { status: 409, code: 'WHATSAPP_NUMBER_ALREADY_CONNECTED' } })
  })
})

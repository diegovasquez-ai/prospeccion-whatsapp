/**
 * @jest-environment node
 */
import {
  backoffDelay,
  cleanApiKey,
  createZernioClient,
  parseErrorBody,
  parseRetryAfter,
} from '../zernio-client'

type FetchArgs = [string, RequestInit]

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers })
}

function timeoutError() {
  const err = new Error('The operation was aborted due to timeout')
  err.name = 'TimeoutError'
  return err
}

/** Cliente con fetch simulado que devuelve las respuestas en orden */
function setup(responses: (Response | Error)[], config: Parameters<typeof createZernioClient>[0] = {}) {
  const calls: FetchArgs[] = []
  const sleeps: number[] = []
  const fetchImpl = jest.fn(async (url: string, init: RequestInit) => {
    calls.push([url, init])
    const next = responses.shift()
    if (!next) throw new Error('sin más respuestas simuladas')
    if (next instanceof Error) throw next
    return next
  }) as unknown as typeof fetch
  const client = createZernioClient({
    apiKey: 'test-key',
    fetchImpl,
    sleep: async (ms) => void sleeps.push(ms),
    random: () => 0.5,
    ...config,
  })
  return { client, calls, sleeps }
}

const headersOf = (init: RequestInit) => init.headers as Record<string, string>

describe('createZernioClient', () => {
  test('envía Bearer token y devuelve data en éxito', async () => {
    const { client, calls } = setup([jsonResponse(200, { id: 'msg_1' })])
    const result = await client.get<{ id: string }>('/accounts', { query: { limit: 5, x: undefined } })
    expect(result).toEqual({ success: true, data: { id: 'msg_1' } })
    expect(calls[0][0]).toBe('https://zernio.com/api/v1/accounts?limit=5')
    expect(headersOf(calls[0][1]).Authorization).toBe('Bearer test-key')
  })

  test('sin API key no llama a la red y devuelve error', async () => {
    const { client, calls } = setup([], { apiKey: '' })
    const prev = process.env.ZERNIO_API_KEY
    delete process.env.ZERNIO_API_KEY
    const result = await client.get('/x')
    process.env.ZERNIO_API_KEY = prev
    expect(result).toMatchObject({ success: false, error: { code: 'missing_api_key', status: 0 } })
    expect(calls).toHaveLength(0)
  })

  test('no reintenta un 400 y conserva message y code de Zernio', async () => {
    const { client, calls } = setup([jsonResponse(400, { message: 'Template not approved', code: 'template_rejected' })])
    const result = await client.post('/whatsapp/messages', { to: '+57300' })
    expect(calls).toHaveLength(1)
    expect(result).toEqual({
      success: false,
      error: { status: 400, code: 'template_rejected', message: 'Template not approved', retryAfter: null },
    })
  })

  test('reintenta 503 con backoff exponencial y termina en éxito', async () => {
    const { client, calls, sleeps } = setup([
      jsonResponse(503, 'Service Unavailable'),
      jsonResponse(502, ''),
      jsonResponse(200, { ok: true }),
    ])
    const result = await client.get('/status')
    expect(result.success).toBe(true)
    expect(calls).toHaveLength(3)
    expect(sleeps).toEqual([250, 500]) // random 0.5 × 500·2^n
  })

  test('Retry-After manda sobre el backoff', async () => {
    const { client, sleeps } = setup([
      jsonResponse(429, { message: 'Rate limited' }, { 'Retry-After': '7' }),
      jsonResponse(200, {}),
    ])
    await client.get('/x')
    expect(sleeps).toEqual([7000])
  })

  test('Retry-After demasiado largo no se espera: devuelve el error con retryAfter', async () => {
    const { client, calls } = setup([jsonResponse(429, { message: 'Slow down' }, { 'Retry-After': '3600' })])
    const result = await client.get('/x')
    expect(calls).toHaveLength(1)
    expect(result).toMatchObject({ success: false, error: { status: 429, retryAfter: 3600 } })
  })

  test('reintenta timeout y agota reintentos sin lanzar', async () => {
    const { client, calls } = setup([timeoutError(), timeoutError(), timeoutError(), timeoutError()])
    const result = await client.get('/slow')
    expect(calls).toHaveLength(4) // 1 + 3 reintentos
    expect(result).toMatchObject({ success: false, error: { status: 0, code: 'timeout' } })
  })

  test('noRetry hace un solo intento', async () => {
    const { client, calls } = setup([jsonResponse(503, 'down')])
    const result = await client.get('/x', { noRetry: true })
    expect(calls).toHaveLength(1)
    expect(result.success).toBe(false)
  })

  test('error de red no reintenta y no lanza', async () => {
    const { client, calls } = setup([new TypeError('fetch failed')])
    const result = await client.get('/x')
    expect(calls).toHaveLength(1)
    expect(result).toMatchObject({ success: false, error: { code: 'network_error', message: 'fetch failed' } })
  })

  test('reutiliza la misma Idempotency-Key en los reintentos', async () => {
    const { client, calls } = setup([jsonResponse(504, ''), jsonResponse(200, {})])
    await client.post('/m', { a: 1 }, { idempotencyKey: 'lead-123-msg-1', headers: { 'X-Trace': 't1' } })
    expect(headersOf(calls[0][1])['Idempotency-Key']).toBe('lead-123-msg-1')
    expect(headersOf(calls[1][1])['Idempotency-Key']).toBe('lead-123-msg-1')
    expect(headersOf(calls[1][1])['X-Trace']).toBe('t1')
  })

  test('genera Idempotency-Key automática en POST y la mantiene entre intentos', async () => {
    const { client, calls } = setup([timeoutError(), jsonResponse(201, { id: 'x' })])
    await client.post('/m', { a: 1 })
    const key = headersOf(calls[0][1])['Idempotency-Key']
    expect(key).toMatch(/^[0-9a-f-]{36}$/)
    expect(headersOf(calls[1][1])['Idempotency-Key']).toBe(key)
  })

  test('un header extra no puede reemplazar la autorización', async () => {
    const { client, calls } = setup([jsonResponse(200, {})])
    await client.get('/x', { headers: { Authorization: 'Bearer otra' } })
    expect(headersOf(calls[0][1]).Authorization).toBe('Bearer test-key')
  })

  test('el timeout real aborta la request (AbortSignal)', async () => {
    const fetchImpl = ((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(init.signal?.reason))
      })) as unknown as typeof fetch
    const client = createZernioClient({ apiKey: 'k', fetchImpl })
    const result = await client.get('/hang', { timeoutMs: 30, noRetry: true })
    expect(result).toMatchObject({ success: false, error: { code: 'timeout', status: 0 } })
  })

  test('respuesta vacía en éxito devuelve data null', async () => {
    const { client } = setup([new Response(null, { status: 204 })])
    expect(await client.delete('/x/1')).toEqual({ success: true, data: null })
  })
})

describe('utilidades', () => {
  test('parseErrorBody: JSON anidado, texto crudo y cuerpo vacío', () => {
    expect(parseErrorBody('{"error":{"message":"Bad","code":"bad"}}', 422)).toEqual({ code: 'bad', message: 'Bad' })
    expect(parseErrorBody('<html>Bad Gateway</html>', 502)).toEqual({ code: 'http_502', message: '<html>Bad Gateway</html>' })
    expect(parseErrorBody('', 500)).toEqual({ code: 'http_500', message: 'HTTP 500' })
  })

  test('parseRetryAfter: segundos y fecha HTTP', () => {
    expect(parseRetryAfter('120')).toBe(120)
    const now = Date.parse('2026-11-14T10:00:00Z')
    expect(parseRetryAfter('Sat, 14 Nov 2026 10:00:30 GMT', now)).toBe(30)
    expect(parseRetryAfter('basura')).toBeNull()
    expect(parseRetryAfter(null)).toBeNull()
  })

  test('backoffDelay crece y tiene tope', () => {
    expect(backoffDelay(0, () => 1)).toBe(500)
    expect(backoffDelay(3, () => 1)).toBe(4000)
    expect(backoffDelay(10, () => 1)).toBe(8000)
  })
})

describe('cleanApiKey', () => {
  test('quita espacios, saltos de línea, comillas y "Bearer " pegados por error', () => {
    expect(cleanApiKey('  sk_live_123\n')).toBe('sk_live_123')
    expect(cleanApiKey('"sk_live_123"')).toBe('sk_live_123')
    expect(cleanApiKey('Bearer sk_live_123')).toBe('sk_live_123')
    expect(cleanApiKey(undefined)).toBe('')
  })
})

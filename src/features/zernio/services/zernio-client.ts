/**
 * Cliente HTTP para la API de Zernio (https://zernio.com/api/v1).
 *
 * SOLO SERVIDOR: lee ZERNIO_API_KEY (sin prefijo NEXT_PUBLIC_, así que Next.js
 * nunca la incluye en el bundle del navegador). Úsalo desde route handlers,
 * server actions, webhooks o workers.
 *
 * Nunca lanza excepciones: todo vuelve como ZernioResult. Un webhook o worker
 * que muere por una excepción no atrapada pierde el mensaje.
 */

export const ZERNIO_BASE_URL = 'https://zernio.com/api/v1'

const DEFAULT_TIMEOUT_MS = 15_000
const DEFAULT_MAX_RETRIES = 3
const BASE_BACKOFF_MS = 500
const MAX_BACKOFF_MS = 8_000
/** Retry-After mayor que esto no se espera en proceso: se devuelve al llamador */
const DEFAULT_MAX_RETRY_AFTER_MS = 60_000

/** Solo estos estados se reintentan; un 4xx de validación daría el mismo error */
const RETRYABLE_STATUS = new Set([429, 502, 503, 504])

export interface ZernioError {
  /** Estado HTTP; 0 si no hubo respuesta (timeout, red, configuración) */
  status: number
  code: string
  message: string
  /** Segundos indicados por Retry-After, si la respuesta lo trae */
  retryAfter: number | null
}

export type ZernioResult<T> = { success: true; data: T } | { success: false; error: ZernioError }

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ZernioRequestOptions {
  method?: HttpMethod
  /** Se serializa como JSON */
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
  /** Headers extra (se combinan con los del cliente) */
  headers?: Record<string, string>
  /**
   * Zernio replica la respuesta original si se repite la misma clave en 24 h.
   * Se reutiliza en todos los reintentos de esta llamada. En POST/PATCH sin
   * clave se genera una automáticamente; pasa la tuya (p. ej. el id del
   * mensaje en tu BD) para que también cubra reintentos entre procesos.
   */
  idempotencyKey?: string
  /** Un solo intento, sin reintentos (para llamadores con poco tiempo, p. ej. webhooks) */
  noRetry?: boolean
  timeoutMs?: number
}

export interface ZernioClientConfig {
  apiKey?: string
  baseUrl?: string
  maxRetries?: number
  maxRetryAfterMs?: number
  /** Inyectables para tests */
  fetchImpl?: typeof fetch
  sleep?: (ms: number) => Promise<void>
  random?: () => number
}

type Attempt<T> = { result: ZernioResult<T>; retryable: boolean }

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function failure(status: number, code: string, message: string, retryAfter: number | null = null) {
  return { success: false as const, error: { status, code, message, retryAfter } }
}

/** Retry-After admite segundos ("120") o fecha HTTP; devuelve segundos o null */
export function parseRetryAfter(header: string | null, now: number = Date.now()): number | null {
  if (!header) return null
  const trimmed = header.trim()
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Math.max(0, Number(trimmed))
  const date = Date.parse(trimmed)
  if (Number.isNaN(date)) return null
  return Math.max(0, Math.ceil((date - now) / 1000))
}

/** Backoff exponencial con jitter completo: aleatorio entre 0 y base·2^intento */
export function backoffDelay(attempt: number, random: () => number = Math.random): number {
  const ceiling = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** attempt)
  return Math.round(random() * ceiling)
}

/** Extrae message y code del cuerpo de error; si no es JSON, conserva el texto crudo */
export function parseErrorBody(raw: string, status: number): { code: string; message: string } {
  const fallback = { code: `http_${status}`, message: raw.trim() || `HTTP ${status}` }
  try {
    const json: unknown = JSON.parse(raw)
    if (!json || typeof json !== 'object') return fallback
    const obj = json as Record<string, unknown>
    const nested = obj.error && typeof obj.error === 'object' ? (obj.error as Record<string, unknown>) : null
    const message =
      (typeof obj.message === 'string' && obj.message) ||
      (typeof nested?.message === 'string' && nested.message) ||
      (typeof obj.error === 'string' && obj.error) ||
      fallback.message
    const code =
      (typeof obj.code === 'string' && obj.code) ||
      (typeof nested?.code === 'string' && nested.code) ||
      fallback.code
    return { code, message }
  } catch {
    return fallback
  }
}

function buildUrl(baseUrl: string, path: string, query?: ZernioRequestOptions['query']): string {
  const url = `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
  const params = new URLSearchParams()
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, String(value))
  })
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

function buildHeaders(apiKey: string, options: ZernioRequestOptions): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
    Authorization: `Bearer ${apiKey}`,
  }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey
  return headers
}

/** El abort de AbortSignal.timeout es un DOMException, que no siempre es instanceof Error */
function isTimeout(error: unknown): boolean {
  const name = typeof error === 'object' && error !== null ? (error as { name?: unknown }).name : undefined
  return name === 'TimeoutError' || name === 'AbortError'
}

async function readSuccess<T>(response: Response): Promise<ZernioResult<T>> {
  const raw = await response.text()
  if (!raw) return { success: true, data: null as T }
  try {
    return { success: true, data: JSON.parse(raw) as T }
  } catch {
    return failure(response.status, 'invalid_json', `Respuesta no es JSON válido: ${raw.slice(0, 500)}`)
  }
}

async function attemptOnce<T>(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Attempt<T>> {
  try {
    const response = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
    if (response.ok) return { result: await readSuccess<T>(response), retryable: false }
    const retryAfter = parseRetryAfter(response.headers.get('retry-after'))
    const { code, message } = parseErrorBody(await response.text().catch(() => ''), response.status)
    return {
      result: failure(response.status, code, message, retryAfter),
      retryable: RETRYABLE_STATUS.has(response.status),
    }
  } catch (error) {
    if (isTimeout(error)) {
      return { result: failure(0, 'timeout', `Sin respuesta en ${timeoutMs} ms`), retryable: true }
    }
    const message = error instanceof Error ? error.message : String(error)
    return { result: failure(0, 'network_error', message), retryable: false }
  }
}

export function createZernioClient(config: ZernioClientConfig = {}) {
  const apiKey = config.apiKey ?? process.env.ZERNIO_API_KEY ?? ''
  const baseUrl = config.baseUrl ?? process.env.ZERNIO_BASE_URL ?? ZERNIO_BASE_URL
  const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES
  const maxRetryAfterMs = config.maxRetryAfterMs ?? DEFAULT_MAX_RETRY_AFTER_MS
  const fetchImpl = config.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args))
  const sleep = config.sleep ?? defaultSleep
  const random = config.random ?? Math.random

  /** Espera antes del siguiente intento; null = no reintentar */
  function nextDelay(error: ZernioError, attempt: number): number | null {
    if (error.retryAfter == null) return backoffDelay(attempt, random)
    const ms = error.retryAfter * 1000
    return ms <= maxRetryAfterMs ? ms : null
  }

  async function request<T = unknown>(path: string, options: ZernioRequestOptions = {}): Promise<ZernioResult<T>> {
    if (!apiKey) return failure(0, 'missing_api_key', 'Falta la variable de entorno ZERNIO_API_KEY')
    const method = options.method ?? (options.body === undefined ? 'GET' : 'POST')
    // Un POST que expira pudo llegar a Zernio: sin clave, reintentarlo duplicaría el mensaje
    const idempotencyKey =
      options.idempotencyKey ?? (method === 'POST' || method === 'PATCH' ? crypto.randomUUID() : undefined)
    let init: RequestInit
    try {
      init = {
        method,
        headers: buildHeaders(apiKey, { ...options, idempotencyKey }),
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      }
    } catch (error) {
      return failure(0, 'invalid_request', error instanceof Error ? error.message : 'Body no serializable')
    }
    const url = buildUrl(baseUrl, path, options.query)
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    const retries = options.noRetry ? 0 : maxRetries

    for (let attempt = 0; ; attempt++) {
      const { result, retryable } = await attemptOnce<T>(fetchImpl, url, init, timeoutMs)
      if (result.success || !retryable || attempt >= retries) return result
      const delay = nextDelay(result.error, attempt)
      if (delay == null) return result
      await sleep(delay)
    }
  }

  return {
    request,
    get: <T = unknown>(path: string, options?: Omit<ZernioRequestOptions, 'method' | 'body'>) =>
      request<T>(path, { ...options, method: 'GET' }),
    post: <T = unknown>(path: string, body?: unknown, options?: Omit<ZernioRequestOptions, 'method' | 'body'>) =>
      request<T>(path, { ...options, method: 'POST', body }),
    patch: <T = unknown>(path: string, body?: unknown, options?: Omit<ZernioRequestOptions, 'method' | 'body'>) =>
      request<T>(path, { ...options, method: 'PATCH', body }),
    delete: <T = unknown>(path: string, options?: Omit<ZernioRequestOptions, 'method' | 'body'>) =>
      request<T>(path, { ...options, method: 'DELETE' }),
  }
}

export type ZernioClient = ReturnType<typeof createZernioClient>

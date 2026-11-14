/** Código de país por defecto para números sin prefijo internacional (Colombia) */
export const DEFAULT_COUNTRY_CODE = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE ?? '57'

/**
 * Normaliza un número a formato internacional "+<dígitos>".
 * Números locales de 10 dígitos reciben el código de país por defecto.
 */
export function normalizePhone(raw: string, countryCode: string = DEFAULT_COUNTRY_CODE): string {
  const trimmed = raw.trim()
  let digits = trimmed.replace(/\D/g, '')
  if (!digits) return ''
  if (trimmed.startsWith('00')) digits = digits.slice(2)
  else if (!trimmed.startsWith('+') && digits.length === 10) digits = countryCode + digits
  return `+${digits}`
}

/** Enlace wa.me con mensaje opcional precargado */
export function whatsappUrl(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, '')
  const text = message?.trim() ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${digits}${text}`
}

/** Enlace para llamar desde el móvil */
export function telUrl(phone: string): string {
  return `tel:${normalizePhone(phone)}`
}

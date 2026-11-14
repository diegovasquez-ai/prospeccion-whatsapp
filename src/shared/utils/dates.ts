import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatDate(iso: string | null | undefined, pattern = "d MMM yyyy"): string {
  if (!iso) return '—'
  return format(new Date(iso), pattern, { locale: es })
}

export function formatDateTime(iso: string | null | undefined): string {
  return formatDate(iso, "d MMM yyyy, HH:mm")
}

/** "Hoy 10:30", "Mañana 09:00", "Ayer", o fecha */
export function formatRelativeDay(iso: string): string {
  const d = new Date(iso)
  const hora = format(d, 'HH:mm')
  if (isToday(d)) return `Hoy ${hora}`
  if (isTomorrow(d)) return `Mañana ${hora}`
  if (isYesterday(d)) return `Ayer ${hora}`
  return format(d, "EEE d MMM, HH:mm", { locale: es })
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return 'Nunca'
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es })
}

/** Valor para <input type="datetime-local"> en hora local */
export function toDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}

export function formatMoney(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: process.env.NEXT_PUBLIC_CURRENCY ?? 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

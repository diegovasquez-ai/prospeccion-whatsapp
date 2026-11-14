import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/shared/utils/cn'

export function KpiTile({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: string | number
  hint?: string
  tone?: 'default' | 'danger' | 'success'
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border-primary bg-background-card p-4">
      <p className="text-xs text-text-secondary">{label}</p>
      <p
        title={String(value)}
        className={cn(
          'mt-1 truncate text-lg sm:text-2xl font-bold tabular-nums',
          tone === 'danger' ? 'text-red-400' : tone === 'success' ? 'text-vivid-green' : 'text-text-primary'
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-text-tertiary">{hint}</p>}
    </div>
  )
}

export interface BarItem {
  label: string
  value: number
  colorClass?: string
}

/** Barras horizontales con etiqueta y valor (embudo, fuentes) */
export function BarList({ items, emptyLabel = 'Sin datos' }: { items: BarItem[]; emptyLabel?: string }) {
  const max = Math.max(...items.map((i) => i.value), 1)
  if (items.every((i) => i.value === 0)) return <p className="py-6 text-center text-sm text-text-tertiary">{emptyLabel}</p>
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[minmax(0,9rem)_1fr_2.5rem] items-center gap-3 text-sm">
          <span className="truncate text-text-secondary" title={item.label}>{item.label}</span>
          <div className="h-2.5 rounded-full bg-background-elevated">
            <div
              className={cn('h-full rounded-full transition-all', item.colorClass ?? 'bg-vivid-cyan')}
              style={{ width: `${(item.value / max) * 100}%`, minWidth: item.value > 0 ? 6 : 0 }}
            />
          </div>
          <span className="text-right tabular-nums text-text-primary">{item.value}</span>
        </li>
      ))}
    </ul>
  )
}

/** Columnas por día con la actividad registrada */
export function DailyActivityChart({ data }: { data: { fecha: string; total: number }[] }) {
  const max = Math.max(...data.map((d) => d.total), 1)
  const total = data.reduce((acc, d) => acc + d.total, 0)
  if (total === 0) return <p className="py-10 text-center text-sm text-text-tertiary">Aún no hay actividad registrada en este periodo</p>
  return (
    <div>
      <div className="flex h-36 items-end gap-[3px]" role="img" aria-label={`Actividad diaria: ${total} acciones`}>
        {data.map((d) => {
          const fecha = format(new Date(`${d.fecha}T12:00:00`), "EEE d MMM", { locale: es })
          return (
            <div key={d.fecha} className="group relative flex h-full flex-1 items-end">
              <div
                className={cn('w-full rounded-t-sm', d.total > 0 ? 'bg-vivid-cyan/80 group-hover:bg-vivid-cyan' : 'bg-background-elevated')}
                style={{ height: d.total > 0 ? `${(d.total / max) * 100}%` : 3 }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-background-elevated border border-border-secondary px-2 py-1 text-[11px] text-text-primary group-hover:block">
                {fecha}: {d.total}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-text-tertiary">
        <span>{format(new Date(`${data[0].fecha}T12:00:00`), 'd MMM', { locale: es })}</span>
        <span>Hoy</span>
      </div>
    </div>
  )
}

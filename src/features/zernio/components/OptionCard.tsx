import { cn } from '@/shared/utils/cn'

interface OptionCardProps {
  name: string
  value: string
  checked: boolean
  onChange: (value: string) => void
  title: string
  badge?: string
  children: React.ReactNode
}

/** Opción tipo radio con explicación visible (no esconder decisiones importantes) */
export function OptionCard({ name, value, checked, onChange, title, badge, children }: OptionCardProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors',
        checked ? 'border-vivid-cyan/60 bg-vivid-cyan/5' : 'border-border-primary hover:border-border-secondary'
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="mt-1 h-4 w-4 accent-vivid-cyan"
      />
      <div className="space-y-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-text-primary">
          {title}
          {badge && (
            <span className="rounded-full bg-vivid-green/15 px-2 py-0.5 text-[11px] text-vivid-green">{badge}</span>
          )}
        </p>
        <div className="text-xs leading-relaxed text-text-secondary">{children}</div>
      </div>
    </label>
  )
}

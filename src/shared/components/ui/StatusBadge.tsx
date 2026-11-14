import { cn } from '@/shared/utils/cn'

interface StatusBadgeProps {
  label: string
  variant?: 'default' | 'success' | 'warning' | 'info' | 'danger'
  className?: string
}

const VARIANTS = {
  default: 'bg-text-tertiary/15 text-text-secondary border-text-tertiary/30',
  success: 'bg-vivid-green/10 text-vivid-green border-vivid-green/30',
  warning: 'bg-vivid-yellow/10 text-vivid-yellow border-vivid-yellow/30',
  info: 'bg-vivid-cyan/10 text-vivid-cyan border-vivid-cyan/30',
  danger: 'bg-red-500/10 text-red-400 border-red-500/30',
}

export function StatusBadge({ label, variant = 'default', className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        VARIANTS[variant],
        className
      )}
    >
      {label}
    </span>
  )
}

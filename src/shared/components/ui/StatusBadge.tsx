import { cn } from '@/shared/utils/cn'

interface StatusBadgeProps {
  label: string
  variant?: 'default' | 'success' | 'warning' | 'info' | 'danger'
  size?: 'sm' | 'md'
  className?: string
}

export function StatusBadge({
  label,
  variant = 'default',
  size = 'sm',
  className,
}: StatusBadgeProps) {
  const variantClasses = {
    default: 'bg-text-tertiary/20 text-text-primary border border-text-tertiary/30',
    success: 'bg-vivid-green/20 text-vivid-green border border-vivid-green/30',
    warning: 'bg-vivid-yellow/20 text-vivid-yellow border border-vivid-yellow/30',
    info: 'bg-vivid-blue/20 text-vivid-blue border border-vivid-blue/30',
    danger: 'bg-vivid-magenta/20 text-vivid-magenta border border-vivid-magenta/30',
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {label}
    </span>
  )
}

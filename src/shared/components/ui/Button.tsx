import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'whatsapp'
export type ButtonSize = 'sm' | 'md' | 'icon'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-vivid-cyan text-background hover:bg-vivid-cyan/85 font-semibold',
  secondary: 'bg-background-card border border-border-secondary text-text-primary hover:border-text-tertiary',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-background-card',
  danger: 'bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500/20',
  whatsapp: 'bg-vivid-green text-background hover:bg-vivid-green/85 font-semibold',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  icon: 'h-9 w-9 justify-center',
}

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(
    'inline-flex items-center rounded-lg transition-colors whitespace-nowrap',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vivid-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    VARIANTS[variant],
    SIZES[size],
    className
  )
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, className, children, disabled, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
})

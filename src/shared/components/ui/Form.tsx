import { forwardRef } from 'react'
import { cn } from '@/shared/utils/cn'

const CONTROL =
  'w-full rounded-lg bg-background-elevated border border-border-secondary px-3 text-sm text-text-primary ' +
  'placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-vivid-cyan/60 focus:border-vivid-cyan transition-colors'

interface FieldProps {
  label: string
  htmlFor?: string
  error?: string | null
  hint?: string
  className?: string
  children: React.ReactNode
}

export function Field({ label, htmlFor, error, hint, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-text-secondary">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-text-tertiary">{hint}</p>
      ) : null}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(CONTROL, 'h-10', className)} {...props} />
  }
)

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 3, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={cn(CONTROL, 'py-2 resize-y', className)} {...props} />
  }
)

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, options, placeholder, ...props },
  ref
) {
  return (
    <select ref={ref} className={cn(CONTROL, 'h-10 pr-8', className)} {...props}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
})

/** Convierte un Record de etiquetas en opciones para <Select> */
export function toOptions<K extends string>(labels: Record<K, string>) {
  return (Object.keys(labels) as K[]).map((value) => ({ value, label: labels[value] }))
}

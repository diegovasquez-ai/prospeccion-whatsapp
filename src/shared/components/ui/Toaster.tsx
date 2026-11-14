'use client'

import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useToastStore } from '@/shared/stores/toast-store'
import { cn } from '@/shared/utils/cn'

const ICONS = {
  success: <CheckCircle2 size={18} className="text-vivid-green" />,
  error: <XCircle size={18} className="text-red-400" />,
  info: <Info size={18} className="text-vivid-cyan" />,
}

export function Toaster() {
  const { toasts, dismiss } = useToastStore()
  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] flex flex-col gap-2 sm:w-96"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 rounded-lg border bg-background-elevated px-4 py-3 shadow-xl text-sm',
            t.variant === 'error' ? 'border-red-500/40' : 'border-border-secondary'
          )}
        >
          {ICONS[t.variant]}
          <p className="flex-1 text-text-primary">{t.message}</p>
          <button onClick={() => dismiss(t.id)} aria-label="Cerrar aviso" className="text-text-tertiary hover:text-text-primary">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}

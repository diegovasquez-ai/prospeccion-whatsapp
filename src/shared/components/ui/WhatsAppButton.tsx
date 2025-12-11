import { MessageCircle } from 'lucide-react'
import { cn } from '@/shared/utils/cn'

interface WhatsAppButtonProps {
  phoneNumber: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'icon' | 'button'
}

export function WhatsAppButton({
  phoneNumber,
  className,
  size = 'md',
  variant = 'button',
}: WhatsAppButtonProps) {
  const cleanNumber = phoneNumber.replace(/\D/g, '')
  const whatsappUrl = `https://wa.me/${cleanNumber}`

  const sizeClasses = {
    sm: variant === 'icon' ? 'p-1' : 'px-2 py-1 text-xs',
    md: variant === 'icon' ? 'p-2' : 'px-3 py-2 text-sm',
    lg: variant === 'icon' ? 'p-3' : 'px-4 py-2 text-base',
  }

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  }

  if (variant === 'icon') {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-vivid-green text-background hover:bg-vivid-green/80 transition-all shadow-md shadow-vivid-green/30 hover:shadow-lg hover:shadow-vivid-green/40',
          sizeClasses[size],
          className
        )}
        title="Abrir en WhatsApp"
      >
        <MessageCircle size={iconSizes[size]} />
      </a>
    )
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-2 rounded-lg bg-vivid-green text-background hover:bg-vivid-green/80 transition-all shadow-md shadow-vivid-green/30 hover:shadow-lg hover:shadow-vivid-green/40 font-medium',
        sizeClasses[size],
        className
      )}
    >
      <MessageCircle size={iconSizes[size]} />
      <span>Abrir WhatsApp</span>
    </a>
  )
}

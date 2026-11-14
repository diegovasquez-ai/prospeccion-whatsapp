'use client'

import { MessageCircle } from 'lucide-react'
import { useCrmUi } from '@/shared/stores/crm-ui-store'
import { Button } from './Button'

interface WhatsAppButtonProps {
  leadId: string
  variant?: 'icon' | 'button'
  className?: string
}

/** Abre el compositor de WhatsApp (plantillas + registro en historial) */
export function WhatsAppButton({ leadId, variant = 'button', className }: WhatsAppButtonProps) {
  const openWhatsApp = useCrmUi((s) => s.openWhatsApp)
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    openWhatsApp(leadId)
  }
  if (variant === 'icon') {
    return (
      <Button
        variant="whatsapp"
        size="icon"
        onClick={handleClick}
        onPointerDown={(e) => e.stopPropagation()}
        className={className ?? 'h-8 w-8 rounded-full'}
        title="Contactar por WhatsApp"
        aria-label="Contactar por WhatsApp"
      >
        <MessageCircle size={16} />
      </Button>
    )
  }
  return (
    <Button variant="whatsapp" onClick={handleClick} className={className}>
      <MessageCircle size={16} /> WhatsApp
    </Button>
  )
}

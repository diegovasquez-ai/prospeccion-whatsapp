'use client'

import { LeadFormModal } from '@/features/leads/components/LeadFormModal'
import { WhatsAppComposer } from '@/features/whatsapp/components/WhatsAppComposer'
import { ActividadFormModal } from '@/features/actividades/components/ActividadFormModal'
import { SeguimientoFormModal } from '@/features/seguimientos/components/SeguimientoFormModal'

/** Diálogos que cualquier pantalla puede abrir mediante useCrmUi() */
export function GlobalDialogs() {
  return (
    <>
      <LeadFormModal />
      <WhatsAppComposer />
      <ActividadFormModal />
      <SeguimientoFormModal />
    </>
  )
}

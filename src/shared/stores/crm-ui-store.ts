import { create } from 'zustand'

/**
 * Estado de los diálogos globales del CRM. Se guardan solo IDs para que
 * cualquier pantalla pueda abrir un diálogo sin depender de otras features.
 */
interface CrmUiState {
  /** 'new' = crear contacto; id = editar; null = cerrado */
  leadForm: string | null
  whatsappLeadId: string | null
  actividadForm: { leadId: string | null; tipo?: string } | null
  seguimientoForm: { leadId: string | null; seguimientoId?: string } | null
  openLeadForm: (id?: string) => void
  openWhatsApp: (leadId: string) => void
  openActividadForm: (leadId?: string | null, tipo?: string) => void
  openSeguimientoForm: (leadId?: string | null, seguimientoId?: string) => void
  closeAll: () => void
}

const CLOSED = { leadForm: null, whatsappLeadId: null, actividadForm: null, seguimientoForm: null }

export const useCrmUi = create<CrmUiState>((set) => ({
  ...CLOSED,
  openLeadForm: (id) => set({ ...CLOSED, leadForm: id ?? 'new' }),
  openWhatsApp: (leadId) => set({ ...CLOSED, whatsappLeadId: leadId }),
  openActividadForm: (leadId = null, tipo) => set({ ...CLOSED, actividadForm: { leadId, tipo } }),
  openSeguimientoForm: (leadId = null, seguimientoId) =>
    set({ ...CLOSED, seguimientoForm: { leadId, seguimientoId } }),
  closeAll: () => set(CLOSED),
}))

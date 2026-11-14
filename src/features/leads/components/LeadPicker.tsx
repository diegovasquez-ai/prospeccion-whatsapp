'use client'

import { Select } from '@/shared/components/ui/Form'
import { useLeads } from '../hooks/useLeads'

interface LeadPickerProps {
  id: string
  value: string
  onChange: (leadId: string) => void
}

/** Selector de contacto para formularios abiertos sin contacto preseleccionado */
export function LeadPicker({ id, value, onChange }: LeadPickerProps) {
  const { all } = useLeads()
  const options = [...all]
    .sort((a, b) => a.nombre_negocio.localeCompare(b.nombre_negocio, 'es'))
    .map((l) => ({
      value: l.id,
      label: l.nombre_contacto ? `${l.nombre_negocio} · ${l.nombre_contacto}` : l.nombre_negocio,
    }))
  return (
    <Select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Selecciona un contacto…"
      options={options}
    />
  )
}

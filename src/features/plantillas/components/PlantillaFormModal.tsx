'use client'

import { useRef, useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Field, Input, Select, Textarea, toOptions } from '@/shared/components/ui/Form'
import { Modal } from '@/shared/components/ui/Modal'
import { renderTemplate } from '@/shared/utils/template'
import { useSavePlantilla } from '../hooks/usePlantillas'
import {
  CATEGORIA_PLANTILLA_LABELS,
  VARIABLES_PLANTILLA,
  type CategoriaPlantilla,
  type Plantilla,
} from '../types'

const EJEMPLO = { nombre_negocio: 'Panadería La Espiga', nombre_contacto: 'Laura', ciudad: 'Bogotá', sector: 'alimentos' }

interface PlantillaFormModalProps {
  plantilla: Plantilla | null
  onClose: () => void
}

export function PlantillaFormModal({ plantilla, onClose }: PlantillaFormModalProps) {
  const [nombre, setNombre] = useState(plantilla?.nombre ?? '')
  const [categoria, setCategoria] = useState<CategoriaPlantilla>(plantilla?.categoria ?? 'primer_contacto')
  const [contenido, setContenido] = useState(plantilla?.contenido ?? '')
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const guardar = useSavePlantilla()

  const insertarVariable = (clave: string) => {
    const el = textareaRef.current
    const start = el?.selectionStart ?? contenido.length
    const end = el?.selectionEnd ?? contenido.length
    setContenido(contenido.slice(0, start) + clave + contenido.slice(end))
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + clave.length, start + clave.length)
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !contenido.trim()) return setError('Nombre y mensaje son obligatorios')
    guardar.mutate(
      { id: plantilla?.id, input: { nombre: nombre.trim(), categoria, contenido: contenido.trim() } },
      { onSuccess: onClose }
    )
  }

  return (
    <Modal
      open
      size="lg"
      title={plantilla ? 'Editar plantilla' : 'Nueva plantilla'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="plantilla-form" loading={guardar.isPending}>Guardar</Button>
        </>
      }
    >
      <form id="plantilla-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre *" htmlFor="pl-nombre">
            <Input id="pl-nombre" autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Seguimiento a los 3 días" />
          </Field>
          <Field label="Categoría" htmlFor="pl-cat">
            <Select id="pl-cat" value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaPlantilla)} options={toOptions(CATEGORIA_PLANTILLA_LABELS)} />
          </Field>
        </div>
        <Field label="Mensaje *" htmlFor="pl-contenido">
          <Textarea ref={textareaRef} id="pl-contenido" rows={6} value={contenido} onChange={(e) => setContenido(e.target.value)} placeholder="Hola {contacto}, …" />
        </Field>
        <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
          Insertar variable:
          {VARIABLES_PLANTILLA.map((v) => (
            <Button key={v.clave} size="sm" variant="secondary" onClick={() => insertarVariable(v.clave)} title={v.descripcion}>
              {v.clave}
            </Button>
          ))}
        </div>
        {contenido.trim() && (
          <div>
            <p className="mb-1 text-xs text-text-tertiary">Vista previa (con datos de ejemplo)</p>
            <div className="rounded-lg rounded-tl-none bg-emerald-900/40 border border-emerald-700/40 p-3 text-sm text-text-primary whitespace-pre-line">
              {renderTemplate(contenido, EJEMPLO)}
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>
    </Modal>
  )
}

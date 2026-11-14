'use client'

import { useState } from 'react'
import { Copy, FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog'
import { Card, EmptyState, ErrorState, LoadingState, Page, PageHeader } from '@/shared/components/ui/Layout'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { toast } from '@/shared/stores/toast-store'
import { PlantillaFormModal } from '@/features/plantillas/components/PlantillaFormModal'
import { useDeletePlantilla, usePlantillas } from '@/features/plantillas/hooks/usePlantillas'
import { CATEGORIA_PLANTILLA_LABELS, type Plantilla } from '@/features/plantillas/types'

export default function PlantillasPage() {
  const { data: plantillas = [], isLoading, error } = usePlantillas()
  const eliminar = useDeletePlantilla()
  const [editando, setEditando] = useState<Plantilla | 'nueva' | null>(null)
  const [aEliminar, setAEliminar] = useState<Plantilla | null>(null)

  const copiar = async (p: Plantilla) => {
    try {
      await navigator.clipboard.writeText(p.contenido)
      toast.success('Plantilla copiada al portapapeles')
    } catch {
      toast.error('No se pudo copiar. Selecciona el texto manualmente.')
    }
  }

  return (
    <Page>
      <PageHeader
        title="Plantillas de mensajes"
        description="Mensajes comerciales reutilizables. Úsalos desde el botón de WhatsApp de cada contacto."
        actions={<Button onClick={() => setEditando('nueva')}><Plus size={16} /> Nueva plantilla</Button>}
      />

      {isLoading ? <LoadingState /> : error ? <ErrorState error={error} /> : plantillas.length === 0 ? (
        <Card>
          <EmptyState icon={<FileText size={32} />} title="Sin plantillas" description="Crea tu primer mensaje comercial con variables como {contacto} o {negocio}." action={<Button onClick={() => setEditando('nueva')}><Plus size={16} /> Nueva plantilla</Button>} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plantillas.map((p) => (
            <Card key={p.id} className="flex flex-col p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <h2 className="font-medium text-text-primary">{p.nombre}</h2>
                <StatusBadge label={CATEGORIA_PLANTILLA_LABELS[p.categoria] ?? p.categoria} variant="info" />
              </div>
              <p className="flex-1 whitespace-pre-line text-sm text-text-secondary line-clamp-6">{p.contenido}</p>
              <div className="mt-4 flex justify-end gap-1 border-t border-border-primary pt-3">
                <Button variant="ghost" size="sm" onClick={() => copiar(p)}><Copy size={14} /> Copiar</Button>
                <Button variant="ghost" size="sm" onClick={() => setEditando(p)}><Pencil size={14} /> Editar</Button>
                <Button variant="ghost" size="sm" onClick={() => setAEliminar(p)} className="hover:text-red-400"><Trash2 size={14} /> Eliminar</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editando && (
        <PlantillaFormModal
          key={editando === 'nueva' ? 'nueva' : editando.id}
          plantilla={editando === 'nueva' ? null : editando}
          onClose={() => setEditando(null)}
        />
      )}
      <ConfirmDialog
        open={!!aEliminar}
        title="Eliminar plantilla"
        message={`¿Eliminar la plantilla "${aEliminar?.nombre}"?`}
        loading={eliminar.isPending}
        onCancel={() => setAEliminar(null)}
        onConfirm={() => aEliminar && eliminar.mutate(aEliminar.id, { onSuccess: () => setAEliminar(null) })}
      />
    </Page>
  )
}

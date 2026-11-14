'use client'

import { useRef, useState } from 'react'
import { Download, FileUp } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { toast } from '@/shared/stores/toast-store'
import { downloadCsv, parseCsvToObjects } from '@/shared/utils/csv'
import { useImportLeads, useLeads } from '../hooks/useLeads'
import { CSV_TEMPLATE, detectColumns, mapCsvRows, type CsvImportRow } from '../utils/lead-csv'

interface CsvImportModalProps {
  open: boolean
  onClose: () => void
}

const MAX_BYTES = 5 * 1024 * 1024

export function CsvImportModal({ open, onClose }: CsvImportModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [rows, setRows] = useState<CsvImportRow[]>([])
  const [columnas, setColumnas] = useState<string[]>([])
  const importar = useImportLeads()
  const { all } = useLeads()
  const existentes = new Set(all.map((l) => l.whatsapp.replace(/\D/g, '')))
  const yaExiste = (r: CsvImportRow) => !!r.lead && existentes.has(r.lead.whatsapp.replace(/\D/g, ''))

  const validas = rows.filter((r) => r.lead && !yaExiste(r))
  const repetidas = rows.filter(yaExiste)
  const invalidas = rows.filter((r) => r.error)

  const reset = () => {
    setFileName(null)
    setRows([])
    setColumnas([])
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_BYTES) return toast.error('El archivo supera 5 MB')
    const data = parseCsvToObjects(await file.text())
    if (data.length === 0) return toast.error('El archivo está vacío o no tiene encabezados')
    const detected = detectColumns(Object.keys(data[0]))
    if (!detected.whatsapp) return toast.error('No se encontró una columna de WhatsApp/Teléfono')
    setFileName(file.name)
    setColumnas(Object.entries(detected).map(([campo, col]) => `${col} → ${campo}`))
    setRows(mapCsvRows(data))
  }

  const confirmar = () => {
    importar.mutate(
      validas.map((r) => r.lead!),
      {
        onSuccess: ({ importados, duplicados }) => {
          toast.success(
            `${importados} contactos importados${duplicados ? ` · ${duplicados} omitidos por número repetido` : ''}`
          )
          handleClose()
        },
      }
    )
  }

  return (
    <Modal
      open={open}
      size="lg"
      title="Importar contactos desde CSV"
      description="Columnas reconocidas: Negocio, Contacto, WhatsApp/Teléfono, Email, Ciudad, Sector, Fuente, Etapa, Prioridad, Valor, Etiquetas, Observaciones"
      onClose={handleClose}
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
          <Button onClick={confirmar} disabled={validas.length === 0} loading={importar.isPending}>
            Importar {validas.length > 0 ? validas.length : ''} contactos
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => inputRef.current?.click()}>
            <FileUp size={16} /> {fileName ? 'Elegir otro archivo' : 'Elegir archivo CSV'}
          </Button>
          <Button variant="ghost" onClick={() => downloadCsv('plantilla-contactos.csv', CSV_TEMPLATE)}>
            <Download size={16} /> Descargar plantilla de ejemplo
          </Button>
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        </div>

        {fileName && (
          <div className="space-y-3 text-sm">
            <p className="text-text-secondary">
              <span className="text-text-primary font-medium">{fileName}</span> · {rows.length} filas ·{' '}
              <span className="text-vivid-green">{validas.length} válidas</span>
              {repetidas.length > 0 && <span className="text-vivid-yellow"> · {repetidas.length} ya existen</span>}
              {invalidas.length > 0 && <span className="text-red-400"> · {invalidas.length} con errores</span>}
            </p>
            <p className="text-xs text-text-tertiary">Columnas detectadas: {columnas.join(' · ')}</p>
            <div className="max-h-64 overflow-auto rounded-lg border border-border-primary">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background-elevated text-text-secondary">
                  <tr>
                    <th className="px-3 py-2 text-left">Fila</th>
                    <th className="px-3 py-2 text-left">Negocio</th>
                    <th className="px-3 py-2 text-left">WhatsApp</th>
                    <th className="px-3 py-2 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 200).map((r) => (
                    <tr key={r.fila} className="border-t border-border-primary">
                      <td className="px-3 py-1.5 text-text-tertiary">{r.fila}</td>
                      <td className="px-3 py-1.5 text-text-primary">{r.lead?.nombre_negocio ?? '—'}</td>
                      <td className="px-3 py-1.5 text-text-secondary">{r.lead?.whatsapp ?? '—'}</td>
                      <td className={r.error ? 'px-3 py-1.5 text-red-400' : yaExiste(r) ? 'px-3 py-1.5 text-vivid-yellow' : 'px-3 py-1.5 text-vivid-green'}>
                        {r.error ?? (yaExiste(r) ? 'Ya existe · se omitirá' : 'OK')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-text-tertiary">Los números que ya existen en el CRM se omiten automáticamente.</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

/**
 * Utilidades CSV sin dependencias.
 * Soporta comillas, saltos de línea dentro de comillas y separador "," o ";"
 * (Excel en español exporta con ";").
 */

export function detectDelimiter(text: string): ',' | ';' {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
  const commas = (firstLine.match(/,/g) ?? []).length
  const semicolons = (firstLine.match(/;/g) ?? []).length
  return semicolons > commas ? ';' : ','
}

export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, '')
  const delimiter = detectDelimiter(text)
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        field += char
      }
      continue
    }
    if (char === '"') inQuotes = true
    else if (char === delimiter) {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += char
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

/** Convierte el CSV en objetos usando la primera fila como encabezados */
export function parseCsvToObjects(input: string): Record<string, string>[] {
  const [headers, ...rows] = parseCsv(input)
  if (!headers) return []
  const keys = headers.map((h) => h.trim())
  return rows.map((row) =>
    Object.fromEntries(keys.map((key, i) => [key, (row[i] ?? '').trim()]))
  )
}

function escapeCell(value: unknown): string {
  if (value == null) return ''
  const str = Array.isArray(value) ? value.join(', ') : String(value)
  return /[",;\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((r) => r.map(escapeCell).join(',')).join('\r\n')
}

/** Descarga un CSV en el navegador (con BOM para que Excel respete las tildes) */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Normaliza un encabezado para compararlo: minúsculas, sin tildes ni espacios */
export function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

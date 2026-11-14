export interface TemplateContext {
  nombre_negocio: string
  nombre_contacto?: string | null
  ciudad?: string | null
  sector?: string | null
}

/**
 * Reemplaza {contacto}, {negocio}, {ciudad} y {sector} con los datos del contacto.
 * Si falta el nombre del contacto usa un saludo neutro.
 */
export function renderTemplate(contenido: string, ctx: TemplateContext): string {
  const values: Record<string, string> = {
    contacto: ctx.nombre_contacto?.trim() || '',
    negocio: ctx.nombre_negocio,
    ciudad: ctx.ciudad?.trim() || 'tu ciudad',
    sector: ctx.sector?.trim() || 'tu sector',
  }
  return contenido
    .replace(/\{(contacto|negocio|ciudad|sector)\}/gi, (_, key: string) => values[key.toLowerCase()])
    .replace(/ +,/g, ',')
    .replace(/ {2,}/g, ' ')
}

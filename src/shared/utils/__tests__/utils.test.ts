import { normalizePhone, whatsappUrl } from '../phone'
import { renderTemplate } from '../template'
import { parseCsv, parseCsvToObjects, toCsv } from '../csv'

describe('normalizePhone', () => {
  test('agrega código de país a números locales de 10 dígitos', () => {
    expect(normalizePhone('300 123 4567', '57')).toBe('+573001234567')
  })
  test('respeta números con prefijo internacional', () => {
    expect(normalizePhone('+56 9 1234 5678')).toBe('+56912345678')
    expect(normalizePhone('0056912345678')).toBe('+56912345678')
  })
  test('devuelve vacío si no hay dígitos', () => {
    expect(normalizePhone('abc')).toBe('')
  })
})

describe('whatsappUrl', () => {
  test('codifica el mensaje', () => {
    expect(whatsappUrl('+57 300 123', 'Hola ¿qué tal?')).toBe(
      'https://wa.me/57300123?text=Hola%20%C2%BFqu%C3%A9%20tal%3F'
    )
  })
  test('sin mensaje no agrega parámetro', () => {
    expect(whatsappUrl('+573001234567')).toBe('https://wa.me/573001234567')
  })
})

describe('renderTemplate', () => {
  test('reemplaza variables', () => {
    const out = renderTemplate('Hola {contacto}, vi {negocio} en {ciudad}', {
      nombre_negocio: 'La Espiga',
      nombre_contacto: 'Laura',
      ciudad: 'Bogotá',
    })
    expect(out).toBe('Hola Laura, vi La Espiga en Bogotá')
  })
  test('sin nombre de contacto deja un saludo limpio', () => {
    expect(renderTemplate('Hola {contacto}, ¿cómo estás?', { nombre_negocio: 'X' })).toBe(
      'Hola, ¿cómo estás?'
    )
  })
})

describe('CSV', () => {
  test('parsea comillas, comas y saltos de línea', () => {
    const rows = parseCsv('a,b\n"hola, mundo","línea1\nlínea2"\n')
    expect(rows).toEqual([['a', 'b'], ['hola, mundo', 'línea1\nlínea2']])
  })
  test('detecta separador punto y coma (Excel en español)', () => {
    expect(parseCsvToObjects('Negocio;WhatsApp\nCafé;3001234567')).toEqual([
      { Negocio: 'Café', WhatsApp: '3001234567' },
    ])
  })
  test('ida y vuelta conserva los valores', () => {
    const csv = toCsv(['x', 'y'], [['a "b"', 'c;d']])
    expect(parseCsv(csv)).toEqual([['x', 'y'], ['a "b"', 'c;d']])
  })
})

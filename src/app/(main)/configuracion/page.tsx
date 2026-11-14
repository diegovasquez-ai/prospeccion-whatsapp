'use client'

import { useState } from 'react'
import { CheckCircle2, Database, RefreshCw, XCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button'
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog'
import { Card, Page, PageHeader } from '@/shared/components/ui/Layout'
import { resetDemoData } from '@/shared/lib/repository'
import { isSupabaseConfigured, supabase } from '@/shared/lib/supabase'
import { DEFAULT_COUNTRY_CODE } from '@/shared/utils/phone'

const TABLAS = [
  { nombre: 'leads', migracion: '001' },
  { nombre: 'actividades', migracion: '002' },
  { nombre: 'seguimientos', migracion: '004' },
  { nombre: 'plantillas', migracion: '004' },
]

type Resultado = { tabla: string; ok: boolean; detalle: string }

async function probarConexion(): Promise<Resultado[]> {
  const db = supabase!
  const resultados = await Promise.all(
    TABLAS.map(async ({ nombre, migracion }) => {
      const { error, count } = await db.from(nombre).select('id', { count: 'exact', head: true })
      return error
        ? { tabla: nombre, ok: false, detalle: `${error.message} (¿falta la migración ${migracion}?)` }
        : { tabla: nombre, ok: true, detalle: `${count ?? 0} registros` }
    })
  )
  const { error } = await db.from('leads').select('prioridad').limit(1)
  resultados.push({
    tabla: 'columnas nuevas de leads',
    ok: !error,
    detalle: error ? 'Faltan columnas: ejecuta la migración 004' : 'Migración 004 aplicada',
  })
  return resultados
}

function Paso({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-vivid-cyan/15 text-xs font-semibold text-vivid-cyan">{n}</span>
      <div className="text-sm text-text-secondary">{children}</div>
    </li>
  )
}

export default function ConfiguracionPage() {
  const [resultados, setResultados] = useState<Resultado[] | null>(null)
  const [probando, setProbando] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const probar = async () => {
    setProbando(true)
    try {
      setResultados(await probarConexion())
    } catch (err) {
      setResultados([{ tabla: 'conexión', ok: false, detalle: err instanceof Error ? err.message : 'Error de red' }])
    } finally {
      setProbando(false)
    }
  }

  return (
    <Page className="max-w-3xl">
      <PageHeader title="Configuración" description="Conexión con Supabase y preferencias" />

      <Card className="p-5 mb-6">
        <div className="flex items-start gap-3">
          <Database className={isSupabaseConfigured ? 'text-vivid-green' : 'text-vivid-yellow'} size={22} />
          <div className="flex-1">
            <h2 className="font-semibold text-text-primary">
              {isSupabaseConfigured ? 'Conectado a Supabase' : 'Modo demo (sin Supabase)'}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {isSupabaseConfigured
                ? `Proyecto: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`
                : 'Los datos se guardan solo en este navegador. Conecta tu Supabase para guardarlos en la nube y usarlos desde cualquier dispositivo.'}
            </p>
            {isSupabaseConfigured && (
              <Button variant="secondary" size="sm" className="mt-3" loading={probando} onClick={probar}>
                <RefreshCw size={14} /> Probar conexión y tablas
              </Button>
            )}
            {resultados && (
              <ul className="mt-3 space-y-1.5">
                {resultados.map((r) => (
                  <li key={r.tabla} className="flex items-start gap-2 text-sm">
                    {r.ok ? <CheckCircle2 size={16} className="mt-0.5 text-vivid-green" /> : <XCircle size={16} className="mt-0.5 text-red-400" />}
                    <span className="text-text-primary">{r.tabla}:</span>
                    <span className="text-text-secondary">{r.detalle}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-5 mb-6">
        <h2 className="mb-4 font-semibold text-text-primary">Cómo conectar tu Supabase</h2>
        <ol className="space-y-3">
          <Paso n={1}>En Supabase abre <strong>Project Settings → API</strong> y copia la <em>Project URL</em> y la <em>anon / publishable key</em>.</Paso>
          <Paso n={2}>Crea el archivo <code className="text-vivid-cyan">.env.local</code> en la raíz del proyecto (usa <code>.env.example</code> como guía) con <code>NEXT_PUBLIC_SUPABASE_URL</code> y <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.</Paso>
          <Paso n={3}>En <strong>SQL Editor</strong> ejecuta, en orden, los archivos de <code>supabase/migrations/</code> que aún no hayas aplicado (001 → 004).</Paso>
          <Paso n={4}>En <strong>Authentication → Users</strong> crea tu usuario (email y contraseña) y desactiva los registros públicos en <strong>Authentication → Sign In / Providers</strong>.</Paso>
          <Paso n={5}>Reinicia el servidor (<code>npm run dev</code>), inicia sesión y pulsa <em>Probar conexión</em>.</Paso>
        </ol>
      </Card>

      <Card className="p-5">
        <h2 className="mb-2 font-semibold text-text-primary">Preferencias</h2>
        <p className="text-sm text-text-secondary">
          Código de país por defecto para números locales: <strong className="text-text-primary">+{DEFAULT_COUNTRY_CODE}</strong>.
          Cámbialo con <code>NEXT_PUBLIC_DEFAULT_COUNTRY_CODE</code> en <code>.env.local</code>.
        </p>
        {!isSupabaseConfigured && (
          <div className="mt-4 border-t border-border-primary pt-4">
            <p className="text-sm text-text-secondary mb-2">Restablecer los datos de ejemplo del modo demo (borra todo lo guardado en este navegador).</p>
            <Button variant="danger" onClick={() => setConfirmReset(true)}>Restablecer datos demo</Button>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmReset}
        title="Restablecer datos demo"
        message="Se borrarán los contactos, historial, seguimientos y plantillas guardados en este navegador y se cargarán los datos de ejemplo."
        confirmLabel="Restablecer"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemoData()
          window.location.reload()
        }}
      />
    </Page>
  )
}

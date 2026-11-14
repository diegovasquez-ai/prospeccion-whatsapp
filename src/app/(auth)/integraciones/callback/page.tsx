'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { connectErrorMessage } from '@/features/zernio/types'
import { ZERNIO_POPUP_MESSAGE, type ZernioPopupMessage } from '@/features/zernio/services/zernio-api'

/** Página a la que Zernio vuelve en el popup tras el OAuth */
function Callback() {
  const params = useSearchParams()
  const accountId = params.get('accountId')
  const error = params.get('error')
  const [sinVentana, setSinVentana] = useState(false)

  useEffect(() => {
    const message: ZernioPopupMessage = { type: ZERNIO_POPUP_MESSAGE, accountId, error }
    // BroadcastChannel solo llega a pestañas de nuestro mismo origen y no depende de
    // window.opener (que Meta puede cortar con COOP)
    const channel = new BroadcastChannel(ZERNIO_POPUP_MESSAGE)
    channel.postMessage(message)
    channel.close()
    window.close()
    // Si el navegador no deja cerrar la ventana, se muestra un enlace de vuelta
    const t = setTimeout(() => setSinVentana(true), 500)
    return () => clearTimeout(t)
  }, [accountId, error])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 text-center">
      <div className="max-w-sm space-y-3">
        <p className="text-lg font-semibold text-text-primary">
          {error ? 'No se pudo conectar' : 'Cuenta conectada'}
        </p>
        {error && <p className="text-sm text-red-400">{connectErrorMessage(error, error)}</p>}
        {sinVentana && (
          <a href="/integraciones" className="text-sm text-vivid-cyan underline">
            Volver a Integraciones
          </a>
        )}
      </div>
    </main>
  )
}

export default function ZernioCallbackPage() {
  return (
    <Suspense fallback={null}>
      <Callback />
    </Suspense>
  )
}

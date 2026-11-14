'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/shared/stores/toast-store'
import { connectErrorMessage, type ConnectRequest } from '../types'
import { ZERNIO_POPUP_MESSAGE, zernioApi, type ZernioPopupMessage } from '../services/zernio-api'

export const ZERNIO_ACCOUNTS_KEY = ['zernio', 'accounts'] as const

export function useZernioProfiles() {
  return useQuery({ queryKey: ['zernio', 'profiles'], queryFn: zernioApi.profiles, retry: false })
}

export function useZernioAccounts() {
  return useQuery({ queryKey: ZERNIO_ACCOUNTS_KEY, queryFn: zernioApi.syncAccounts, retry: false })
}

const POPUP_FEATURES = 'popup=yes,width=620,height=760'

/**
 * Abre el OAuth en un popup. La ventana se abre en el mismo clic (si se abre
 * después del await, el navegador la bloquea) y luego se le asigna la authUrl.
 */
export function useZernioOAuth() {
  const queryClient = useQueryClient()

  return useCallback(
    async (input: ConnectRequest): Promise<void> => {
      const popup = window.open('about:blank', 'zernio-connect', POPUP_FEATURES)
      if (!popup) {
        toast.error('El navegador bloqueó la ventana. Permite ventanas emergentes para este sitio.')
        return
      }
      try {
        popup.location.href = await zernioApi.connectUrl(input)
      } catch (error) {
        popup.close()
        toast.error(error instanceof Error ? error.message : 'No se pudo iniciar la conexión')
        return
      }
      const refresh = () => queryClient.invalidateQueries({ queryKey: ZERNIO_ACCOUNTS_KEY })
      listenForCallback(popup, refresh)
    },
    [queryClient]
  )
}

const LISTEN_MS = 10 * 60 * 1000

/**
 * Escucha el resultado por BroadcastChannel (mismo origen) en vez de
 * window.opener: las páginas de Meta envían COOP y pueden cortar el vínculo
 * entre popup y ventana. Si el popup "aparece" cerrado se sincroniza igual,
 * pero se sigue escuchando hasta 10 minutos por si el OAuth sigue en curso.
 */
function listenForCallback(popup: Window, refresh: () => void) {
  const channel = new BroadcastChannel(ZERNIO_POPUP_MESSAGE)
  const stop = () => {
    channel.close()
    clearInterval(timer)
    clearTimeout(timeout)
  }
  channel.onmessage = (event: MessageEvent<ZernioPopupMessage>) => {
    if (event.data?.type !== ZERNIO_POPUP_MESSAGE) return
    if (event.data.error) toast.error(connectErrorMessage(event.data.error, `No se pudo conectar: ${event.data.error}`))
    else toast.success('Cuenta conectada')
    refresh()
    stop()
  }
  const timer = setInterval(() => {
    if (!popup.closed) return
    clearInterval(timer)
    refresh()
  }, 1000)
  const timeout = setTimeout(stop, LISTEN_MS)
}

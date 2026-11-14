import { handleConnect } from '@/features/zernio/server/handlers'

export const dynamic = 'force-dynamic'

/** Devuelve solo { authUrl } para abrir el OAuth en un popup */
export const POST = handleConnect

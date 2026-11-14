import { handleSyncAccounts } from '@/features/zernio/server/handlers'

export const dynamic = 'force-dynamic'

/** Lista las cuentas conectadas en Zernio y las sincroniza con la BD */
export const GET = handleSyncAccounts
